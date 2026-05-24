import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Asisten Hunian <noreply@asistenhunian.com>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) {
    console.log("[Email] Mock send to:", to, "Subject:", subject);
    return { success: true, id: "mock" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Send failed:", error);
    return { success: false, error };
  }

  return { success: true, id: data?.id };
}
