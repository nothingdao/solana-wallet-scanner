import React from 'react';

interface TransactionAlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const TransactionAlert: React.FC<TransactionAlertProps> = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  }[type];

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <p className={`${textColor} text-sm font-medium`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 ml-4 text-xl leading-none`}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TransactionAlert;
