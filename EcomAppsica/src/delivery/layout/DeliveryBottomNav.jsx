import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Truck, DollarSign, User } from 'lucide-react';

export default function DeliveryBottomNav() {
  return (
    <nav className="delivery-bottom-nav">
      <NavLink
        to="/delivery/dashboard"
        className={({ isActive }) => `deliv-bottom-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/delivery/pickups"
        className={({ isActive }) => `deliv-bottom-item ${isActive ? 'active' : ''}`}
      >
        <Store size={20} />
        <span>Pickups</span>
      </NavLink>

      <NavLink
        to="/delivery/active"
        className={({ isActive }) => `deliv-bottom-item ${isActive ? 'active' : ''}`}
      >
        <Truck size={20} />
        <span>Active</span>
      </NavLink>

      <NavLink
        to="/delivery/earnings"
        className={({ isActive }) => `deliv-bottom-item ${isActive ? 'active' : ''}`}
      >
        <DollarSign size={20} />
        <span>Earnings</span>
      </NavLink>

      <NavLink
        to="/delivery/profile"
        className={({ isActive }) => `deliv-bottom-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
