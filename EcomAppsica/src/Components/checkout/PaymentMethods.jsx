import React from 'react';
import { CreditCard, Truck, Smartphone } from 'lucide-react';
import './PaymentMethods.css';

const METHODS = [
  { id: 'razorpay', icon: CreditCard, label: 'Razorpay', sub: 'Cards, UPI, Netbanking & more' },
  { id: 'cod', icon: Truck, label: 'Cash on Delivery', sub: 'Pay when you receive' },
  { id: 'upi', icon: Smartphone, label: 'UPI Direct', sub: 'GPay, PhonePe, Paytm' },
];

const PaymentMethods = ({ selected, onSelect }) => (
  <div className="payment-methods">
    {METHODS.map(m => {
      const Icon = m.icon;
      return (
        <label key={m.id} className={`payment-opt ${selected === m.id ? 'selected' : ''}`}>
          <input type="radio" name="payment" value={m.id} checked={selected === m.id} onChange={() => onSelect(m.id)} />
          <div className="pay-icon"><Icon size={22} /></div>
          <div className="pay-info">
            <p className="pay-label">{m.label}</p>
            <p className="pay-sub">{m.sub}</p>
          </div>
          <div className={`pay-radio ${selected === m.id ? 'checked' : ''}`} />
        </label>
      );
    })}
  </div>
);

export default PaymentMethods;
