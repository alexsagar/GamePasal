const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

// Send photo with caption, fallback to document if photo fails
async function sendPhoto({ url, captionMd }) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('Telegram not configured, skipping photo send');
    return;
  }

  try {
    // Try sending as photo first
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      chat_id: CHAT_ID,
      photo: url,
      caption: captionMd,
      parse_mode: 'Markdown'
    });
    console.log('Telegram photo sent successfully');
  } catch (photoError) {
    console.log('Photo send failed, trying document:', photoError.message);
    
    try {
      // Fallback to document
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        chat_id: CHAT_ID,
        document: url,
        caption: captionMd,
        parse_mode: 'Markdown'
      });
      console.log('Telegram document sent successfully');
    } catch (docError) {
      console.error('Both photo and document send failed:', docError.message);
      // Still try to send text without image
      await sendText(captionMd);
    }
  }
}

// Send text message
async function sendText(markdown) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('Telegram not configured, skipping text send');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: markdown,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    console.log('Telegram text sent successfully');
  } catch (error) {
    console.error('Telegram text send failed:', error.message);
  }
}

// Build caption for payment attempts
function buildCaption({ kind, order, user, attempt, adminUrl }) {
  const lines = [];
  
  if (kind === 'ORDER') {
    lines.push(`🛒 *New Order Payment*`);
    lines.push(`Order: \`${order.orderCode || order.orderNumber || order._id}\``);
    lines.push(`Amount: NPR ${attempt.amountNpr.toFixed(2)}`);
    lines.push(`Customer: ${user.email}`);
    
    if (order.products && order.products.length > 0) {
      const itemTitles = order.products.slice(0, 5).map(p => p.title || p.name).filter(Boolean);
      if (itemTitles.length > 0) {
        lines.push(`Items: ${itemTitles.join(', ')}${order.products.length > 5 ? '...' : ''}`);
      }
    }
  } else if (kind === 'WALLET') {
    lines.push(`💰 *Wallet Top-up*`);
    lines.push(`Amount: NPR ${attempt.amountNpr.toFixed(2)}`);
    lines.push(`Customer: ${user.email}`);
  }
  
  if (attempt.payerName) {
    lines.push(`Payer: ${attempt.payerName}`);
  }
  
  if (attempt.referenceLast4) {
    lines.push(`Reference: ...${attempt.referenceLast4}`);
  }
  
  if (attempt.paidAtLocal) {
    lines.push(`Paid At: ${new Date(attempt.paidAtLocal).toLocaleString()}`);
  }
  
  lines.push('');
  lines.push(`[Open Admin Panel](${adminUrl})`);
  
  return lines.join('\n');
}

module.exports = {
  sendPhoto,
  sendText,
  buildCaption
};

