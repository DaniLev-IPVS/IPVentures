import { contact } from "@/lib/content";

/**
 * Contact form → email to info@ipventures.io via Resend (ipventures.io is a
 * verified sending domain). Needs RESEND_API_KEY in the environment.
 */

const TO = process.env.CONTACT_TO ?? contact.email;
const FROM = process.env.CONTACT_FROM ?? "IP Ventures Website <website@ipventures.io>";

type Body = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  reason?: unknown;
  message?: unknown;
  /** Honeypot: real people never see or fill this field. */
  website?: unknown;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bots that fill the hidden field get a quiet success and no email.
  if (str(body.website, 200)) return Response.json({ ok: true });

  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  const reason = str(body.reason, 60);
  const message = str(body.message, 4000);

  const errors: Record<string, string> = {};
  if (!name) errors.name = contact.errors.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = contact.errors.email;
  if (phone.replace(/\D/g, "").length < 7) errors.phone = contact.errors.phone;
  if (!contact.reasons.includes(reason)) errors.reason = contact.errors.reason;
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[contact] RESEND_API_KEY is not set");
    return Response.json({ error: "Email is not configured" }, { status: 500 });
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Reason", reason],
    ["Message", message || "—"],
  ];
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 16px">New inquiry from ipventures.io</h2>
      <table cellpadding="8" style="border-collapse:collapse">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="color:#666;vertical-align:top">${k}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">Reply to this email to answer ${esc(name)} directly.</p>
    </div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `${reason}: ${name}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("[contact] Resend failed", res.status, await res.text().catch(() => ""));
    return Response.json({ error: "Could not send" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
