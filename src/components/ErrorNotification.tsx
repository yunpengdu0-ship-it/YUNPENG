/**
 * 错误通知组件
 * 
 * 显示用户友好的错误消息
 */

import React, { useEffect } from 'react';
import './ErrorNotification.css';

interface ErrorNotificationProps {
  /** 错误消息 */
  message: string | null;
  
  /** 关闭回调 */
  onClose: () => void;
  
  /** 自动关闭延迟（毫秒），0 表示不自动关闭 */
  autoCloseDelay?: number;
}

/**
 * 错误通知组件
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  onClose,
  autoCloseDelay = 5000,
}) => {
  // 自动关闭
  useEffect(() => {
    if (message && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [message, autoCloseDelay, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="error-notification" role="alert" data-testid="error-notification">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <p className="error-message">{message}</p>
        <button
          className="error-close"
          onClick={onClose}
          aria-label="关闭错误提示"
        >
          ×
        </button>
      </div>
    </div>
  );
};
