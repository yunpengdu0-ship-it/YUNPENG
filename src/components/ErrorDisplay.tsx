import type { ValidationError } from '../validation/types';

/**
 * ErrorDisplay 组件属性
 */
export interface ErrorDisplayProps {
  /** 要显示的错误列表 */
  errors: ValidationError[];
  /** 点击错误时的回调 */
  onErrorClick?: (error: ValidationError) => void;
}

/**
 * 错误显示组件
 * 显示验证错误列表，包括规则名称、错误消息和章节引用
 */
export function ErrorDisplay({ errors, onErrorClick }: ErrorDisplayProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="error-display" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>⚠️</span>
        <h3 style={styles.title}>发现 {errors.length} 个和声错误</h3>
      </div>

      <div style={styles.errorList}>
        {errors.map((error, index) => (
          <div
            key={index}
            className="error-item"
            style={styles.errorItem}
            onClick={() => onErrorClick?.(error)}
            role={onErrorClick ? 'button' : undefined}
            tabIndex={onErrorClick ? 0 : undefined}
          >
            <div style={styles.errorHeader}>
              <span style={styles.errorNumber}>{index + 1}.</span>
              <span style={styles.ruleName}>{error.ruleName}</span>
              {error.chapterReference && (
                <span style={styles.chapterRef}>
                  第 {error.chapterReference} 章
                </span>
              )}
            </div>

            <div style={styles.errorMessage}>{error.message}</div>

            {error.affectedVoices && error.affectedVoices.length > 0 && (
              <div style={styles.affectedInfo}>
                <span style={styles.label}>受影响的声部：</span>
                <span style={styles.value}>
                  {error.affectedVoices.map(v => getVoiceName(v)).join(', ')}
                </span>
              </div>
            )}

            {error.affectedChords && error.affectedChords.length > 0 && (
              <div style={styles.affectedInfo}>
                <span style={styles.label}>受影响的和弦：</span>
                <span style={styles.value}>
                  {error.affectedChords.map(c => `第 ${c + 1} 个`).join(', ')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          💡 提示：点击错误可以在五线谱上高亮显示相关音符
        </p>
      </div>
    </div>
  );
}

/**
 * 获取声部名称
 */
function getVoiceName(voiceIndex: number): string {
  const voiceNames = ['女高音', '女低音', '男高音', '男低音'];
  return voiceNames[voiceIndex] || `声部 ${voiceIndex}`;
}

/**
 * 组件样式
 */
const styles = {
  container: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #ffc107'
  } as React.CSSProperties,

  icon: {
    fontSize: '24px',
    marginRight: '8px'
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#856404'
  } as React.CSSProperties,

  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  } as React.CSSProperties,

  errorItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#fffbf0',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
    }
  } as React.CSSProperties,

  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  } as React.CSSProperties,

  errorNumber: {
    fontWeight: 'bold',
    color: '#856404',
    fontSize: '14px'
  } as React.CSSProperties,

  ruleName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  } as React.CSSProperties,

  chapterRef: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: '2px 8px',
    borderRadius: '4px'
  } as React.CSSProperties,

  errorMessage: {
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '8px'
  } as React.CSSProperties,

  affectedInfo: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  } as React.CSSProperties,

  label: {
    fontWeight: 'bold',
    marginRight: '4px'
  } as React.CSSProperties,

  value: {
    color: '#333'
  } as React.CSSProperties,

  footer: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #ffc107'
  } as React.CSSProperties,

  footerText: {
    margin: 0,
    fontSize: '12px',
    color: '#856404',
    fontStyle: 'italic'
  } as React.CSSProperties
};
