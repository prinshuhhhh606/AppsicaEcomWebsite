import React from 'react';
import './Loader.css';

const Loader = ({ size = 'md', fullPage = false, text = '' }) => {
  const cls = `loader-spinner loader-${size}`;
  if (fullPage) {
    return (
      <div className="loader-fullpage">
        <div className={cls} />
        {text && <p className="loader-text">{text}</p>}
      </div>
    );
  }
  return (
    <div className="loader-inline">
      <div className={cls} />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
