/**
 * Vendor Role-Based & Status-Based Access Control Middleware
 */
const vendorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'vendor') {
    if (req.user.vendorStatus === 'approved') {
      return next();
    }
    if (req.user.vendorStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your seller application was rejected. Reason: ${req.user.vendorRejectionReason || 'Store verification criteria not fulfilled.'}`,
        vendorStatus: 'rejected',
        rejectionReason: req.user.vendorRejectionReason,
      });
    }
    if (req.user.vendorStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account has been temporarily suspended by administrator.',
        vendorStatus: 'suspended',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Your seller registration request is pending admin approval. You cannot access seller features until approved.',
      vendorStatus: 'pending',
      pendingApproval: true,
    });
  }

  res.status(403).json({
    success: false,
    message: 'Access denied: Vendor account required',
  });
};

const approvedVendorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'vendor') {
    if (req.user.vendorStatus === 'approved') {
      return next();
    }
    if (req.user.vendorStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your seller application was rejected. Reason: ${req.user.vendorRejectionReason || 'Store verification criteria not fulfilled.'}`,
        vendorStatus: 'rejected',
        rejectionReason: req.user.vendorRejectionReason,
      });
    }
    if (req.user.vendorStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your vendor account has been temporarily suspended.',
        vendorStatus: 'suspended',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Your vendor account is pending admin approval. You cannot publish products until approved.',
      vendorStatus: 'pending',
      pendingApproval: true,
    });
  }

  res.status(403).json({
    success: false,
    message: 'Access denied: Vendor role required',
  });
};

module.exports = { vendorOnly, approvedVendorOnly };
