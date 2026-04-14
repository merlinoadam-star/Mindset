// Supabase Edge Function: send-push
// Deploy via Supabase Dashboard → Edge Functions → New function → paste this file.
// Required function secrets (Dashboard → Project Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY   — same value as the client-side VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY  — from `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT      — a mailto: or https:// URL identifying you
//                        (e.g. "mailto:you@email.com")
//
// Called from the client with the Supabase-js SDK:
//   await supabase.functions.invoke("send-push", {
//     body: { toAccountId, title, body, url, tag }
//   });

// @ts-expect-error — Deno-style jsr import resolved at runtime on Supabase
import webpush from "https://esm.sh/web-push@3.6.7";
// @ts-expect-error — Supabase Functions runtime provides these
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// CORS headers — browsers send an OPTIONS preflight before the actual POST,
// and all responses to cross-origin JS need an allow-origin header or the
// browser throws the response away.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  toAccountId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /**
   * Key into the recipient's notification_prefs JSONB. If the pref is
   * explicitly set to false, this call is a no-op. Missing key = ON.
   * Known keys: "notes", "cheers", "weeklyFocus", "milestones".
   */
  prefKey?: string;
}

// @ts-expect-error — Deno global
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Only accept POST + authed users
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const { toAccountId, title, body, url, tag, prefKey } = payload;
  if (!toAccountId || !title) {
    return new Response("Missing toAccountId or title", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Notification preferences check — if the recipient has explicitly
  // disabled this pref key, return a 200 without sending. Missing key
  // defaults to ON.
  if (prefKey) {
    const { data: account } = await admin
      .from("accounts")
      .select("notification_prefs")
      .eq("id", toAccountId)
      .maybeSingle();
    const prefs = (account?.notification_prefs ?? {}) as Record<string, unknown>;
    if (prefs[prefKey] === false) {
      return new Response(
        JSON.stringify({ sent: 0, reason: `pref ${prefKey} disabled` }),
        {
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }
  }

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("account_id", toAccountId);

  if (error) {
    return new Response(`DB error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
  if (!subs || subs.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no subscriptions" }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  const notificationPayload = JSON.stringify({
    title,
    body,
    url: url || "/",
    tag,
  });

  const results = await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          notificationPayload
        );
        // Update last_used
        await admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id);
        return { ok: true };
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404 / 410: subscription is dead — clean it up
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
        return { ok: false, err: String(err) };
      }
    })
  );

  const sent = results.filter((r) => r.ok).length;
  return new Response(
    JSON.stringify({ sent, total: subs.length, results }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
});
