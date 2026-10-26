import React from 'react';
import { AlertCircle } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ message = 'Something went wrong', retry = null }) => (
  <div className="error-message">
    <div className="error-icon-wrap">
      <AlertCircle size={32} />
    </div>
    <h3>Oops!</h3>
    <p>{message}</p>
    {retry && <button className="btn btn-primary btn-sm" onClick={retry}>Try Again</button>}
  </div>
);

export default ErrorMessage;
