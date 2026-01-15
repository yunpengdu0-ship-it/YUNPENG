/**
 * 游戏管理器
 * 
 * 负责游戏逻辑的核心管理，包括：
 * - 关卡开始和完成
 * - 练习题提交和验证
 * - 分数计算和更新
 * - 关卡解锁逻辑
 */

import {
  GameState,
  LevelStatus,
  updateLevelProgress,
  getLevelProgress,
  isLevelUnlocked,
  cloneGameState,
} from './GameState';
import { ExerciseRepository } from '../data/ExerciseRepository';
import { RuleEngine } from '../validation/RuleEngine';
import { ChordProgression } from '../types/music';
import { ValidationResult } from '../validation/types';
import { Exercise } from '../types/exercise';

/**
 * 关卡开始结果
 */
export interface LevelStartResult {
  /** 是否成功 */
  success: boolean;
  /** 错误消息（如果失败） */
  error?: string;
  /** 练习题数据 */
  exercise?: Exercise;
  /** 更新后的游戏状态 */
  state: GameState;
}

/**
 * 练习题提交结果
 */
export interface SubmissionResult {
  /** 验证结果 */
  validation: ValidationResult;
  /** 获得的分数 */
  score: number;
  /** 是否完成关卡 */
  levelCompleted: boolean;
  /** 更新后的游戏状态 */
  state: GameState;
  /** 解锁的新关卡列表 */
  unlockedLevels: string[];
}

/**
 * 游戏管理器配置
 */
export interface GameManagerConfig {
  /** 练习题仓库 */
  exerciseRepository: ExerciseRepository;
  /** 规则验证引擎 */
  ruleEngine: RuleEngine;
  /** 完美分数（无错误） */
  perfectScore?: number;
  /** 每个错误的扣分 */
  errorPenalty?: number;
}

/**
 * 游戏管理器类
 */
export class GameManager {
  private exerciseRepository: ExerciseRepository;
  private ruleEngine: RuleEngine;
  private perfectScore: number;
  private errorPenalty: number;
  
  constructor(config: GameManagerConfig) {
    this.exerciseRepository = config.exerciseRepository;
    this.ruleEngine = config.ruleEngine;
    this.perfectScore = config.perfectScore ?? 100;
    this.errorPenalty = config.errorPenalty ?? 10;
  }
  
  /**
   * 开始关卡
   * 
   * @param state - 当前游戏状态
   * @param levelId - 要开始的关卡ID
   * @returns 关卡开始结果
   */
  startLevel(state: GameState, levelId: string): LevelStartResult {
    // 检查关卡是否存在
    const progress = getLevelProgress(state, levelId);
    if (!progress) {
      return {
        success: false,
        error: `关卡不存在: ${levelId}`,
        state,
      };
    }
    
    // 检查关卡是否已解锁
    if (!isLevelUnlocked(state, levelId)) {
      return {
        success: false,
        error: `关卡未解锁: ${levelId}`,
        state,
      };
    }
    
    // 获取练习题
    const exercise = this.exerciseRepository.getExerciseById(levelId);
    if (!exercise) {
      return {
        success: false,
        error: `练习题不存在: ${levelId}`,
        state,
      };
    }
    
    // 更新状态
    let newState = cloneGameState(state);
    newState.currentLevelId = levelId;
    
    // 增加尝试次数
    const currentProgress = getLevelProgress(newState, levelId)!;
    newState = updateLevelProgress(newState, levelId, {
      attempts: currentProgress.attempts + 1,
    });
    
    // 如果关卡未开始过，更新为进行中状态
    if (progress.status === LevelStatus.UNLOCKED) {
      newState = updateLevelProgress(newState, levelId, {
        status: LevelStatus.IN_PROGRESS,
      });
    }
    
    return {
      success: true,
      exercise,
      state: newState,
    };
  }
  
