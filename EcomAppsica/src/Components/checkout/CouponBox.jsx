import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import './CouponBox.css';

const CouponBox = ({ onApply, onRemove, appliedCoupon }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) { setError('Enter a coupon code'); return; }
    setLoading(true); setError('');
    try { await onApply(code.trim().toUpperCase()); setCode(''); }
    catch (e) { setError(e.message || 'Invalid coupon'); }
    finally { setLoading(false); }
  };

  if (appliedCoupon) return (
    <div className="coupon-applied">
      <div className="coupon-applied-left">
        <Check size={16} />
        <div>
          <p className="coupon-code-text">{appliedCoupon.code}</p>
          <p className="coupon-save-text">You save ₹{appliedCoupon.discount}!</p>
        </div>
      </div>
      <button className="coupon-remove" onClick={onRemove}><X size={16} /></button>
    </div>
  );

  return (
    <div className="coupon-box">
      <div className="coupon-input-row">
        <div className="coupon-input-wrap">
          <Tag size={17} className="coupon-icon" />
          <input className="coupon-input" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} placeholder="Enter coupon code" />
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleApply} disabled={loading}>{loading ? '...' : 'Apply'}</button>
      </div>
      {error && <p className="coupon-error">{error}</p>}
    </div>
  );
};

export default CouponBox;
