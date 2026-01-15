import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { LevelSelector, LevelInfo } from './LevelSelector';
import { ExerciseView } from './ExerciseView';
import { ErrorNotification } from './ErrorNotification';
import { ValidationError } from '../validation/types';
import { ChordProgression } from '../types/music';
import { isLevelUnlocked, isLevelCompleted } from '../game/GameState';
import './GameView.css';

/**
 * 游戏视图组件
 * 
 * 主游戏界面，整合关卡选择和练习题视图
 */
export const GameView: React.FC = () => {
  const {
    gameState,
    currentExercise,
    isLoading,
    error,
    startLevel,
    submitProgression,
    completeExercise,
    skipExercise,
    returnToLevelSelect,
    clearError
  } = useGame();

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  /**
   * 生成关卡信息列表（使用 useMemo 缓存）
   */
  const levelInfoList = useMemo((): LevelInfo[] => {
    const levels: LevelInfo[] = [];
    
    for (let i = 1; i <= 60; i++) {
      const chapter = Math.ceil(i / 2);
      const number = i % 2 === 0 ? 2 : 1;
      const levelId = `${chapter}-${number}`;
      
      levels.push({
        number: i,
        title: `第 ${chapter} 章`,
        chapter,
        isUnlocked: isLevelUnlocked(gameState, levelId),
        isCompleted: isLevelCompleted(gameState, levelId)
      });
    }
    
    return levels;
  }, [gameState.levelProgress]);

  /**
   * 计算当前关卡编号（从 levelId 转换为 1-60）
   */
  const currentLevelNumber = useMemo((): number => {
    if (!gameState.currentLevelId) {
      return 1;
    }
    const [chapter, number] = gameState.currentLevelId.split('-').map(Number);
    return (chapter - 1) * 2 + number;
  }, [gameState.currentLevelId]);

  /**
   * 处理关卡选择（使用 useCallback 缓存）
   */
  const handleLevelSelect = useCallback(async (level: number) => {
    try {
      await startLevel(level);
      setValidationErrors([]);
      setShowSolution(false);
    } catch (error) {
      // 错误已在 GameContext 中处理
    }
  }, [startLevel]);

  /**
   * 处理练习题提交（使用 useCallback 缓存）
   */
  const handleExerciseSubmit = useCallback(async (progression: ChordProgression) => {
    try {
      const result = await submitProgression(progression);
      
      if (result.isValid) {
        setValidationErrors([]);
        alert('恭喜！和弦进行正确！');
        completeExercise();
      } else {
        setValidationErrors(result.errors);
        alert('和弦进行有错误，请查看错误提示并修正。');
      }
    } catch (error) {
      // 错误已在 GameContext 中处理
    }
  }, [submitProgression, completeExercise]);

  /**
   * 处理跳过练习题（使用 useCallback 缓存）
   */
  const handleSkipExercise = useCallback(() => {
    if (confirm('确定要跳过这个练习题吗？')) {
      skipExercise();
      setValidationErrors([]);
      setShowSolution(false);
    }
  }, [skipExercise]);

  /**
   * 处理返回关卡选择（使用 useCallback 缓存）
   */
  const handleReturnToLevelSelect = useCallback(() => {
    returnToLevelSelect();
    setValidationErrors([]);
    setShowSolution(false);
  }, [returnToLevelSelect]);

  /**
   * 处理显示/隐藏答案（使用 useCallback 缓存）
   */
  const handleToggleSolution = useCallback(() => {
    setShowSolution(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className="game-view loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="game-view" data-testid="game-view">
      {/* 错误通知 */}
      <ErrorNotification
        message={error}
        onClose={clearError}
        autoCloseDelay={5000}
      />

      {/* 头部 */}
      <header className="game-header">
        <h1>和声游戏</h1>
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">总分</span>
            <span className="stat-value">{gameState.totalScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">已完成</span>
            <span className="stat-value">{gameState.completedLevels}</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="game-main">
        {currentExercise ? (
          <div className="exercise-container">
            <button
              className="back-button"
              onClick={handleReturnToLevelSelect}
              data-testid="back-to-levels"
            >
              ← 返回关卡选择
            </button>
            
            <ExerciseView
              exercise={currentExercise}
              onSubmit={handleExerciseSubmit}
              onShowSolution={handleToggleSolution}
              onSkip={handleSkipExercise}
              validationErrors={validationErrors}
              showSolution={showSolution}
              isCompleted={isLevelCompleted(gameState, currentExercise.id)}
            />
          </div>
        ) : (
          <LevelSelector
            levels={levelInfoList}
            currentLevel={currentLevelNumber}
            onLevelSelect={handleLevelSelect}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="game-footer">
        <p>基于《斯波索宾和声学教程》的互动式学习工具</p>
      </footer>
    </div>
  );
};