  /**
   * 提交练习题答案
   * 
   * @param state - 当前游戏状态
   * @param levelId - 关卡ID
   * @param progression - 和弦进行
   * @returns 提交结果
   */
  submitExercise(
    state: GameState,
    levelId: string,
    progression: ChordProgression
  ): SubmissionResult {
    // 获取练习题
    const exercise = this.exerciseRepository.getExerciseById(levelId);
    if (!exercise) {
      throw new Error(`练习题不存在: ${levelId}`);
    }
    
    // 验证和弦进行
    const validation = this.ruleEngine.validate(progression, exercise.chapter);
    
    // 计算分数
    const score = this.calculateScore(validation);
    
    // 检查是否完成关卡（无错误）
    const levelCompleted = validation.isValid;
    
    // 更新游戏状态
    let newState = cloneGameState(state);
    const progress = getLevelProgress(newState, levelId)!;
    
    // 更新关卡进度
    const updates: any = {
      score,
      currentProgression: progression,
    };
    
    // 如果完成关卡
    if (levelCompleted) {
      updates.status = LevelStatus.COMPLETED;
      
      // 更新最高分
      if (score > progress.bestScore) {
        updates.bestScore = score;
      }
    }
    
    newState = updateLevelProgress(newState, levelId, updates);
    
    // 更新总分数（只在首次完成时增加）
    if (levelCompleted && progress.status !== LevelStatus.COMPLETED) {
      newState.totalScore += score;
      newState.completedLevels += 1;
    }
    
    // 解锁新关卡
    const unlockedLevels = this.unlockNextLevels(newState, levelId, levelCompleted);
    
    return {
      validation,
      score,
      levelCompleted,
      state: newState,
      unlockedLevels,
    };
  }
  
  /**
   * 计算分数
   * 
   * 分数计算规则：
   * - 完美分数（无错误）：perfectScore
   * - 每个错误扣除：errorPenalty
   * - 最低分数：0
   * 
   * @param validation - 验证结果
   * @returns 分数
   */
  private calculateScore(validation: ValidationResult): number {
    if (validation.isValid) {
      return this.perfectScore;
    }
    
    const errorCount = validation.errors.length;
    const score = this.perfectScore - errorCount * this.errorPenalty;
    
    return Math.max(0, score);
  }
  
  /**
   * 解锁下一个关卡
   * 
   * 解锁规则：
   * - 完成关卡X-1后，解锁关卡X-2
   * - 完成关卡X-2后，解锁关卡(X+1)-1
   * - 即：完成一章的两个练习后，解锁下一章的第一个练习
   * 
   * @param state - 当前游戏状态（会被修改）
   * @param completedLevelId - 刚完成的关卡ID
   * @param levelCompleted - 是否成功完成
   * @returns 新解锁的关卡ID列表
   */
  private unlockNextLevels(
    state: GameState,
    completedLevelId: string,
    levelCompleted: boolean
  ): string[] {
    if (!levelCompleted) {
      return [];
    }
    
    const unlockedLevels: string[] = [];
    const [chapterStr, numberStr] = completedLevelId.split('-');
    const chapter = parseInt(chapterStr, 10);
    const number = parseInt(numberStr, 10);
    
    // 如果完成了X-1，解锁X-2
    if (number === 1) {
      const nextLevelId = `${chapter}-2`;
      const nextProgress = getLevelProgress(state, nextLevelId);
      
      if (nextProgress && nextProgress.status === LevelStatus.LOCKED) {
        // 直接修改 state（因为 state 已经是克隆的）
        const updatedState = updateLevelProgress(state, nextLevelId, {
          status: LevelStatus.UNLOCKED,
        });
        // 更新 state 的引用
        Object.assign(state, updatedState);
        unlockedLevels.push(nextLevelId);
      }
    }
    
    // 如果完成了X-2，解锁(X+1)-1
    if (number === 2) {
      const nextChapter = chapter + 1;
      const nextLevelId = `${nextChapter}-1`;
      const nextProgress = getLevelProgress(state, nextLevelId);
      
      if (nextProgress && nextProgress.status === LevelStatus.LOCKED) {
        // 直接修改 state（因为 state 已经是克隆的）
        const updatedState = updateLevelProgress(state, nextLevelId, {
          status: LevelStatus.UNLOCKED,
        });
        // 更新 state 的引用
        Object.assign(state, updatedState);
        unlockedLevels.push(nextLevelId);
      }
    }
    
    return unlockedLevels;
  }
  
  /**
   * 重置关卡
   * 
   * @param state - 当前游戏状态
   * @param levelId - 要重置的关卡ID
   * @returns 更新后的游戏状态
   */
  resetLevel(state: GameState, levelId: string): GameState {
    const progress = getLevelProgress(state, levelId);
    if (!progress) {
      throw new Error(`关卡不存在: ${levelId}`);
    }
    
    return updateLevelProgress(state, levelId, {
      currentProgression: undefined,
    });
  }
  
  /**
   * 保存当前进度
   * 
   * @param state - 当前游戏状态
   * @param levelId - 关卡ID
   * @param progression - 当前和弦进行
   * @returns 更新后的游戏状态
   */
  saveProgress(
    state: GameState,
    levelId: string,
    progression: ChordProgression
  ): GameState {
    return updateLevelProgress(state, levelId, {
      currentProgression: progression,
    });
  }
}
