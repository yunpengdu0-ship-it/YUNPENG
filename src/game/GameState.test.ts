/**
 * GameState 模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  LevelStatus,
  createLevelProgress,
  createInitialGameState,
  cloneGameState,
  getLevelProgress,
  updateLevelProgress,
  getUnlockedLevels,
  getCompletedLevels,
  isLevelUnlocked,
  isLevelCompleted,
} from './GameState';
import { createNote } from '../core/musicUtils';

describe('GameState', () => {
  describe('createLevelProgress', () => {
    it('应该创建锁定状态的关卡进度', () => {
      const progress = createLevelProgress('1-1');
      
      expect(progress.levelId).toBe('1-1');
      expect(progress.status).toBe(LevelStatus.LOCKED);
      expect(progress.score).toBe(0);
      expect(progress.bestScore).toBe(0);
      expect(progress.attempts).toBe(0);
      expect(progress.currentProgression).toBeUndefined();
      expect(progress.lastUpdated).toBeGreaterThan(0);
    });
    
    it('应该创建指定状态的关卡进度', () => {
      const progress = createLevelProgress('1-1', LevelStatus.UNLOCKED);
      
      expect(progress.status).toBe(LevelStatus.UNLOCKED);
    });
  });
  
  describe('createInitialGameState', () => {
    it('应该创建包含60个关卡的初始状态', () => {
      const state = createInitialGameState();
      
      expect(state.levelProgress.size).toBe(60);
      expect(state.totalScore).toBe(0);
      expect(state.completedLevels).toBe(0);
      expect(state.currentLevelId).toBeNull();
    });
    
    it('应该只解锁第一关', () => {
      const state = createInitialGameState();
      
      const level1_1 = state.levelProgress.get('1-1');
      expect(level1_1?.status).toBe(LevelStatus.UNLOCKED);
      
      const level1_2 = state.levelProgress.get('1-2');
      expect(level1_2?.status).toBe(LevelStatus.LOCKED);
      
      const level2_1 = state.levelProgress.get('2-1');
      expect(level2_1?.status).toBe(LevelStatus.LOCKED);
    });
    
    it('应该创建所有章节的关卡', () => {
      const state = createInitialGameState();
      
      // 检查第1章
      expect(state.levelProgress.has('1-1')).toBe(true);
      expect(state.levelProgress.has('1-2')).toBe(true);
      
      // 检查第30章
      expect(state.levelProgress.has('30-1')).toBe(true);
      expect(state.levelProgress.has('30-2')).toBe(true);
    });
  });
  
  describe('cloneGameState', () => {
    it('应该创建游戏状态的深拷贝', () => {
      const original = createInitialGameState();
      const cloned = cloneGameState(original);
      
      expect(cloned).not.toBe(original);
      expect(cloned.levelProgress).not.toBe(original.levelProgress);
      expect(cloned.totalScore).toBe(original.totalScore);
    });
    
    it('应该克隆关卡进度的Map', () => {
      const original = createInitialGameState();
      const cloned = cloneGameState(original);
      
      // 修改克隆的状态不应影响原始状态
      const progress = cloned.levelProgress.get('1-1')!;
      progress.score = 100;
      
      expect(original.levelProgress.get('1-1')!.score).toBe(0);
    });
    
    it('应该克隆和弦进行', () => {
      const original = createInitialGameState();
      const progression = [
        [createNote('C', 4), createNote('E', 4), createNote('G', 4), createNote('C', 3)],
      ];
      
      const updated = updateLevelProgress(original, '1-1', {
        currentProgression: progression,
      });
      
      const cloned = cloneGameState(updated);
      
      expect(cloned.levelProgress.get('1-1')!.currentProgression).not.toBe(
        updated.levelProgress.get('1-1')!.currentProgression
      );
    });
  });
  
  describe('getLevelProgress', () => {
    it('应该返回存在的关卡进度', () => {
      const state = createInitialGameState();
      const progress = getLevelProgress(state, '1-1');
      
      expect(progress).toBeDefined();
      expect(progress!.levelId).toBe('1-1');
    });
    
    it('应该返回undefined对于不存在的关卡', () => {
      const state = createInitialGameState();
      const progress = getLevelProgress(state, '99-99');
      
      expect(progress).toBeUndefined();
    });
  });
  
  describe('updateLevelProgress', () => {
    it('应该更新关卡进度', () => {
      const state = createInitialGameState();
      const updated = updateLevelProgress(state, '1-1', {
        score: 100,
        status: LevelStatus.COMPLETED,
      });
      
      const progress = updated.levelProgress.get('1-1')!;
      expect(progress.score).toBe(100);
      expect(progress.status).toBe(LevelStatus.COMPLETED);
    });
    
    it('应该更新lastUpdated时间戳', () => {
      const state = createInitialGameState();
      const originalTime = state.levelProgress.get('1-1')!.lastUpdated;
      
      // 等待一小段时间确保时间戳不同
      const updated = updateLevelProgress(state, '1-1', { score: 50 });
      const newTime = updated.levelProgress.get('1-1')!.lastUpdated;
      
      expect(newTime).toBeGreaterThanOrEqual(originalTime);
    });
    
    it('应该更新lastSaved时间戳', () => {
      const state = createInitialGameState();
      const originalTime = state.lastSaved;
      
      const updated = updateLevelProgress(state, '1-1', { score: 50 });
      
      expect(updated.lastSaved).toBeGreaterThanOrEqual(originalTime);
    });
    
    it('应该抛出错误对于不存在的关卡', () => {
      const state = createInitialGameState();
      
      expect(() => {
        updateLevelProgress(state, '99-99', { score: 100 });
      }).toThrow('关卡不存在: 99-99');
    });
    
    it('应该不修改原始状态', () => {
      const state = createInitialGameState();
      const originalScore = state.levelProgress.get('1-1')!.score;
      
      updateLevelProgress(state, '1-1', { score: 100 });
      
      expect(state.levelProgress.get('1-1')!.score).toBe(originalScore);
    });
  });
  
  describe('getUnlockedLevels', () => {
    it('应该返回所有已解锁的关卡', () => {
      const state = createInitialGameState();
      const unlocked = getUnlockedLevels(state);
      
      expect(unlocked).toEqual(['1-1']);
    });
    
    it('应该包含所有非锁定状态的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-2', { status: LevelStatus.UNLOCKED });
      state = updateLevelProgress(state, '2-1', { status: LevelStatus.IN_PROGRESS });
      state = updateLevelProgress(state, '2-2', { status: LevelStatus.COMPLETED });
      
      const unlocked = getUnlockedLevels(state);
      
      expect(unlocked).toContain('1-1');
      expect(unlocked).toContain('1-2');
      expect(unlocked).toContain('2-1');
      expect(unlocked).toContain('2-2');
      expect(unlocked.length).toBe(4);
    });
    
    it('应该返回排序后的关卡列表', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '2-1', { status: LevelStatus.UNLOCKED });
      state = updateLevelProgress(state, '1-2', { status: LevelStatus.UNLOCKED });
      
      const unlocked = getUnlockedLevels(state);
      
      expect(unlocked).toEqual(['1-1', '1-2', '2-1']);
    });
  });
  
  describe('getCompletedLevels', () => {
    it('应该返回空数组对于初始状态', () => {
      const state = createInitialGameState();
      const completed = getCompletedLevels(state);
      
      expect(completed).toEqual([]);
    });
    
    it('应该返回所有已完成的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', { status: LevelStatus.COMPLETED });
      state = updateLevelProgress(state, '1-2', { status: LevelStatus.COMPLETED });
      state = updateLevelProgress(state, '2-1', { status: LevelStatus.IN_PROGRESS });
      
      const completed = getCompletedLevels(state);
      
      expect(completed).toEqual(['1-1', '1-2']);
    });
  });
  
  describe('isLevelUnlocked', () => {
    it('应该返回true对于已解锁的关卡', () => {
      const state = createInitialGameState();
      
      expect(isLevelUnlocked(state, '1-1')).toBe(true);
    });
    
    it('应该返回false对于锁定的关卡', () => {
      const state = createInitialGameState();
      
      expect(isLevelUnlocked(state, '1-2')).toBe(false);
    });
    
    it('应该返回true对于进行中的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-2', { status: LevelStatus.IN_PROGRESS });
      
      expect(isLevelUnlocked(state, '1-2')).toBe(true);
    });
    
    it('应该返回true对于已完成的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', { status: LevelStatus.COMPLETED });
      
      expect(isLevelUnlocked(state, '1-1')).toBe(true);
    });
    
    it('应该返回false对于不存在的关卡', () => {
      const state = createInitialGameState();
      
      expect(isLevelUnlocked(state, '99-99')).toBe(false);
    });
  });
  
  describe('isLevelCompleted', () => {
    it('应该返回false对于未完成的关卡', () => {
      const state = createInitialGameState();
      
      expect(isLevelCompleted(state, '1-1')).toBe(false);
    });
    
    it('应该返回true对于已完成的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', { status: LevelStatus.COMPLETED });
      
      expect(isLevelCompleted(state, '1-1')).toBe(true);
    });
    
    it('应该返回false对于不存在的关卡', () => {
      const state = createInitialGameState();
      
      expect(isLevelCompleted(state, '99-99')).toBe(false);
    });
  });
});
