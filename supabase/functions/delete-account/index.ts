// Supabase Edge Function: delete-account
// Deploy via Supabase Dashboard → Edge Functions → New function → paste this file.
// Uses the auto-injected SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; no extra
// secrets needed.
//
// Verifies the caller's JWT, then uses the service role to:
//   1. Delete their rows from every user-scoped table
//   2. Wipe their video blobs from the `videos` storage bucket
//   3. Delete the auth user itself
// Returns { ok: true } on success.

// @ts-expect-error — Supabase Functions runtime provides these
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error — Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Extract JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Missing authorization", {
      status: 401,
      headers: corsHeaders,
    });
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify the JWT and pull the user id out server-side
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response("Invalid session", {
      status: 401,
      headers: corsHeaders,
    });
  }
  const userId = userData.user.id;

  const warnings: string[] = [];
  const safe = async (
    label: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    op: Promise<{ error: any } | { error: null }>
  ) => {
    const { error } = await op;
    if (error) {
      warnings.push(`${label}: ${error.message ?? String(error)}`);
      console.warn(`delete-account ${label} failed`, error);
    }
  };

  // --- Row deletions. Ordered so FK cascades do most of the work.
  // Tables keyed by account_id (push subs)
  await safe(
    "push_subscriptions",
    admin.from("push_subscriptions").delete().eq("account_id", userId)
  );

  // Tables keyed by either athlete_id or author_id
  await safe(
    "feedback (author)",
    admin.from("feedback").delete().eq("author_id", userId)
  );
  await safe(
    "feedback (athlete)",
    admin.from("feedback").delete().eq("athlete_id", userId)
  );
  await safe(
    "weekly_focus (author)",
    admin.from("weekly_focus").delete().eq("author_id", userId)
  );
  await safe(
    "weekly_focus (athlete)",
    admin.from("weekly_focus").delete().eq("athlete_id", userId)
  );

  // Connections — user may be on either side
  await safe(
    "connections (athlete)",
    admin.from("connections").delete().eq("athlete_account_id", userId)
  );
  await safe(
    "connections (other)",
    admin.from("connections").delete().eq("other_account_id", userId)
  );

  // Delete the athlete row — this cascades to all athlete-scoped tables
  // (practices, matches, habits, etc.) via FK on delete cascade.
  await safe("athletes", admin.from("athletes").delete().eq("id", userId));

  // --- Storage: list & delete every blob under videos/<userId>/
  try {
    const { data: files, error: listErr } = await admin.storage
      .from("videos")
      .list(userId, { limit: 1000 });
    if (listErr) {
      warnings.push(`videos list: ${listErr.message}`);
    } else if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${userId}/${f.name}`);
      const { error: rmErr } = await admin.storage.from("videos").remove(paths);
      if (rmErr) warnings.push(`videos remove: ${rmErr.message}`);
    }
  } catch (e) {
    warnings.push(`videos: ${String(e)}`);
  }

  // Delete the accounts row after everything else
  await safe("accounts", admin.from("accounts").delete().eq("id", userId));

  // Finally, delete the auth user. If this fails, the DB is already
  // wiped but the user could still sign back in — that's why we leave
  // it for last and return a specific error.
  const { error: authDelErr } = await admin.auth.admin.deleteUser(userId);
  if (authDelErr) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Couldn't delete auth user: ${authDelErr.message}`,
        warnings,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, warnings }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
});
