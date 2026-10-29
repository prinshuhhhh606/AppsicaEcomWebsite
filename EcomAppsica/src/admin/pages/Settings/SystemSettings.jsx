import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Save,
  Store,
  DollarSign,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Truck,
  Compass,
  Layers,
  Clock,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function SystemSettings() {
  const [form, setForm] = useState({
    platformName: 'Appsica E-Commerce Marketplace',
    defaultCommissionRate: 10,
    supportEmail: 'support@appsica.com',
    supportPhone: '+91 98765 43210',
    currency: 'INR',
    currencySymbol: '₹',
    autoApproveProducts: false,
    autoApproveVendors: false,
    maintenanceMode: false,
    autoAssignmentEnabled: true,
    assignmentMode: 'hybrid',
    sellerManagedZonesEnabled: true,
    defaultDeliveryRadiusKm: 10,
    maxPermittedRadiusKm: 30,
    initialDriverSearchRadiusKm: 3,
    driverOfferTimeoutSeconds: 60,
    maxAssignmentRetries: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getSystemSettings();
      if (res?.success && res.settings) {
        setForm((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminService.updateSystemSettings({
        ...form,
        defaultCommissionRate: Number(form.defaultCommissionRate),
      });

      if (res?.success) {
        setSuccess('Platform global settings and commission rates saved successfully!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save platform configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Global Platform Configuration & Commission Rules
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Set baseline marketplace commission retention, moderation policies, and store maintenance states.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadSettings}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#f87171', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#34d399', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="admin-loading-spinner" />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* General Settings */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Settings size={18} /> Marketplace Identity
                </h3>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Platform Name</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  value={form.platformName}
                  onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Support Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={form.supportEmail}
                    onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Support Helpline</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={form.supportPhone}
                    onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Platform Currency</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Currency Symbol</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={form.currencySymbol}
                    onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Commission & Moderation Policies */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <DollarSign size={18} /> Financial & Moderation Controls
                </h3>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Default Baseline Commission (%)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min="0"
                  max="100"
                  required
                  value={form.defaultCommissionRate}
                  onChange={(e) => setForm({ ...form, defaultCommissionRate: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Platform retained cut deducted automatically from gross non-cancelled vendor order sales.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '3px' }}
                    checked={form.autoApproveProducts}
                    onChange={(e) => setForm({ ...form, autoApproveProducts: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                      Auto-Approve Vendor Products
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      When enabled, products created by verified vendors bypass manual admin review and go live immediately.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '3px' }}
                    checked={form.autoApproveVendors}
                    onChange={(e) => setForm({ ...form, autoApproveVendors: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                      Auto-Approve Seller Registrations
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Automatically grant merchant privileges to new vendor accounts upon registration.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', paddingTop: '0.75rem', borderTop: '1px solid var(--ap-border-subtle)' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '3px' }}
                    checked={form.maintenanceMode}
                    onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f87171' }}>
                      Platform Maintenance Mode
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Temporarily pause customer checkout while running database maintenance or catalog refreshes.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Smart Delivery Zone & Driver Assignment Settings */}
            <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Compass size={18} /> Smart Delivery Zone & Automatic Driver Assignment Policies
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Driver Assignment Mode</label>
                  <select
                    className="admin-input"
                    value={form.assignmentMode}
                    onChange={(e) => setForm({ ...form, assignmentMode: e.target.value })}
                  >
                    <option value="hybrid">Hybrid (Auto-offer closest driver with manual fallback)</option>
                    <option value="automatic">Fully Automatic (Dispatch engine continuously offers orders)</option>
                    <option value="manual">Manual Only (Sellers and Admin manually select drivers)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Initial Driver Search Radius (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="admin-input"
                    value={form.initialDriverSearchRadiusKm}
                    onChange={(e) => setForm({ ...form, initialDriverSearchRadiusKm: Number(e.target.value) })}
                  />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>First search tier around seller store pickup</small>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Driver Response Timeout (seconds)</label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    className="admin-input"
                    value={form.driverOfferTimeoutSeconds}
                    onChange={(e) => setForm({ ...form, driverOfferTimeoutSeconds: Number(e.target.value) })}
                  />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Time driver has to accept before re-routing</small>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Max Permitted Store Delivery Radius (km)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    className="admin-input"
                    value={form.maxPermittedRadiusKm}
                    onChange={(e) => setForm({ ...form, maxPermittedRadiusKm: Number(e.target.value) })}
                  />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Upper boundary for seller-managed delivery radius</small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--ap-border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '3px' }}
                    checked={form.autoAssignmentEnabled}
                    onChange={(e) => setForm({ ...form, autoAssignmentEnabled: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                      Enable Smart Automatic Driver Assignment
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Automatically match ready orders to the closest available delivery driver using GPS coordinates and ETA.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '3px' }}
                    checked={form.sellerManagedZonesEnabled}
                    onChange={(e) => setForm({ ...form, sellerManagedZonesEnabled: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                      Allow Seller-Managed Delivery Zones & Polygons
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Permit merchants to customize their delivery boundaries via interactive maps and custom radii.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            >
              <Save size={18} /> {saving ? 'Saving System Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
