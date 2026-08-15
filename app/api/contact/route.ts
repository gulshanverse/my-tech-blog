import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestLog = new Map<string, number[]>();

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function allowedToSubmit(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ message: "Please submit the form again with valid details." }, { status: 400 });
  }

  const name = text(payload.name);
  const email = text(payload.email);
  const subject = text(payload.subject);
  const message = text(payload.message);
  const website = text(payload.website);

  // Silently accept bot submissions so the honeypot does not reveal its purpose.
  if (website) return NextResponse.json({ message: "Message sent successfully. Thanks for reaching out!" });

  if (!allowedToSubmit(clientKey(request))) {
    return NextResponse.json({ message: "Too many attempts. Please wait a little before trying again." }, { status: 429 });
  }

  if (!name || name.length > 100) return NextResponse.json({ message: "Please provide a valid name." }, { status: 400 });
  if (!validEmail(email) || email.length > 254) return NextResponse.json({ message: "Please provide a valid email address." }, { status: 400 });
  if (subject.length > 160) return NextResponse.json({ message: "Please keep the subject under 160 characters." }, { status: 400 });
  if (message.length < 10 || message.length > 5000) return NextResponse.json({ message: "Please keep your message between 10 and 5,000 characters." }, { status: 400 });

  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ message: "Contact delivery is not configured yet. Please use the direct email link below instead." }, { status: 503 });
  }

  try {
    const delivery = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message, source: "gulshanblogs.vercel.app/contact" }),
      cache: "no-store",
    });

    if (!delivery.ok) throw new Error(`Delivery provider returned ${delivery.status}`);
    return NextResponse.json({ message: "Message sent successfully. Thanks for reaching out!" });
  } catch {
    return NextResponse.json({ message: "The message could not be delivered right now. Please use the direct email link below instead." }, { status: 502 });
  }
}
