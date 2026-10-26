import React from 'react';
import { Truck, Zap, Clock } from 'lucide-react';
import './DeliveryOptions.css';

const OPTIONS = [
  { id: 'standard', icon: Truck, label: 'Standard Delivery', time: '5-7 business days', price: 0 },
  { id: 'express', icon: Zap, label: 'Express Delivery', time: '2-3 business days', price: 99 },
  { id: 'same_day', icon: Clock, label: 'Same Day Delivery', time: 'Today by 8 PM', price: 199 },
];

const DeliveryOptions = ({ selected, onSelect }) => (
  <div className="delivery-options">
    {OPTIONS.map(opt => {
      const Icon = opt.icon;
      return (
        <label key={opt.id} className={`delivery-opt ${selected === opt.id ? 'selected' : ''}`}>
          <input type="radio" name="delivery" value={opt.id} checked={selected === opt.id} onChange={() => onSelect(opt.id)} />
          <div className="delivery-opt-icon"><Icon size={22} /></div>
          <div className="delivery-opt-info">
            <p className="delivery-opt-label">{opt.label}</p>
            <p className="delivery-opt-time">{opt.time}</p>
          </div>
          <div className="delivery-opt-price">
            {opt.price === 0 ? <span className="free-text">FREE</span> : `₹${opt.price}`}
          </div>
        </label>
      );
    })}
  </div>
);

export default DeliveryOptions;
