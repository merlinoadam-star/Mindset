import { supabase } from "./supabase";
import { isUuid } from "./store";
import type { VideoEntry } from "../types";

/**
 * Phase 2B.6 — video sync.
 *
 * Videos are big blobs, so they live in Supabase Storage rather than a
 * Postgres column. The `videos` DB table holds metadata + the storage
 * path. The athlete's local IndexedDB copy is kept for fast offline
 * playback; the cloud copy is what coaches and parents see.
 *
 * Path convention: `<athlete_id>/<video_id>.<ext>`
 * Bucket: `videos` (private, RLS-gated).
 */

const BUCKET = "videos";

function extFromMime(mime: string): string {
  if (!mime) return "mp4";
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-matroska": "mkv",
    "video/ogg": "ogv",
  };
  return map[mime] ?? mime.split("/")[1]?.split(";")[0] ?? "mp4";
}

function storagePathFor(athleteId: string, video: VideoEntry): string {
  const ext = extFromMime(video.mimeType);
  return `${athleteId}/${video.id}.${ext}`;
}

/**
 * Upload the binary to Storage + insert/update the DB row. Safe to call
 * for already-uploaded videos (upsert). Returns the storage path used.
 */
export async function uploadVideoToCloud(
  athleteId: string,
  video: VideoEntry,
  blob: Blob
): Promise<string | null> {
  if (!supabase) return null;
  if (!isUuid(video.id)) return null;

  const path = storagePathFor(athleteId, video);

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: video.mimeType || "video/mp4",
      upsert: true,
    });
  if (uploadErr) {
    console.error("Video upload failed", uploadErr);
    return null;
  }

  const row = {
    id: video.id,
    athlete_id: athleteId,
    uploader_account_id: athleteId, // athletes upload their own for now
    title: video.title,
    description: video.description ?? null,
    tag: video.tag,
    duration_sec: video.durationSec ?? null,
    thumbnail_data_url: video.thumbnailDataUrl ?? null,
    storage_path: path,
    mime_type: video.mimeType || "video/mp4",
    size_bytes: video.sizeBytes,
    author: video.author ?? "athlete",
    audience: video.audience ?? "self",
    self_notes: video.selfNotes ?? null,
    marked_for_review: video.markedForReview ?? false,
    reviewed_at: video.reviewedAt ?? null,
    reviewer_notes: video.reviewerNotes ?? null,
  };

  const { error: rowErr } = await supabase
    .from("videos")
    .upsert(row, { onConflict: "id" });

  if (rowErr) {
    console.error("Video row upsert failed", rowErr);
    return null;
  }
  return path;
}

/** Update just the metadata on an already-uploaded video (no blob re-upload). */
export async function updateVideoMetadata(
  video: VideoEntry
): Promise<void> {
  if (!supabase) return;
  if (!isUuid(video.id)) return;

  await supabase
    .from("videos")
    .update({
      title: video.title,
      description: video.description ?? null,
      tag: video.tag,
      author: video.author ?? "athlete",
      audience: video.audience ?? "self",
      self_notes: video.selfNotes ?? null,
      marked_for_review: video.markedForReview ?? false,
      reviewed_at: video.reviewedAt ?? null,
      reviewer_notes: video.reviewerNotes ?? null,
    })
    .eq("id", video.id);
}

/** Delete both the storage object and the DB row. */
export async function deleteVideoFromCloud(
  videoId: string,
  storagePath: string | undefined
): Promise<void> {
  if (!supabase) return;
  if (!isUuid(videoId)) return;

  if (storagePath) {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) console.error("Video storage remove failed", error);
  }
  await supabase.from("videos").delete().eq("id", videoId);
}

// ---------------------------------------------------------------------------
// Reads for the coach / parent side
// ---------------------------------------------------------------------------

export interface DbVideoRow {
  id: string;
  athlete_id: string;
  uploader_account_id: string;
  title: string;
  description: string | null;
  tag: string;
  duration_sec: number | null;
  thumbnail_data_url: string | null;
  storage_path: string | null;
  mime_type: string;
  size_bytes: number;
  author: string | null;
  audience: string | null;
  self_notes: string | null;
  marked_for_review: boolean | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

export async function fetchVideosForAthlete(
  athleteId: string
): Promise<DbVideoRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchVideosForAthlete error", error);
    return [];
  }
  return (data ?? []) as DbVideoRow[];
}

/** Get a short-lived signed URL for playback. Valid for 60 minutes by default. */
export async function getVideoSignedUrl(
  storagePath: string,
  expiresInSec = 3600
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSec);
  if (error) {
    console.error("createSignedUrl error", error);
    return null;
  }
  return data.signedUrl;
}
