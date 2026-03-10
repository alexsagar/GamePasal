const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
  }
});

const isEmailConfigured = () => {
  return Boolean(
    (process.env.EMAIL_USER || process.env.SMTP_USER) &&
    (process.env.EMAIL_PASS || process.env.SMTP_PASS)
  );
};

function resolveRecipient(order, user) {
  return (
    order?.shippingAddress?.email ||
    order?.guestEmail ||
    order?.user?.email ||
    order?.userId?.email ||
    user?.email ||
    null
  );
}

function brandWrapper({ title, preheader, contentHtml }) {
  const siteName = process.env.SITE_NAME || 'GamePasal';
  const primary = '#ff4757';

  return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${title}</title>
  <style>
    body { background: #0b0b0b; color:#e5e7eb; font-family: Inter, Arial, sans-serif; margin:0; padding:0; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .card { background:#0f0f0f; border:1px solid #222; border-radius: 16px; overflow:hidden; }
    .header { padding: 24px; background: linear-gradient(135deg, ${primary}, #ff6b7a); color:#fff; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing:.5px; }
    .content { padding: 24px; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
    .muted { color:#9ca3af; font-size: 14px; margin:0 0 16px 0; }
    .divider { height:1px; background:#222; margin:16px 0; }
    .footer { color:#9ca3af; font-size:12px; padding: 0 24px 24px; text-align:center; }
    .btn { display:inline-block; background:${primary}; color:#0b0b0b; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:700; }
    ul { padding-left: 18px; }
    code { background:#111827; color:#e5e7eb; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">${siteName}</div>
      </div>
      <div class="content">
        <h1 class="title">${title}</h1>
        ${preheader ? `<p class="muted">${preheader}</p>` : ''}
        ${contentHtml}
      </div>
      <div class="footer">If you need help, reply to this email.</div>
    </div>
  </div>
</body>
</html>`;
}

async function sendMail(mailOptions, { skipMessage, successMessage, failureMessage }) {
  if (!isEmailConfigured()) {
    console.log('SMTP not configured, skipping email');
    return;
  }

  if (!mailOptions.to) {
    console.log(skipMessage);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    if (successMessage) {
      console.log(successMessage);
    }
  } catch (error) {
    console.error(failureMessage, error.message);
  }
}

async function sendOrderEmail(order) {
  const recipient = resolveRecipient(order);

  await sendMail({
    from: process.env.SMTP_FROM || 'GamePasal <no-reply@gamepasal.com>',
    to: recipient,
    subject: `Order Confirmed - ${order.orderCode || order.orderNumber}`,
    html: brandWrapper({
      title: 'Order Confirmed',
      preheader: `Order ${order.orderCode || order.orderNumber} has been created successfully.`,
      contentHtml: `
        <p>Your order has been created successfully.</p>
        <div class="divider"></div>
        <p><strong>Order Code:</strong> <code>${order.orderCode || order.orderNumber}</code></p>
        <p><strong>Total:</strong> NPR ${order.totalPaisa ? (order.totalPaisa / 100).toFixed(2) : Number(order.totalAmount || 0).toFixed(2)}</p>
        <div class="divider"></div>
        <h3>Items</h3>
        <ul>${order.products?.map((item) => `<li>${item.title || item.name} (Qty: ${item.quantity || 1})</li>`).join('') || '<li>No items listed</li>'}</ul>
        <p>We will process your order and send your digital items shortly after payment verification.</p>
      `
    })
  }, {
    skipMessage: `Skipping order email for ${order.orderCode || order.orderNumber}: no recipient email`,
    successMessage: 'Order confirmation email sent',
    failureMessage: 'Failed to send order email:'
  });
}

async function sendOrderProcessingEmail(user, order) {
  const recipient = resolveRecipient(order, user);

  await sendMail({
    from: process.env.SMTP_FROM || 'GamePasal <no-reply@gamepasal.com>',
    to: recipient,
    subject: `We are processing your order ${order.orderCode || order.orderNumber}`,
    html: brandWrapper({
      title: 'Order Processing',
      preheader: 'Your order is being prepared for delivery.',
      contentHtml: `
        <p>Good news! We have started processing your order. Your digital items will be delivered in a few minutes.</p>
        <div class="divider"></div>
        <p><strong>Order Code:</strong> <code>${order.orderCode || order.orderNumber}</code></p>
        <p><strong>Total:</strong> NPR ${order.totalPaisa ? (order.totalPaisa / 100).toFixed(2) : Number(order.totalAmount || 0).toFixed(2)}</p>
        <p class="muted">If you do not receive the items soon, contact support.</p>
      `
    })
  }, {
    skipMessage: `Skipping processing email for ${order.orderCode || order.orderNumber}: no recipient email`,
    failureMessage: 'Failed to send processing email:'
  });
}

async function sendOrderDeliveryEmail(user, order, { items }) {
  const recipient = resolveRecipient(order, user);
  const listHtml = (items || [])
    .map((item) => `<li><strong>${item.title || 'Item'}:</strong> <code>${item.code || item.link || ''}</code></li>`)
    .join('') || '<li>No items included</li>';

  await sendMail({
    from: process.env.SMTP_FROM || 'GamePasal <no-reply@gamepasal.com>',
    to: recipient,
    subject: `Delivered: ${order.orderCode || order.orderNumber}`,
    html: brandWrapper({
      title: 'Your Order Is Delivered',
      preheader: 'Here are your digital items.',
      contentHtml: `
        <p>Thanks for your purchase. Here are your digital items:</p>
        <div class="divider"></div>
        <ul>${listHtml}</ul>
        <div class="divider"></div>
        <p><strong>Order Code:</strong> <code>${order.orderCode || order.orderNumber}</code></p>
        <p class="muted">Keep this email safe. If anything looks wrong, contact support immediately.</p>
      `
    })
  }, {
    skipMessage: `Skipping delivery email for ${order.orderCode || order.orderNumber}: no recipient email`,
    failureMessage: 'Failed to send delivery email:'
  });
}

module.exports = {
  sendOrderEmail,
  sendOrderProcessingEmail,
  sendOrderDeliveryEmail
};
