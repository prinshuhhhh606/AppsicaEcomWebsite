/**
 * Delivery Partner Role-Based Access Control Middleware
 */
const deliveryOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'delivery' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Delivery Partner account required',
    });
  }
};

const approvedDeliveryOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'delivery') {
    if (req.user.deliveryStatus === 'approved') {
      return next();
    } else if (req.user.deliveryStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your delivery partner application was rejected. Please contact administrator support.',
      });
    } else if (req.user.deliveryStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your delivery partner account has been temporarily suspended. Please contact administrator.',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Your delivery partner account is pending admin approval. You will receive assignments once activated.',
        pendingApproval: true,
      });
    }
  }

  res.status(403).json({
    success: false,
    message: 'Access denied: Delivery partner role required',
  });
};

module.exports = { deliveryOnly, approvedDeliveryOnly };
