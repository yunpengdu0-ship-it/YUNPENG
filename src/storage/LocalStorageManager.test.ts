/**
 * LocalStorageManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageManager } from './LocalStorageManager';
import { createInitialGameState, updateLevelProgress, LevelStatus } from '../game/GameState';

describe('LocalStorageManager', () => {
  let storageManager: LocalStorageManager;
  const testKey = 'test-harmony-game-state';
  
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    
    // 创建测试用的存储管理器
    storageManager = new LocalStorageManager(testKey);
  });
  
  afterEach(() => {
    // 清理
    localStorage.clear();
  });
  
  describe('save', () => {
    it('应该成功保存游戏状态', () => {
      const state = createInitialGameState();
      const result = storageManager.save(state);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('应该将状态保存到 localStorage', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      const saved = localStorage.getItem(testKey);
      expect(saved).not.toBeNull();
    });
    
    it('应该保存所有状态字段', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      const saved = JSON.parse(localStorage.getItem(testKey)!);
      
      expect(saved.version).toBe(1);
      expect(saved.totalScore).toBe(state.totalScore);
      expect(saved.completedLevels).toBe(state.completedLevels);
      expect(saved.startTime).toBe(state.startTime);
      expect(saved.levelProgress).toBeInstanceOf(Array);
      expect(saved.levelProgress.length).toBe(60);
    });
    
    it('应该保存关卡进度', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', {
        status: LevelStatus.COMPLETED,
        score: 100,
        bestScore: 100,
      });
      
      storageManager.save(state);
      
      const saved = JSON.parse(localStorage.getItem(testKey)!);
      const progress1_1 = saved.levelProgress.find(
        ([id]: [string, any]) => id === '1-1'
      );
      
      expect(progress1_1).toBeDefined();
      expect(progress1_1[1].status).toBe(LevelStatus.COMPLETED);
      expect(progress1_1[1].score).toBe(100);
    });
    
    it('应该更新 lastSaved 时间戳', () => {
      const state = createInitialGameState();
      const beforeSave = Date.now();
      
      storageManager.save(state);
      
      const saved = JSON.parse(localStorage.getItem(testKey)!);
      expect(saved.lastSaved).toBeGreaterThanOrEqual(beforeSave);
    });
  });
  
  describe('load', () => {
    it('应该成功加载保存的状态', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      const result = storageManager.load();
      
      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.error).toBeUndefined();
    });
    
    it('应该返回错误如果没有保存的数据', () => {
      const result = storageManager.load();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('没有保存的数据');
      expect(result.state).toBeUndefined();
    });
    
    it('应该正确恢复所有状态字段', () => {
      const originalState = createInitialGameState();
      storageManager.save(originalState);
      
      const result = storageManager.load();
      const loadedState = result.state!;
      
      expect(loadedState.totalScore).toBe(originalState.totalScore);
      expect(loadedState.completedLevels).toBe(originalState.completedLevels);
      expect(loadedState.startTime).toBe(originalState.startTime);
      expect(loadedState.levelProgress.size).toBe(60);
    });
    
    it('应该正确恢复关卡进度', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', {
        status: LevelStatus.COMPLETED,
        score: 100,
        bestScore: 100,
        attempts: 3,
      });
      
      storageManager.save(state);
      
      const result = storageManager.load();
      const loadedState = result.state!;
      const progress1_1 = loadedState.levelProgress.get('1-1')!;
      
      expect(progress1_1.status).toBe(LevelStatus.COMPLETED);
      expect(progress1_1.score).toBe(100);
      expect(progress1_1.bestScore).toBe(100);
      expect(progress1_1.attempts).toBe(3);
    });
    
    it('应该返回错误如果数据损坏', () => {
      localStorage.setItem(testKey, 'invalid json');
      
      const result = storageManager.load();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('应该返回错误如果缺少版本号', () => {
      const invalidData = {
        totalScore: 0,
        completedLevels: 0,
      };
      
      localStorage.setItem(testKey, JSON.stringify(invalidData));
      
      const result = storageManager.load();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('版本号');
    });
    
    it('应该返回错误如果版本不兼容', () => {
      const futureVersion = {
        version: 999,
        totalScore: 0,
        completedLevels: 0,
        levelProgress: [],
        startTime: Date.now(),
        lastSaved: Date.now(),
      };
      
      localStorage.setItem(testKey, JSON.stringify(futureVersion));
      
      const result = storageManager.load();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('版本不兼容');
    });
    
    it('应该返回错误如果数据格式错误', () => {
      const invalidData = {
        version: 1,
        totalScore: 'not a number',
        completedLevels: 0,
        levelProgress: [],
        startTime: Date.now(),
        lastSaved: Date.now(),
      };
      
      localStorage.setItem(testKey, JSON.stringify(invalidData));
      
      const result = storageManager.load();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('格式错误');
    });
  });
  
  describe('clear', () => {
    it('应该清除保存的数据', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      expect(localStorage.getItem(testKey)).not.toBeNull();
      
      const result = storageManager.clear();
      
      expect(result).toBe(true);
      expect(localStorage.getItem(testKey)).toBeNull();
    });
    
    it('应该在没有数据时也能成功', () => {
      const result = storageManager.clear();
      
      expect(result).toBe(true);
    });
  });
  
  describe('hasData', () => {
    it('应该返回 false 如果没有数据', () => {
      expect(storageManager.hasData()).toBe(false);
    });
    
    it('应该返回 true 如果有数据', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      expect(storageManager.hasData()).toBe(true);
    });
    
    it('应该在清除后返回 false', () => {
      const state = createInitialGameState();
      storageManager.save(state);
      
      expect(storageManager.hasData()).toBe(true);
      
      storageManager.clear();
      
      expect(storageManager.hasData()).toBe(false);
    });
  });
  
  describe('往返一致性', () => {
    it('保存然后加载应该得到相同的状态', () => {
      const originalState = createInitialGameState();
      
      storageManager.save(originalState);
      const result = storageManager.load();
      const loadedState = result.state!;
      
      expect(loadedState.totalScore).toBe(originalState.totalScore);
      expect(loadedState.completedLevels).toBe(originalState.completedLevels);
      expect(loadedState.startTime).toBe(originalState.startTime);
      expect(loadedState.currentLevelId).toBe(originalState.currentLevelId);
      expect(loadedState.levelProgress.size).toBe(originalState.levelProgress.size);
    });
    
    it('应该保持关卡进度的完整性', () => {
      let state = createInitialGameState();
      
      // 修改多个关卡
      state = updateLevelProgress(state, '1-1', {
        status: LevelStatus.COMPLETED,
        score: 100,
        bestScore: 100,
        attempts: 2,
      });
      
      state = updateLevelProgress(state, '1-2', {
        status: LevelStatus.IN_PROGRESS,
        score: 50,
        attempts: 1,
      });
      
      state = updateLevelProgress(state, '2-1', {
        status: LevelStatus.UNLOCKED,
      });
      
      storageManager.save(state);
      const result = storageManager.load();
      const loadedState = result.state!;
      
      // 验证所有修改都被保存
      const progress1_1 = loadedState.levelProgress.get('1-1')!;
      expect(progress1_1.status).toBe(LevelStatus.COMPLETED);
      expect(progress1_1.score).toBe(100);
      expect(progress1_1.attempts).toBe(2);
      
      const progress1_2 = loadedState.levelProgress.get('1-2')!;
      expect(progress1_2.status).toBe(LevelStatus.IN_PROGRESS);
      expect(progress1_2.score).toBe(50);
      
      const progress2_1 = loadedState.levelProgress.get('2-1')!;
      expect(progress2_1.status).toBe(LevelStatus.UNLOCKED);
    });
    
    it('多次保存和加载应该保持一致', () => {
      let state = createInitialGameState();
      
      // 第一次保存和加载
      storageManager.save(state);
      let result = storageManager.load();
      state = result.state!;
      
      // 修改状态
      state = updateLevelProgress(state, '1-1', {
        status: LevelStatus.COMPLETED,
        score: 100,
      });
      
      // 第二次保存和加载
      storageManager.save(state);
      result = storageManager.load();
      const finalState = result.state!;
      
      expect(finalState.levelProgress.get('1-1')!.status).toBe(LevelStatus.COMPLETED);
      expect(finalState.levelProgress.get('1-1')!.score).toBe(100);
    });
  });
  
  describe('错误处理', () => {
    it('应该处理 localStorage 不可用的情况', () => {
      // 模拟 localStorage 不可用
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      
      const state = createInitialGameState();
      const result = storageManager.save(state);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // 恢复
      Storage.prototype.setItem = originalSetItem;
    });
  });
});
