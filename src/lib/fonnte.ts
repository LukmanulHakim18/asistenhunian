export async function sendWhatsApp(to: string, message: string) {
  const token = process.env.FONNTE_TOKEN;

  if (!token || token === "placeholder-fonnte-token") {
    console.log("[WhatsApp] Mock send to:", to, "Message:", message.substring(0, 50));
    return { success: true };
  }

  // Normalize phone: remove leading 0 and add 62
  const phone = to.replace(/^0/, "62").replace(/\D/g, "");

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({ target: phone, message }),
    });

    const data = await res.json() as { status: boolean; reason?: string };
    if (!data.status) {
      console.error("[WhatsApp] Send failed:", data.reason);
      return { success: false, error: data.reason };
    }

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp] Request failed:", error);
    return { success: false, error };
  }
}
