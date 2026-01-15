/**
 * 游戏状态管理模块
 * 
 * 定义游戏的核心状态数据结构和初始化函数
 */

import { ChordProgression } from '../types/music';

/**
 * 关卡状态
 */
export enum LevelStatus {
  /** 已锁定 - 尚未解锁 */
  LOCKED = 'locked',
  /** 已解锁 - 可以开始 */
  UNLOCKED = 'unlocked',
  /** 进行中 - 已开始但未完成 */
  IN_PROGRESS = 'in_progress',
  /** 已完成 - 已成功完成 */
  COMPLETED = 'completed',
}

/**
 * 关卡进度数据
 */
export interface LevelProgress {
  /** 关卡ID（格式：chapter-number，如 "1-1"） */
  levelId: string;
  /** 关卡状态 */
  status: LevelStatus;
  /** 当前分数 */
  score: number;
  /** 最高分数 */
  bestScore: number;
  /** 尝试次数 */
  attempts: number;
  /** 当前和弦进行（如果正在进行中） */
  currentProgression?: ChordProgression;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 游戏状态
 */
export interface GameState {
  /** 当前关卡ID */
  currentLevelId: string | null;
  /** 所有关卡的进度 */
  levelProgress: Map<string, LevelProgress>;
  /** 总分数 */
  totalScore: number;
  /** 已完成的关卡数 */
  completedLevels: number;
  /** 游戏开始时间 */
  startTime: number;
  /** 最后保存时间 */
  lastSaved: number;
}

/**
 * 创建初始的关卡进度
 * 
 * @param levelId - 关卡ID
 * @param status - 初始状态（默认为LOCKED）
 * @returns 关卡进度对象
 */
export function createLevelProgress(
  levelId: string,
  status: LevelStatus = LevelStatus.LOCKED
): LevelProgress {
  return {
    levelId,
    status,
    score: 0,
    bestScore: 0,
    attempts: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * 创建初始游戏状态
 * 
 * 初始状态：
 * - 第一关（1-1）解锁
 * - 其他所有关卡锁定
 * - 总分数为0
 * 
 * @returns 初始游戏状态
 */
export function createInitialGameState(): GameState {
  const levelProgress = new Map<string, LevelProgress>();
  
  // 创建60个关卡的初始进度（30章 × 2题）
  for (let chapter = 1; chapter <= 30; chapter++) {
    for (let number = 1; number <= 2; number++) {
      const levelId = `${chapter}-${number}`;
      const status = (chapter === 1 && number === 1) 
        ? LevelStatus.UNLOCKED 
        : LevelStatus.LOCKED;
      levelProgress.set(levelId, createLevelProgress(levelId, status));
    }
  }
  
  const now = Date.now();
  
  return {
    currentLevelId: null,
    levelProgress,
    totalScore: 0,
    completedLevels: 0,
    startTime: now,
    lastSaved: now,
  };
}

/**
 * 克隆游戏状态
 * 
 * @param state - 要克隆的游戏状态
 * @returns 克隆的游戏状态
 */
export function cloneGameState(state: GameState): GameState {
  const levelProgress = new Map<string, LevelProgress>();
  
  state.levelProgress.forEach((progress, levelId) => {
    levelProgress.set(levelId, {
      ...progress,
      currentProgression: progress.currentProgression 
        ? {
            chords: [...progress.currentProgression.chords],
            key: progress.currentProgression.key
          }
        : undefined,
    });
  });
  
  return {
    ...state,
    levelProgress,
  };
}

/**
 * 获取关卡进度
 * 
 * @param state - 游戏状态
 * @param levelId - 关卡ID
 * @returns 关卡进度，如果不存在则返回undefined
 */
export function getLevelProgress(
  state: GameState,
  levelId: string
): LevelProgress | undefined {
  return state.levelProgress.get(levelId);
}

/**
 * 更新关卡进度
 * 
 * @param state - 游戏状态
 * @param levelId - 关卡ID
 * @param updates - 要更新的字段
 * @returns 更新后的游戏状态
 */
export function updateLevelProgress(
  state: GameState,
  levelId: string,
  updates: Partial<LevelProgress>
): GameState {
  const newState = cloneGameState(state);
  const progress = newState.levelProgress.get(levelId);
  
  if (!progress) {
    throw new Error(`关卡不存在: ${levelId}`);
  }
  
  newState.levelProgress.set(levelId, {
    ...progress,
    ...updates,
    lastUpdated: Date.now(),
  });
  
  newState.lastSaved = Date.now();
  
  return newState;
}

/**
 * 获取所有已解锁的关卡
 * 
 * @param state - 游戏状态
 * @returns 已解锁关卡的ID列表
 */
export function getUnlockedLevels(state: GameState): string[] {
  const unlockedLevels: string[] = [];
  
  state.levelProgress.forEach((progress, levelId) => {
    if (progress.status !== LevelStatus.LOCKED) {
      unlockedLevels.push(levelId);
    }
  });
  
  return unlockedLevels.sort();
}

/**
 * 获取所有已完成的关卡
 * 
 * @param state - 游戏状态
 * @returns 已完成关卡的ID列表
 */
export function getCompletedLevels(state: GameState): string[] {
  const completedLevels: string[] = [];
  
  state.levelProgress.forEach((progress, levelId) => {
    if (progress.status === LevelStatus.COMPLETED) {
      completedLevels.push(levelId);
    }
  });
  
  return completedLevels.sort();
}

/**
 * 检查关卡是否已解锁
 * 
 * @param state - 游戏状态
 * @param levelId - 关卡ID
 * @returns 是否已解锁
 */
export function isLevelUnlocked(state: GameState, levelId: string): boolean {
  const progress = state.levelProgress.get(levelId);
  return progress ? progress.status !== LevelStatus.LOCKED : false;
}

/**
 * 检查关卡是否已完成
 * 
 * @param state - 游戏状态
 * @param levelId - 关卡ID
 * @returns 是否已完成
 */
export function isLevelCompleted(state: GameState, levelId: string): boolean {
  const progress = state.levelProgress.get(levelId);
  return progress ? progress.status === LevelStatus.COMPLETED : false;
}
