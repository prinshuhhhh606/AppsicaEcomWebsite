import React, { useState, useEffect, useContext } from 'react';
import {
  Store,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Lock,
  Save,
  CheckCircle,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { AuthContext } from '../../context/AuthContextValue';

export default function VendorProfile() {
  const { user, updateUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: '',
    storeDescription: '',
    storeLogo: '',
    storeBanner: '',
    businessAddress: '',
    taxId: '',
    payoutDetails: {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      ifsc: '',
      upiId: '',
    },
    password: '',
    confirmPassword: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorService.getProfile();
      const v = res?.vendor || res?.data || res;
      setForm({
        name: v.name || '',
        email: v.email || '',
        phone: v.phone || '',
        storeName: v.storeName || '',
        storeDescription: v.storeDescription || '',
        storeLogo: v.storeLogo || '',
        storeBanner: v.storeBanner || '',
        businessAddress: v.businessAddress || '',
        taxId: v.taxId || '',
        payoutDetails: {
          accountHolder: v.payoutDetails?.accountHolder || '',
          accountNumber: v.payoutDetails?.accountNumber || '',
          bankName: v.payoutDetails?.bankName || '',
          ifsc: v.payoutDetails?.ifsc || '',
          upiId: v.payoutDetails?.upiId || '',
        },
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err?.message || 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        storeLogo: form.storeLogo,
        storeBanner: form.storeBanner,
        businessAddress: form.businessAddress,
        taxId: form.taxId,
        payoutDetails: form.payoutDetails,
      };

      if (form.password) {
        payload.password = form.password;
      }

      const res = await vendorService.updateProfile(payload);
      setSuccessMsg('Store profile and payout details saved successfully!');
      if (res?.vendor) {
        updateUser({ ...user, ...res.vendor });
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const isApproved = user?.vendorStatus === 'approved';
  const isPending = user?.vendorStatus === 'pending';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
          Vendor Profile & Store Settings
        </h2>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Manage your storefront branding, official business contacts, and bank payout settings.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: STORE BRANDING & DETAILS */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <h3 className="vendor-card-title">
              <Store size={18} style={{ color: '#6366f1' }} /> Store Identity & Branding
            </h3>
            <div className={`vendor-status-pill ${user?.vendorStatus || 'pending'}`}>
              {isApproved && (
                <>
                  <ShieldCheck size={14} /> Verified Merchant
                </>
              )}
              {isPending && (
                <>
                  <Clock size={14} /> Pending Approval
                </>
              )}
            </div>
          </div>

          <div className="vp-form-row">
            <div className="vp-form-group">
              <label className="vp-form-label">Store / Brand Name *</label>
              <input
                type="text"
                required
                className="vp-input"
                placeholder="Aura Sound & Tech"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">Contact Phone</label>
              <input
                type="tel"
                className="vp-input"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="vp-form-group">
            <label className="vp-form-label">Store Tagline / Description</label>
            <textarea
              className="vp-textarea"
              placeholder="Tell customers about your brand, product quality, craftsmanship and commitment..."
              value={form.storeDescription}
              onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
            />
          </div>

          <div className="vp-form-row">
            <div className="vp-form-group">
              <label className="vp-form-label">Store Logo Image URL</label>
              <input
                type="url"
                className="vp-input"
                placeholder="https://images.unsplash.com/..."
                value={form.storeLogo}
                onChange={(e) => setForm({ ...form, storeLogo: e.target.value })}
              />
              {form.storeLogo && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={form.storeLogo}
                    alt="Logo Preview"
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Logo Preview</span>
                </div>
              )}
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">Store Header Banner URL</label>
              <input
                type="url"
                className="vp-input"
                placeholder="https://images.unsplash.com/..."
                value={form.storeBanner}
                onChange={(e) => setForm({ ...form, storeBanner: e.target.value })}
              />
              {form.storeBanner && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img
                    src={form.storeBanner}
                    alt="Banner Preview"
                    style={{ width: '100%', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: BUSINESS & TAX INFORMATION */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <h3 className="vendor-card-title">
              <FileText size={18} style={{ color: '#06b6d4' }} /> Business Verification & Tax Information
            </h3>
          </div>

          <div className="vp-form-row">
            <div className="vp-form-group">
              <label className="vp-form-label">Registered Business Name / Legal Owner</label>
              <input
                type="text"
                required
                className="vp-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">GSTIN / Tax ID Number</label>
              <input
                type="text"
                className="vp-input"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
            </div>
          </div>

          <div className="vp-form-group">
            <label className="vp-form-label">Registered Warehouse / Dispatch Address</label>
            <input
              type="text"
              className="vp-input"
              placeholder="Unit #, Tech Park, City, State, Pincode"
              value={form.businessAddress}
              onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
            />
          </div>
        </div>

        {/* SECTION 3: BANK PAYOUT DETAILS */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <div>
              <h3 className="vendor-card-title">
                <Building size={18} style={{ color: '#10b981' }} /> Payout Bank Account Details
              </h3>
              <span className="vendor-card-subtitle">
                Sales earnings (90% net) are transferred directly into this account
              </span>
            </div>
          </div>

          <div className="vp-form-row">
            <div className="vp-form-group">
              <label className="vp-form-label">Account Holder Name</label>
              <input
                type="text"
                className="vp-input"
                placeholder="Marcus Vance"
                value={form.payoutDetails.accountHolder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payoutDetails: { ...form.payoutDetails, accountHolder: e.target.value },
                  })
                }
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">Bank Name</label>
              <input
                type="text"
                className="vp-input"
                placeholder="HDFC Bank / ICICI / SBI"
                value={form.payoutDetails.bankName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payoutDetails: { ...form.payoutDetails, bankName: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="vp-form-row-3">
            <div className="vp-form-group">
              <label className="vp-form-label">Bank Account Number</label>
              <input
                type="text"
                className="vp-input"
                placeholder="98765432109876"
                value={form.payoutDetails.accountNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payoutDetails: { ...form.payoutDetails, accountNumber: e.target.value },
                  })
                }
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">Bank IFSC Code</label>
              <input
                type="text"
                className="vp-input"
                placeholder="HDFC0001234"
                value={form.payoutDetails.ifsc}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payoutDetails: { ...form.payoutDetails, ifsc: e.target.value },
                  })
                }
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">UPI ID (Optional)</label>
              <input
                type="text"
                className="vp-input"
                placeholder="yourstore@upi"
                value={form.payoutDetails.upiId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payoutDetails: { ...form.payoutDetails, upiId: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SECURITY */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <h3 className="vendor-card-title">
              <Lock size={18} style={{ color: '#f59e0b' }} /> Security & Password
            </h3>
            <span className="vendor-card-subtitle">Leave blank if you do not want to change password</span>
          </div>

          <div className="vp-form-row">
            <div className="vp-form-group">
              <label className="vp-form-label">New Password</label>
              <input
                type="password"
                className="vp-input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="vp-form-group">
              <label className="vp-form-label">Confirm New Password</label>
              <input
                type="password"
                className="vp-input"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="vp-btn vp-btn-primary" disabled={saving} style={{ padding: '0.75rem 2rem' }}>
            <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
