import { Alert } from '../models/Alert.js';
import { evaluateOperationalAlerts } from '../services/alertRuleEngine.js';
import { logAudit } from '../services/auditService.js';

export const getAlerts = async (req, res, next) => {
  try {
    const { severity, alertType, isResolved = 'false', page = 1, limit = 20 } = req.query;

    const query = {};
    if (severity && severity !== 'ALL') query.severity = severity;
    if (alertType && alertType !== 'ALL') query.alertType = alertType;
    if (isResolved !== 'ALL') query.isResolved = isResolved === 'true';

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({ isRead: false, isResolved: false });
    const criticalCount = await Alert.countDocuments({ severity: 'CRITICAL', isResolved: false });

    const alerts = await Alert.find(query)
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: alerts,
      unreadCount,
      criticalCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const markAlertRead = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.isRead = true;
    await alert.save();

    res.status(200).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNote } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.isResolved = true;
    alert.isRead = true;
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    alert.resolutionNote = resolutionNote || 'Resolved by operational staff';
    await alert.save();

    await logAudit({
      user: req.user,
      action: 'ALERT_RESOLVED',
      entity: 'Alert',
      entityId: alert._id,
      description: `Resolved ${alert.severity} alert: "${alert.title}" with note: ${alert.resolutionNote}`
    });

    res.status(200).json({
      success: true,
      message: 'Alert marked as resolved.',
      alert
    });
  } catch (err) {
    next(err);
  }
};

export const evaluateAlertsHandler = async (req, res, next) => {
  try {
    await evaluateOperationalAlerts();
    const unreadCount = await Alert.countDocuments({ isRead: false, isResolved: false });
    res.status(200).json({
      success: true,
      message: 'Operational business rules evaluated successfully.',
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};