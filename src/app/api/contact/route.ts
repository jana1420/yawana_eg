import { NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendContactMessageEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  const { data: settings } = await supabase
    .from("site_settings")
    .select("contact_email")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const toEmail =
    settings?.contact_email ||
    process.env.CONTACT_EMAIL ||
    process.env.EMAIL_FROM ||
    "";

  if (!toEmail) {
    return NextResponse.json(
      { error: "Contact email is not configured" },
      { status: 500 },
    );
  }

  try {
    await sendContactMessageEmail({
      to: toEmail,
      fromEmail: email,
      name,
      message,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not send message. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
