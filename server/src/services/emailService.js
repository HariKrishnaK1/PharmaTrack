import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Create reusable transporter
const createTransporter = () => {
  if (
    !config.emailUser ||
    !config.emailPass ||
    config.emailUser.includes('your_gmail') ||
    config.emailPass.includes('your_gmail')
  ) {
    console.log('[Email] Real SMTP credentials not set in .env. Skipping automated outbound emails.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });
};

const transporter = createTransporter();

// ─── Email Templates ─────────────────────────────────────────────────────────

const baseTemplate = (title, severity, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:0; padding:0; background:#f8fafc; }
    .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
    .header { background:linear-gradient(135deg,#0f766e,#10b981); padding:28px 32px; }
    .header h1 { color:#fff; margin:0; font-size:20px; font-weight:700; }
    .header p { color:#99f6e4; margin:4px 0 0; font-size:13px; }
    .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; margin-bottom:12px; }
    .badge-critical { background:#fee2e2; color:#b91c1c; }
    .badge-warning  { background:#fef9c3; color:#92400e; }
    .badge-info     { background:#dbeafe; color:#1e40af; }
    .body { padding:28px 32px; }
    .body h2 { font-size:16px; font-weight:700; color:#0f172a; margin:0 0 8px; }
    .body p  { font-size:14px; color:#475569; line-height:1.6; margin:0 0 16px; }
    .detail-box { background:#f1f5f9; border-radius:10px; padding:16px; margin:16px 0; }
    .detail-box p { margin:0; font-size:13px; color:#334155; }
    .cta { display:inline-block; margin-top:8px; padding:10px 24px; background:#0f766e; color:#fff; border-radius:8px; text-decoration:none; font-weight:600; font-size:13px; }
    .footer { padding:16px 32px; border-top:1px solid #f1f5f9; text-align:center; }
    .footer p { font-size:11px; color:#94a3b8; margin:0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>💊 PharmaTrack Ops Alert</h1>
      <p>Pharmaceutical Supply Chain & Inventory Platform</p>
    </div>
    <div class="body">
      <span class="badge badge-${severity.toLowerCase()}">${severity}</span>
      <h2>${title}</h2>
      ${bodyHtml}
      <a href="${config.clientUrl}/app/alerts" class="cta">View All Alerts →</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from PharmaTrack. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Helpers ─────────────────────────────────────────────────────────────

export const sendAlertEmail = async ({ to, subject, title, severity, message, detailLines = [] }) => {
  if (!transporter) return;

  const detailHtml = detailLines.length
    ? `<div class="detail-box">${detailLines.map(l => `<p>• ${l}</p>`).join('')}</div>`
    : '';

  const html = baseTemplate(
    title,
    severity,
    `<p>${message}</p>${detailHtml}`
  );

  try {
    await transporter.sendMail({
      from: `"PharmaTrack Alerts" <${config.emailUser}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: `[PharmaTrack] ${subject}`,
      html,
    });
    console.log(`[Email] Alert sent → ${to} | ${subject}`);
  } catch (err) {
    console.error('[Email] Failed to send alert:', err.message);
  }
};

// ─── Alert-Type Convenience Senders ──────────────────────────────────────────

export const sendLowStockEmail = async (to, { productName, productCode, available, minimum }) => {
  await sendAlertEmail({
    to,
    subject: `Low Stock Alert: ${productName}`,
    title: `⚠️ Low Stock: ${productName}`,
    severity: 'WARNING',
    message: `The available inventory for <strong>${productName}</strong> has dropped below the minimum threshold.`,
    detailLines: [
      `Product Code: ${productCode}`,
      `Available Units: ${available}`,
      `Minimum Stock Level: ${minimum}`,
      `Action Required: Raise a purchase order immediately.`,
    ],
  });
};

export const sendOutOfStockEmail = async (to, { productName, productCode }) => {
  await sendAlertEmail({
    to,
    subject: `CRITICAL: Out of Stock — ${productName}`,
    title: `🚨 Out of Stock: ${productName}`,
    severity: 'CRITICAL',
    message: `<strong>${productName} (${productCode})</strong> has zero available units across ALL warehouses. Immediate restocking is required.`,
    detailLines: [
      `Product Code: ${productCode}`,
      `Available Units: 0`,
      `Action Required: Emergency procurement needed.`,
    ],
  });
};

export const sendExpiryEmail = async (to, { batchNumber, productName, expiryDate, daysLeft, severity }) => {
  const isCritical = daysLeft <= 30;
  await sendAlertEmail({
    to,
    subject: `${isCritical ? 'CRITICAL' : 'Warning'}: Batch Expiring — ${batchNumber}`,
    title: `${isCritical ? '🚨' : '⚠️'} Batch Expiry ${isCritical ? 'Critical' : 'Warning'}: ${batchNumber}`,
    severity,
    message: `Batch <strong>${batchNumber}</strong> of <strong>${productName}</strong> is expiring soon. Prioritize FEFO dispatch.`,
    detailLines: [
      `Batch Number: ${batchNumber}`,
      `Product: ${productName}`,
      `Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-IN')}`,
      `Days Remaining: ${daysLeft}`,
      `Action Required: ${daysLeft <= 0 ? 'QUARANTINE IMMEDIATELY — DO NOT SHIP.' : 'Dispatch this batch first (FEFO).'}`,
    ],
  });
};

export const sendShipmentDelayEmail = async (to, { shipmentId, destination, expectedDeliveryDate }) => {
  await sendAlertEmail({
    to,
    subject: `Shipment Delayed: ${shipmentId}`,
    title: `🚚 Shipment Delayed: ${shipmentId}`,
    severity: 'WARNING',
    message: `Shipment <strong>${shipmentId}</strong> has passed its expected delivery date without confirmation.`,
    detailLines: [
      `Shipment ID: ${shipmentId}`,
      `Destination: ${destination}`,
      `Expected Delivery: ${new Date(expectedDeliveryDate).toLocaleDateString('en-IN')}`,
      `Action Required: Contact the carrier and update shipment status.`,
    ],
  });
};
