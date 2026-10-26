export const validators = {
  required: (value) => {
    if (!value || String(value).trim() === '') return 'This field is required';
    return '';
  },
  email: (value) => {
    if (!value) return 'Email is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) return 'Enter a valid email address';
    return '';
  },
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  },
  phone: (value) => {
    if (!value) return 'Phone number is required';
    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(value)) return 'Enter a valid 10-digit Indian phone number';
    return '';
  },
  pincode: (value) => {
    if (!value) return 'Pincode is required';
    const regex = /^[1-9][0-9]{5}$/;
    if (!regex.test(value)) return 'Enter a valid 6-digit pincode';
    return '';
  },
  minLength: (min) => (value) => {
    if (!value || value.length < min) return `Minimum ${min} characters required`;
    return '';
  },
  maxLength: (max) => (value) => {
    if (value && value.length > max) return `Maximum ${max} characters allowed`;
    return '';
  },
  confirmPassword: (password) => (value) => {
    if (value !== password) return 'Passwords do not match';
    return '';
  },
};

export const validateForm = (fields, rules) => {
  const errors = {};
  Object.keys(rules).forEach((key) => {
    const fieldRules = Array.isArray(rules[key]) ? rules[key] : [rules[key]];
    for (const rule of fieldRules) {
      const error = rule(fields[key]);
      if (error) { errors[key] = error; break; }
    }
  });
  return errors;
};
