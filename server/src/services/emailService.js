import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Create reusable transporter dynamically so fresh config is always read
export const getTransporter = () => {
  const user = (config.emailUser || '').trim();
  const pass = (config.emailPass || '').replace(/\s+/g, '');

  if (!user || !pass || user.includes('your_gmail')) {
    console.log('[Email] SMTP credentials not fully configured. Outbound emails disabled.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

// ─── Email Templates ─────────────────────────────────────────────────────────

const baseTemplate = (title, severity, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin:0; padding:0; background:#f8fafc; color:#0f172a; }
    .wrapper { max-width:600px; margin:32px auto; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { background:linear-gradient(135deg,#0f766e,#10b981); padding:28px 32px; }
    .header h1 { color:#ffffff; margin:0; font-size:20px; font-weight:700; letter-spacing:-0.02em; }
    .header p { color:#ccfbf1; margin:4px 0 0; font-size:13px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; margin-bottom:12px; }
    .badge-critical { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }
    .badge-warning  { background:#fef9c3; color:#92400e; border:1px solid #fef08a; }
    .badge-info     { background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; }
    .body { padding:28px 32px; }
    .body h2 { font-size:17px; font-weight:700; color:#0f172a; margin:0 0 10px; }
    .body p  { font-size:14px; color:#475569; line-height:1.6; margin:0 0 16px; }
    .detail-box { background:#f8fafc; border-radius:10px; padding:16px; margin:16px 0; border:1px solid #e2e8f0; }
    .detail-box p { margin:4px 0; font-size:13px; color:#334155; }
    .cta { display:inline-block; margin-top:12px; padding:11px 24px; background:#0d9488; color:#ffffff !important; border-radius:10px; text-decoration:none; font-weight:600; font-size:13px; text-align:center; }
    .footer { padding:20px 32px; border-top:1px solid #f1f5f9; text-align:center; background:#f8fafc; }
    .footer p { font-size:11px; color:#94a3b8; margin:0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>💊 PharmaTrack Operational Alert</h1>
      <p>Pharmaceutical Supply Chain & Inventory Operations</p>
    </div>
    <div class="body">
      <span class="badge badge-${(severity || 'WARNING').toLowerCase()}">${severity}</span>
      <h2>${title}</h2>
      ${bodyHtml}
      <br/>
      <a href="${config.clientUrl}/app/alerts" class="cta">Review Alert in Console →</a>
    </div>
    <div class="footer">
      <p>Automated notification from PharmaTrack Operations. To configure alert recipients, visit Settings in the Operations Console.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Helpers ─────────────────────────────────────────────────────────────

export const sendAlertEmail = async ({ to, subject, title, severity, message, detailLines = [] }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const detailHtml = detailLines.length
    ? `<div class="detail-box">${detailLines.map(l => `<p>• ${l}</p>`).join('')}</div>`
    : '';

  const html = baseTemplate(
    title,
    severity,
    `<p>${message}</p>${detailHtml}`
  );

  const recipient = Array.isArray(to) ? to.filter(Boolean).join(', ') : to;
  if (!recipient) return;

  try {
    const info = await transporter.sendMail({
      from: `"PharmaTrack Alerts" <${(config.emailUser || '').trim()}>`,
      to: recipient,
      subject: `[PharmaTrack] ${subject}`,
      html,
    });
    console.log(`[Email] Alert email sent successfully to ${recipient} (Message ID: ${info.messageId})`);
  } catch (err) {
    console.error('[Email] Error sending alert email:', err.message);
  }
};

// ─── Alert-Type Convenience Senders ──────────────────────────────────────────

export const sendLowStockEmail = async (to, { productName, productCode, available, minimum }) => {
  await sendAlertEmail({
    to,
    subject: `Low Stock Warning: ${productName}`,
    title: `⚠️ Low Stock Threshold Reached: ${productName}`,
    severity: 'WARNING',
    message: `The available inventory for <strong>${productName}</strong> has dropped below the minimum required safety stock.`,
    detailLines: [
      `Product Formulation: ${productName}`,
      `Product SKU / Code: ${productCode}`,
      `Current Available Stock: ${available} units`,
      `Configured Minimum Threshold: ${minimum} units`,
      `Action: Place a restocking / production order promptly.`,
    ],
  });
};

export const sendOutOfStockEmail = async (to, { productName, productCode }) => {
  await sendAlertEmail({
    to,
    subject: `CRITICAL: Out of Stock — ${productName}`,
    title: `🚨 Urgent: Zero Stock Available for ${productName}`,
    severity: 'CRITICAL',
    message: `<strong>${productName} (${productCode})</strong> has 0 units available across all distribution warehouse hubs.`,
    detailLines: [
      `Product Formulation: ${productName}`,
      `Product SKU / Code: ${productCode}`,
      `Available Units: 0 units`,
      `Status: Immediate procurement / replenishment needed.`,
    ],
  });
};

export const sendExpiryEmail = async (to, { batchNumber, productName, expiryDate, daysLeft, severity }) => {
  const isCritical = daysLeft <= 30;
  await sendAlertEmail({
    to,
    subject: `${isCritical ? 'CRITICAL' : 'Warning'}: Batch Expiring — ${batchNumber}`,
    title: `${isCritical ? '🚨 Critical Expiry Notice' : '⚠️ Expiry Schedule Notice'}: ${batchNumber}`,
    severity,
    message: `Batch <strong>${batchNumber}</strong> of <strong>${productName}</strong> has reached its critical expiry window. Prioritize FEFO allocation.`,
    detailLines: [
      `Batch Number: ${batchNumber}`,
      `Product: ${productName}`,
      `Batch Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      `Days Remaining: ${daysLeft} days`,
      `Guidance: ${daysLeft <= 0 ? 'QUARANTINE IMMEDIATELY. Cannot be dispatched.' : 'Prioritize First-Expiry-First-Out (FEFO) shipment.'}`,
    ],
  });
};

export const sendShipmentDelayEmail = async (to, { shipmentId, destination, expectedDeliveryDate }) => {
  await sendAlertEmail({
    to,
    subject: `Consignment Delay: ${shipmentId}`,
    title: `🚚 Delivery Delay Reported: ${shipmentId}`,
    severity: 'WARNING',
    message: `Consignment <strong>${shipmentId}</strong> has passed its scheduled delivery window without confirmation.`,
    detailLines: [
      `Consignment ID: ${shipmentId}`,
      `Destination Facility: ${destination}`,
      `Scheduled Delivery: ${new Date(expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      `Action: Contact carrier dispatcher and update shipment transit status.`,
    ],
  });
};

// ─── Test Verification Helper ────────────────────────────────────────────────

export const sendTestEmail = async (recipient) => {
  const transporter = getTransporter();
  if (!transporter) throw new Error('Email credentials not configured in server/.env');

  const to = recipient || (config.emailUser || '').trim();
  const info = await transporter.sendMail({
    from: `"PharmaTrack Alerts" <${(config.emailUser || '').trim()}>`,
    to,
    subject: '[PharmaTrack] Test Alert Notification Verification',
    html: baseTemplate(
      '✅ PharmaTrack Email System Verified',
      'INFO',
      `<p>This test email confirms that your Gmail App Password configuration is operating properly.</p>
       <div class="detail-box">
         <p>• <strong>Configured Sender:</strong> ${(config.emailUser || '').trim()}</p>
         <p>• <strong>Recipient:</strong> ${to}</p>
         <p>• <strong>Trigger:</strong> Manual Test Dispatch</p>
         <p>• <strong>Status:</strong> Active & Connected to MongoDB Rules Engine</p>
       </div>
       <p>You will now receive automatic email alerts whenever low stock, batch expirations, or shipment delays occur.</p>`
    ),
  });

  return info;
};
