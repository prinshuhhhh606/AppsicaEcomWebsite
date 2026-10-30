import React, { useState } from 'react';
import { validators } from '../../utils/validators';
import './AddressForm.css';

const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const AddressForm = ({ onSubmit, initial = {}, loading = false }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    ...initial,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (validators.phone(form.phone)) e.phone = validators.phone(form.phone);
    if (!form.address.trim()) e.address = 'Street address / House No is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (validators.pincode(form.pincode)) e.pincode = validators.pincode(form.pincode);
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  return (
    <form className="address-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="John Doe"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            className={`form-input ${errors.phone ? 'error' : ''}`}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="9876543210"
            maxLength={10}
          />
          {errors.phone && <p className="form-error">{errors.phone}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">House No, Street, Area *</label>
        <textarea
          className={`form-input address-textarea ${errors.address ? 'error' : ''}`}
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Flat / House No, Building, Street, Locality..."
          rows={2}
        />
        {errors.address && <p className="form-error">{errors.address}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Landmark (Optional)</label>
        <input
          className="form-input"
          value={form.landmark || ''}
          onChange={(e) => set('landmark', e.target.value)}
          placeholder="Near City Hospital, Behind Bank, etc."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City *</label>
          <input
            className={`form-input ${errors.city ? 'error' : ''}`}
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Indore, Mumbai, Delhi"
          />
          {errors.city && <p className="form-error">{errors.city}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">State *</label>
          <select
            className={`form-input ${errors.state ? 'error' : ''}`}
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
          >
            <option value="">Select State</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && <p className="form-error">{errors.state}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">6-Digit PIN Code *</label>
          <input
            className={`form-input ${errors.pincode ? 'error' : ''}`}
            value={form.pincode}
            onChange={(e) => set('pincode', e.target.value)}
            placeholder="e.g. 452001"
            maxLength={6}
          />
          {errors.pincode && <p className="form-error">{errors.pincode}</p>}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Save Address'}
      </button>
    </form>
  );
};

export default AddressForm;
