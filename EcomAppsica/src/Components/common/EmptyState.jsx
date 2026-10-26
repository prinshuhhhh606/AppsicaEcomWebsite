import React from 'react';

export default function EmptyState({ icon, title, copy, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h2>{title}</h2>}
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}
