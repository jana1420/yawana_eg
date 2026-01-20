export type TelegramOrderItem = {
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type TelegramShippingAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  height?: string | null;
};

export type SendNewOrderTelegramNotificationOptions = {
  orderId: string;
  total: number;
  items: TelegramOrderItem[];
  customerEmail: string;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: TelegramShippingAddress;
};

export async function sendNewOrderTelegramNotification(
  options: SendNewOrderTelegramNotificationOptions,
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return;
  }

  const totalFormatted = (options.total / 100).toFixed(2);

  const lines = options.items
    .map((item) => {
      const parts: string[] = [];
      if (item.size) parts.push(`Size ${item.size}`);
      if (item.color) parts.push(`Color ${item.color}`);

      const labelSuffix = parts.length > 0 ? ` (${parts.join(" · ")})` : "";

      return `- ${item.name}${labelSuffix} x ${item.quantity} — ${(item.subtotal / 100).toFixed(2)} EGP`;
    })
    .join("\n");

  const customerLabel =
    options.customerName && options.customerName.trim().length > 0
      ? `${options.customerName} <${options.customerEmail}>`
      : options.customerEmail;

  const phoneLine = options.customerPhone
    ? `Phone: ${options.customerPhone}\n`
    : "";

  let addressBlock = "";
  if (options.shippingAddress) {
    const a = options.shippingAddress;
    const addressLines = [
      a.addressLine1,
      a.addressLine2 && a.addressLine2.trim().length > 0
        ? a.addressLine2
        : null,
      `${a.city}${a.state ? ", " + a.state : ""}`,
      a.country,
    ].filter((x): x is string => Boolean(x && x.trim().length > 0));

    addressBlock = `\nShipping address:\n${addressLines.join("\n")}`;
  }

  const heightLine =
    options.shippingAddress &&
    typeof options.shippingAddress.height === "string" &&
    options.shippingAddress.height.trim().length > 0
      ? `Height: ${options.shippingAddress.height.trim()}\n`
      : "";

  const text = `New order received\n\nOrder ID: ${options.orderId}\nCustomer: ${customerLabel}\n${phoneLine}${heightLine}Total: ${totalFormatted} EGP\n\nItems:\n${lines}${addressBlock}\n\nPayment method: Cash on delivery.`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch {
    // Ignore Telegram errors so checkout is not blocked
  }
}
