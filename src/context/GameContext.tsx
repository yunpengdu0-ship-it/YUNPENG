import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, createInitialGameState } from '../game/GameState';
import { GameManagerFacade } from '../game/GameManagerFacade';
import { Exercise } from '../types/exercise';
import { ChordProgression } from '../types/music';
import { ValidationResult } from '../validation/types';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * 游戏上下文接口
 */
interface GameContextType {
  /** 游戏状态 */
  gameState: GameState;
  
  /** 当前练习题 */
  currentExercise: Exercise | null;
  
  /** 是否正在加载 */
  isLoading: boolean;
  
  /** 错误消息 */
  error: string | null;
  
  /** 开始关卡 */
  startLevel: (level: number) => Promise<void>;
  
  /** 提交和弦进行 */
  submitProgression: (progression: ChordProgression) => Promise<ValidationResult>;
  
  /** 完成当前练习题 */
  completeExercise: () => void;
  
  /** 跳过当前练习题 */
  skipExercise: () => void;
  
  /** 返回关卡选择 */
  returnToLevelSelect: () => void;
  
  /** 保存进度 */
  saveProgress: () => void;
  
  /** 清除错误 */
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * 游戏上下文提供者属性
 */
interface GameProviderProps {
  children: ReactNode;
}

/**
 * 游戏上下文提供者
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 初始化管理器
  const [gameManager] = useState(() => new GameManagerFacade());

  // 加载游戏进度
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await gameManager.loadProgress();
        setGameState(gameManager.getState());
      } catch (err) {
        const errorMessage = ErrorHandler.handleError(err);
        setError(errorMessage);
        ErrorHandler.logError(err, '加载进度');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [gameManager]);

  /**
   * 开始关卡
   */
  const startLevel = async (level: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await gameManager.startLevel(level);
      setGameState(gameManager.getState());
      
      // 获取当前练习题
      const exercise = gameManager.getCurrentExercise();
      setCurrentExercise(exercise);
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '开始关卡');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 提交和弦进行
   */
  const submitProgression = async (progression: ChordProgression): Promise<ValidationResult> => {
    try {
      setError(null);
      const result = await gameManager.submitProgression(progression);
      setGameState(gameManager.getState());
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '提交和弦进行');
      throw err;
    }
  };

  /**
   * 完成当前练习题
   */
  const completeExercise = () => {
    try {
      setError(null);
      gameManager.completeExercise();
      setGameState(gameManager.getState());
      setCurrentExercise(null);
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '完成练习题');
    }
  };

  /**
   * 跳过当前练习题
   */
  const skipExercise = () => {
    try {
      setError(null);
      setCurrentExercise(null);
      setGameState(gameManager.getState());
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '跳过练习题');
    }
  };

  /**
   * 返回关卡选择
   */
  const returnToLevelSelect = () => {
    try {
      setError(null);
      setCurrentExercise(null);
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '返回关卡选择');
    }
  };

  /**
   * 保存进度
   */
  const saveProgress = () => {
    try {
      setError(null);
      gameManager.saveProgress();
    } catch (err) {
      const errorMessage = ErrorHandler.handleError(err);
      setError(errorMessage);
      ErrorHandler.logError(err, '保存进度');
    }
  };

  /**
   * 清除错误
   */
  const clearError = () => {
    setError(null);
  };

  const value: GameContextType = {
    gameState,
    currentExercise,
    isLoading,
    error,
    startLevel,
    submitProgression,
    completeExercise,
    skipExercise,
    returnToLevelSelect,
    saveProgress,
    clearError
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/**
 * 使用游戏上下文的 Hook
 */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
