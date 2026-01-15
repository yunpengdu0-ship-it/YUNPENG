/**
 * LocalStorage 管理器
 * 
 * 负责游戏状态的持久化存储，包括：
 * - 保存游戏状态到 LocalStorage
 * - 从 LocalStorage 加载游戏状态
 * - 处理数据损坏和版本兼容性
 * - 清除存储数据
 */

import { GameState, LevelProgress, LevelStatus } from '../game/GameState';

/**
 * 存储版本号
 * 用于处理数据格式的向后兼容性
 */
const STORAGE_VERSION = 1;

/**
 * 存储键名
 */
const STORAGE_KEY = 'harmony-game-state';

/**
 * 序列化的游戏状态
 */
interface SerializedGameState {
  version: number;
  currentLevelId: string | null;
  levelProgress: Array<[string, LevelProgress]>;
  totalScore: number;
  completedLevels: number;
  startTime: number;
  lastSaved: number;
}

/**
 * 保存结果
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * 加载结果
 */
export interface LoadResult {
  success: boolean;
  state?: GameState;
  error?: string;
}

/**
 * LocalStorage 管理器类
 */
export class LocalStorageManager {
  private storageKey: string;
  
  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }
  
  /**
   * 保存游戏状态到 LocalStorage
   * 
   * @param state - 要保存的游戏状态
   * @returns 保存结果
   */
  save(state: GameState): SaveResult {
    try {
      // 检查 LocalStorage 是否可用
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage 不可用',
        };
      }
      
      // 序列化状态
      const serialized = this.serializeState(state);
      
      // 转换为 JSON
      const json = JSON.stringify(serialized);
      
      // 保存到 LocalStorage
      localStorage.setItem(this.storageKey, json);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存失败',
      };
    }
  }
  
  /**
   * 从 LocalStorage 加载游戏状态
   * 
   * @returns 加载结果
   */
  load(): LoadResult {
    try {
      // 检查 LocalStorage 是否可用
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage 不可用',
        };
      }
      
      // 从 LocalStorage 读取
      const json = localStorage.getItem(this.storageKey);
      
      // 如果没有数据
      if (!json) {
        return {
          success: false,
          error: '没有保存的数据',
        };
      }
      
      // 解析 JSON
      const serialized = JSON.parse(json) as SerializedGameState;
      
      // 验证数据
      const validationError = this.validateSerializedState(serialized);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }
      
      // 反序列化状态
      const state = this.deserializeState(serialized);
      
      return {
        success: true,
        state,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '加载失败',
      };
    }
  }
  
  /**
   * 清除存储的数据
   * 
   * @returns 是否成功
   */
  clear(): boolean {
    try {
      if (!this.isLocalStorageAvailable()) {
        return false;
      }
      
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 检查是否有保存的数据
   * 
   * @returns 是否有数据
   */
  hasData(): boolean {
    try {
      if (!this.isLocalStorageAvailable()) {
        return false;
      }
      
      return localStorage.getItem(this.storageKey) !== null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 序列化游戏状态
   * 
   * @param state - 游戏状态
   * @returns 序列化的状态
   */
  private serializeState(state: GameState): SerializedGameState {
    // 将 Map 转换为数组
    const levelProgress = Array.from(state.levelProgress.entries());
    
    return {
      version: STORAGE_VERSION,
      currentLevelId: state.currentLevelId,
      levelProgress,
      totalScore: state.totalScore,
      completedLevels: state.completedLevels,
      startTime: state.startTime,
      lastSaved: Date.now(),
    };
  }
  
  /**
   * 反序列化游戏状态
   * 
   * @param serialized - 序列化的状态
   * @returns 游戏状态
   */
  private deserializeState(serialized: SerializedGameState): GameState {
    // 将数组转换为 Map
    const levelProgress = new Map<string, LevelProgress>(
      serialized.levelProgress
    );
    
    return {
      currentLevelId: serialized.currentLevelId,
      levelProgress,
      totalScore: serialized.totalScore,
      completedLevels: serialized.completedLevels,
      startTime: serialized.startTime,
      lastSaved: serialized.lastSaved,
    };
  }
  
  /**
   * 验证序列化的状态
   * 
   * @param serialized - 序列化的状态
   * @returns 错误消息，如果验证通过则返回 null
   */
  private validateSerializedState(
    serialized: SerializedGameState
  ): string | null {
    // 检查版本号
    if (typeof serialized.version !== 'number') {
      return '数据格式错误：缺少版本号';
    }
    
    // 检查版本兼容性
    if (serialized.version > STORAGE_VERSION) {
      return `数据版本不兼容：当前版本 ${STORAGE_VERSION}，数据版本 ${serialized.version}`;
    }
    
    // 检查必需字段
    if (!Array.isArray(serialized.levelProgress)) {
      return '数据格式错误：levelProgress 必须是数组';
    }
    
    if (typeof serialized.totalScore !== 'number') {
      return '数据格式错误：totalScore 必须是数字';
    }
    
    if (typeof serialized.completedLevels !== 'number') {
      return '数据格式错误：completedLevels 必须是数字';
    }
    
    if (typeof serialized.startTime !== 'number') {
      return '数据格式错误：startTime 必须是数字';
    }
    
    if (typeof serialized.lastSaved !== 'number') {
      return '数据格式错误：lastSaved 必须是数字';
    }
    
    // 验证关卡进度数据
    for (const [levelId, progress] of serialized.levelProgress) {
      if (typeof levelId !== 'string') {
        return '数据格式错误：关卡ID必须是字符串';
      }
      
      if (!this.isValidLevelProgress(progress)) {
        return `数据格式错误：关卡 ${levelId} 的进度数据无效`;
      }
    }
    
    return null;
  }
  
  /**
   * 验证关卡进度数据
   * 
   * @param progress - 关卡进度
   * @returns 是否有效
   */
  private isValidLevelProgress(progress: any): progress is LevelProgress {
    if (typeof progress !== 'object' || progress === null) {
      return false;
    }
    
    if (typeof progress.levelId !== 'string') {
      return false;
    }
    
    if (!Object.values(LevelStatus).includes(progress.status)) {
      return false;
    }
    
    if (typeof progress.score !== 'number') {
      return false;
    }
    
    if (typeof progress.bestScore !== 'number') {
      return false;
    }
    
    if (typeof progress.attempts !== 'number') {
      return false;
    }
    
    if (typeof progress.lastUpdated !== 'number') {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查 LocalStorage 是否可用
   * 
   * @returns 是否可用
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * 默认的 LocalStorage 管理器实例
 */
export const defaultStorageManager = new LocalStorageManager();
