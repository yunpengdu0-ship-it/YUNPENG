import React from 'react';
import './LevelSelector.css';

/**
 * 关卡信息
 */
export interface LevelInfo {
  /** 关卡编号（1-60） */
  number: number;
  
  /** 关卡标题（章节标题） */
  title: string;
  
  /** 是否已解锁 */
  isUnlocked: boolean;
  
  /** 是否已完成 */
  isCompleted: boolean;
  
  /** 章节号（可选） */
  chapter?: number;
}

/**
 * 关卡选择器组件属性
 */
export interface LevelSelectorProps {
  /** 所有关卡信息 */
  levels: LevelInfo[];
  
  /** 当前关卡编号 */
  currentLevel: number;
  
  /** 关卡选择回调 */
  onLevelSelect: (level: number) => void;
}

/**
 * 关卡选择器组件
 * 
 * 显示所有60个关卡，包括锁定/解锁状态、完成状态和章节标题
 */
export const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  currentLevel,
  onLevelSelect
}) => {
  /**
   * 获取关卡状态类名
   */
  const getLevelClassName = (level: LevelInfo): string => {
    const classes = ['level-item'];
    
    if (level.number === currentLevel) {
      classes.push('current');
    }
    
    if (level.isCompleted) {
      classes.push('completed');
    } else if (level.isUnlocked) {
      classes.push('unlocked');
    } else {
      classes.push('locked');
    }
    
    return classes.join(' ');
  };

  /**
   * 处理关卡点击
   */
  const handleLevelClick = (level: LevelInfo) => {
    if (level.isUnlocked) {
      onLevelSelect(level.number);
    }
  };

  /**
   * 按章节分组关卡
   */
  const groupedLevels = levels.reduce((groups, level) => {
    const chapter = level.chapter || Math.ceil(level.number / 2);
    if (!groups[chapter]) {
      groups[chapter] = [];
    }
    groups[chapter].push(level);
    return groups;
  }, {} as Record<number, LevelInfo[]>);

  return (
    <div className="level-selector" data-testid="level-selector">
      <div className="level-selector-header">
        <h2>关卡选择</h2>
        <div className="level-stats">
          <span className="stat-item">
            <span className="stat-label">已完成:</span>
            <span className="stat-value" data-testid="stat-value-completed">{levels.filter(l => l.isCompleted).length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">已解锁:</span>
            <span className="stat-value" data-testid="stat-value-unlocked">{levels.filter(l => l.isUnlocked).length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">总计:</span>
            <span className="stat-value" data-testid="stat-value-total">{levels.length}</span>
          </span>
        </div>
      </div>

      <div className="level-legend">
        <div className="legend-item">
          <div className="legend-icon completed"></div>
          <span>已完成</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon unlocked"></div>
          <span>可进行</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon locked"></div>
          <span>未解锁</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon current"></div>
          <span>当前关卡</span>
        </div>
      </div>

      <div className="level-chapters">
        {Object.entries(groupedLevels)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([chapterNum, chapterLevels]) => {
            const firstLevel = chapterLevels[0];
            return (
              <div key={chapterNum} className="chapter-section">
                <div className="chapter-header">
                  <h3>第 {chapterNum} 章</h3>
                  {firstLevel.title && (
                    <span className="chapter-title">{firstLevel.title}</span>
                  )}
                </div>
                <div className="chapter-levels">
                  {chapterLevels.map(level => (
                    <button
                      key={level.number}
                      className={getLevelClassName(level)}
                      onClick={() => handleLevelClick(level)}
                      disabled={!level.isUnlocked}
                      data-testid={`level-${level.number}`}
                      title={
                        level.isCompleted
                          ? `关卡 ${level.number} - 已完成`
                          : level.isUnlocked
                          ? `关卡 ${level.number} - 点击开始`
                          : `关卡 ${level.number} - 未解锁`
                      }
                    >
                      <span className="level-number">{level.number}</span>
                      {level.isCompleted && (
                        <span className="level-check">✓</span>
                      )}
                      {!level.isUnlocked && (
                        <span className="level-lock">🔒</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
