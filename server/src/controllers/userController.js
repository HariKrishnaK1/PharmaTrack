import { User } from '../models/User.js';
import { logAudit } from '../services/auditService.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;

    const query = {};
    if (role && role !== 'ALL') query.role = role;
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('assignedWarehouse', 'name code location')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users,
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

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, assignedWarehouse } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `A user with email '${email}' already exists.` });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'INVENTORY_MANAGER',
      assignedWarehouse: assignedWarehouse || null,
      status: 'ACTIVE'
    });

    await logAudit({
      user: req.user,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user._id,
      description: `Admin created user account for ${user.name} (${user.email}) with role ${user.role}.`
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, role, assignedWarehouse, status } = req.body;
    if (name) user.name = name;
    if (role) user.role = role;
    if (assignedWarehouse !== undefined) user.assignedWarehouse = assignedWarehouse || null;
    if (status) user.status = status;

    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id,
      description: `Admin updated account details for ${user.name} (${user.email}).`
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Prevent admin from deactivating self
    if (String(targetUserId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot deactivate your own active administrator account.'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id,
      description: `Admin toggled status of ${user.name} (${user.email}) to ${user.status}.`
    });

    res.status(200).json({
      success: true,
      message: `User account is now ${user.status}.`,
      user
    });
  } catch (err) {
    next(err);
  }
};