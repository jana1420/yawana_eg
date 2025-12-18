import { Resend } from "resend";

type OrderEmailItem = {
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type SendOrderConfirmationOptions = {
  to: string;
  orderId: string;
  total: number;
  items: OrderEmailItem[];
};

export async function sendOrderConfirmationEmail(
  options: SendOrderConfirmationOptions,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return;
  }

  const resend = new Resend(apiKey);

  const totalFormatted = (options.total / 100).toFixed(2);

  const textLines = options.items
    .map(
      (item) =>
        `${item.name}${
          item.size || item.color
            ? ` (${[
                item.size ? `Size ${item.size}` : null,
                item.color ? `Color ${item.color}` : null,
              ]
                .filter(Boolean)
                .join(" · ")})`
            : ""
        } x ${
          item.quantity
        } — ${(item.subtotal / 100).toFixed(2)} EGP`,
    )
    .join("\n");

  const text = `Thank you for your order!\n\nOrder ID: ${options.orderId}\nTotal: ${totalFormatted} EGP\n\nItems:\n${textLines}\n\nPayment method: Cash on delivery.`;

  const itemsRowsHtml = options.items
    .map(
      (item) => `
            <tr>
              <td>
                ${item.name}${(() => {
                  const parts = [
                    item.size ? `Size ${item.size}` : null,
                    item.color ? `Color ${item.color}` : null,
                  ].filter(Boolean);
                  if (parts.length === 0) return "";
                  return `<span style="color:#71717a;font-size:11px;"> · ${parts.join(
                    " · ",
                  )}</span>`;
                })()}
              </td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">${(item.subtotal / 100).toFixed(
                2,
              )} EGP</td>
            </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Order confirmation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b;">
    <div style="width:100%;padding:24px 12px;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
        <div style="padding:20px 24px 16px;border-bottom:1px solid #e4e4e7;">
          <div style="font-size:18px;font-weight:600;letter-spacing:-0.02em;">RimalTold</div>
          <p style="margin:8px 0 0;font-size:14px;color:#71717a;">
            Hi there, your order <span style="font-weight:600;">#${options.orderId}</span> is confirmed.
          </p>
        </div>
        <div style="padding:20px 24px 24px;">
          <span style="display:inline-block;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;background-color:#f4f4f5;color:#52525b;padding:4px 10px;border-radius:999px;">Order confirmed</span>
          <h2 style="font-size:18px;font-weight:600;margin:14px 0 4px;">Thank you for your order!</h2>
          <p style="margin:0 0 12px;font-size:14px;color:#71717a;">We’re preparing your items and will let you know as soon as they are on their way.</p>

          <h3 style="font-size:14px;font-weight:600;margin:18px 0 8px;">Order summary</h3>
          <ul style="list-style:none;margin:8px 0 0;padding:0;font-size:13px;">
            <li><span style="font-weight:600;">Order ID:</span> #${options.orderId}</li>
            <li><span style="font-weight:600;">Total:</span> ${totalFormatted} EGP</li>
            <li><span style="font-weight:600;">Payment method:</span> Cash on delivery</li>
          </ul>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#a1a1aa;border-bottom:1px solid #e4e4e7;">Item</th>
                <th style="text-align:center;padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#a1a1aa;border-bottom:1px solid #e4e4e7;">Qty</th>
                <th style="text-align:right;padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#a1a1aa;border-bottom:1px solid #e4e4e7;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div style="border-top:1px solid #e4e4e7;margin:16px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;">
            <span>Total</span>
            <span>${totalFormatted} EGP</span>
          </div>

          <p style="margin-top:10px;font-size:12px;color:#16a34a;">
            <span style="display:inline-block;padding:2px 8px;font-size:11px;border-radius:999px;background-color:#ecfdf3;color:#166534;">Cash on delivery</span>
            &nbsp; You’ll pay when your order arrives.
          </p>

          <p style="margin-top:14px;font-size:12px;color:#a1a1aa;">If you have any questions, just reply to this email and we’ll be happy to help.</p>
        </div>
      </div>
      <p style="margin-top:12px;font-size:12px;color:#a1a1aa;text-align:center;">© ${new Date().getFullYear()} RimalTold. All rights reserved.</p>
    </div>
  </body>
</html>`;

  await resend.emails.send({
    from,
    to: options.to,
    subject: `Your order ${options.orderId}`,
    text,
    html,
  });
}

type SendNewOrderNotificationOptions = {
  to: string;
  orderId: string;
  total: number;
  items: OrderEmailItem[];
  customerEmail: string;
  customerName?: string | null;
  customerPhone?: string | null;
};

export async function sendNewOrderNotificationEmail(
  options: SendNewOrderNotificationOptions,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return;
  }

  const resend = new Resend(apiKey);

  const lines = options.items
    .map(
      (item) =>
        `${item.name}${
          item.size || item.color
            ? ` (${[
                item.size ? `Size ${item.size}` : null,
                item.color ? `Color ${item.color}` : null,
              ]
                .filter(Boolean)
                .join(" · ")})`
            : ""
        } x ${
          item.quantity
        } — ${(item.subtotal / 100).toFixed(2)} EGP`,
    )
    .join("\n");

  const totalFormatted = (options.total / 100).toFixed(2);
  const customerLabel =
    options.customerName && options.customerName.trim().length > 0
      ? `${options.customerName} <${options.customerEmail}>`
      : options.customerEmail;

  const phoneLine = options.customerPhone
    ? `Phone: ${options.customerPhone}\n`
    : "";

  const text = `New order received\n\nOrder ID: ${options.orderId}\nCustomer: ${customerLabel}\n${phoneLine}Total: ${totalFormatted} EGP\n\nItems:\n${lines}\n\nPayment method: Cash on delivery.`;

  await resend.emails.send({
    from,
    to: options.to,
    subject: `New order ${options.orderId}`,
    text,
  });
}

type SendContactMessageOptions = {
  to: string;
  fromEmail: string;
  name: string;
  message: string;
};

export async function sendContactMessageEmail(
  options: SendContactMessageOptions,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return;
  }

  const resend = new Resend(apiKey);

  const text = `New contact form submission\n\nFrom: ${options.name} <${options.fromEmail}>\n\nMessage:\n${options.message}`;

  await resend.emails.send({
    from,
    to: options.to,
    replyTo: options.fromEmail,
    subject: `New contact form message from ${options.name}`,
    text,
  });
}
