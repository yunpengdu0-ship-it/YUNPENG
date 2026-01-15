/**
 * LocalStorageManager 属性测试
 * 
 * 验证以下正确性属性：
 * - 属性5: 进度持久化往返一致性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { LocalStorageManager } from './LocalStorageManager';
import {
  createInitialGameState,
  updateLevelProgress,
  LevelStatus,
  GameState,
} from '../game/GameState';

describe('LocalStorageManager 属性测试', () => {
  let storageManager: LocalStorageManager;
  const testKey = 'test-prop-harmony-game-state';
  
  beforeEach(() => {
    localStorage.clear();
    storageManager = new LocalStorageManager(testKey);
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  // 辅助函数：生成随机关卡ID
  const arbitraryLevelId = (): fc.Arbitrary<string> => {
    return fc.record({
      chapter: fc.integer({ min: 1, max: 30 }),
      number: fc.integer({ min: 1, max: 2 }),
    }).map(({ chapter, number }) => `${chapter}-${number}`);
  };
  
  // 辅助函数：生成随机关卡状态
  const arbitraryLevelStatus = (): fc.Arbitrary<LevelStatus> => {
    return fc.constantFrom(
      LevelStatus.LOCKED,
      LevelStatus.UNLOCKED,
      LevelStatus.IN_PROGRESS,
      LevelStatus.COMPLETED
    );
  };
  
  // 辅助函数：生成随机分数
  const arbitraryScore = (): fc.Arbitrary<number> => {
    return fc.integer({ min: 0, max: 100 });
  };
  
  // 辅助函数：生成随机尝试次数
  const arbitraryAttempts = (): fc.Arbitrary<number> => {
    return fc.integer({ min: 0, max: 10 });
  };
  
  describe('属性5: 进度持久化往返一致性', () => {
    it('保存然后加载应该得到相同的状态', () => {
      fc.assert(
        fc.property(
          fc.record({
            totalScore: fc.integer({ min: 0, max: 10000 }),
            completedLevels: fc.integer({ min: 0, max: 60 }),
          }),
          ({ totalScore, completedLevels }) => {
            let state = createInitialGameState();
            state.totalScore = totalScore;
            state.completedLevels = completedLevels;
            
            // 保存
            const saveResult = storageManager.save(state);
            expect(saveResult.success).toBe(true);
            
            // 加载
            const loadResult = storageManager.load();
            expect(loadResult.success).toBe(true);
            
            const loadedState = loadResult.state!;
            
            // 验证往返一致性
            expect(loadedState.totalScore).toBe(state.totalScore);
            expect(loadedState.completedLevels).toBe(state.completedLevels);
            expect(loadedState.startTime).toBe(state.startTime);
            expect(loadedState.levelProgress.size).toBe(state.levelProgress.size);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('关卡进度的往返一致性', () => {
      fc.assert(
        fc.property(
          arbitraryLevelId(),
          arbitraryLevelStatus(),
          arbitraryScore(),
          arbitraryScore(),
          arbitraryAttempts(),
          (levelId, status, score, bestScore, attempts) => {
            let state = createInitialGameState();
            
            // 更新关卡进度
            state = updateLevelProgress(state, levelId, {
              status,
              score,
              bestScore: Math.max(score, bestScore),
              attempts,
            });
            
            // 保存
            storageManager.save(state);
            
            // 加载
            const result = storageManager.load();
            const loadedState = result.state!;
            
            // 验证关卡进度
            const originalProgress = state.levelProgress.get(levelId)!;
            const loadedProgress = loadedState.levelProgress.get(levelId)!;
            
            expect(loadedProgress.status).toBe(originalProgress.status);
            expect(loadedProgress.score).toBe(originalProgress.score);
            expect(loadedProgress.bestScore).toBe(originalProgress.bestScore);
            expect(loadedProgress.attempts).toBe(originalProgress.attempts);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('多个关卡进度的往返一致性', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              levelId: arbitraryLevelId(),
              status: arbitraryLevelStatus(),
              score: arbitraryScore(),
              attempts: arbitraryAttempts(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (updates) => {
            let state = createInitialGameState();
            
            // 应用所有更新
            for (const update of updates) {
              state = updateLevelProgress(state, update.levelId, {
                status: update.status,
                score: update.score,
                bestScore: update.score,
                attempts: update.attempts,
              });
            }
            
            // 保存
            storageManager.save(state);
            
            // 加载
            const result = storageManager.load();
            const loadedState = result.state!;
            
            // 验证所有更新的关卡
            for (const update of updates) {
              const originalProgress = state.levelProgress.get(update.levelId)!;
              const loadedProgress = loadedState.levelProgress.get(update.levelId)!;
              
              expect(loadedProgress.status).toBe(originalProgress.status);
              expect(loadedProgress.score).toBe(originalProgress.score);
              expect(loadedProgress.attempts).toBe(originalProgress.attempts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('多次保存和加载的一致性', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              levelId: arbitraryLevelId(),
              score: arbitraryScore(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (updates) => {
            let state = createInitialGameState();
            
            for (const update of updates) {
              // 更新状态
              state = updateLevelProgress(state, update.levelId, {
                score: update.score,
                bestScore: update.score,
              });
              
              // 保存
              storageManager.save(state);
              
              // 加载
              const result = storageManager.load();
              state = result.state!;
              
              // 验证当前更新
              const progress = state.levelProgress.get(update.levelId)!;
              expect(progress.score).toBe(update.score);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('currentLevelId 的往返一致性', () => {
      fc.assert(
        fc.property(
          fc.option(arbitraryLevelId(), { nil: null }),
          (currentLevelId) => {
            let state = createInitialGameState();
            state.currentLevelId = currentLevelId;
            
            // 保存
            storageManager.save(state);
            
            // 加载
            const result = storageManager.load();
            const loadedState = result.state!;
            
            // 验证
            expect(loadedState.currentLevelId).toBe(state.currentLevelId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('额外属性: 保存不修改原始状态', () => {
    it('保存操作不应修改原始状态', () => {
      fc.assert(
        fc.property(
          arbitraryLevelId(),
          arbitraryScore(),
          (levelId, score) => {
            let state = createInitialGameState();
            state = updateLevelProgress(state, levelId, { score });
            
            const originalTotalScore = state.totalScore;
            const originalProgress = state.levelProgress.get(levelId)!;
            const originalScore = originalProgress.score;
            
            // 保存
            storageManager.save(state);
            
            // 验证原始状态未被修改
            expect(state.totalScore).toBe(originalTotalScore);
            expect(state.levelProgress.get(levelId)!.score).toBe(originalScore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('额外属性: 加载不影响后续保存', () => {
    it('加载后的状态可以正常保存', () => {
      fc.assert(
        fc.property(
          arbitraryLevelId(),
          arbitraryScore(),
          arbitraryScore(),
          (levelId, score1, score2) => {
            // 第一次保存
            let state = createInitialGameState();
            state = updateLevelProgress(state, levelId, { score: score1 });
            storageManager.save(state);
            
            // 加载
            const result = storageManager.load();
            let loadedState = result.state!;
            
            // 修改加载的状态
            loadedState = updateLevelProgress(loadedState, levelId, { score: score2 });
            
            // 再次保存
            const saveResult = storageManager.save(loadedState);
            expect(saveResult.success).toBe(true);
            
            // 再次加载验证
            const result2 = storageManager.load();
            const finalState = result2.state!;
            
            expect(finalState.levelProgress.get(levelId)!.score).toBe(score2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('额外属性: 清除后无法加载', () => {
    it('清除后加载应该失败', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (totalScore) => {
            let state = createInitialGameState();
            state.totalScore = totalScore;
            
            // 保存
            storageManager.save(state);
            
            // 验证可以加载
            let result = storageManager.load();
            expect(result.success).toBe(true);
            
            // 清除
            storageManager.clear();
            
            // 验证无法加载
            result = storageManager.load();
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('额外属性: hasData 的一致性', () => {
    it('hasData 应该与实际数据状态一致', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (shouldSave) => {
            // 清除数据
            storageManager.clear();
            
            if (shouldSave) {
              // 保存数据
              const state = createInitialGameState();
              storageManager.save(state);
              
              // 应该有数据
              expect(storageManager.hasData()).toBe(true);
            } else {
              // 不保存数据
              // 应该没有数据
              expect(storageManager.hasData()).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
