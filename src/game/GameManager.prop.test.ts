/**
 * GameManager 属性测试
 * 
 * 验证以下正确性属性：
 * - 属性2: 分数单调递增
 * - 属性3: 错误不扣分（总分不减少）
 * - 属性4: 关卡解锁顺序性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameManager } from './GameManager';
import { createInitialGameState, LevelStatus, updateLevelProgress, GameState } from './GameState';
import { ExerciseRepository } from '../data/ExerciseRepository';
import { RuleEngine } from '../validation/RuleEngine';
import { createNote, createChord } from '../core/musicUtils';
import { basicRules } from '../validation/rules';
import { ChordProgression, Note } from '../types/music';
import exercisesData from '../../public/data/exercises.json';

describe('GameManager 属性测试', () => {
  let gameManager: GameManager;
  let exerciseRepository: ExerciseRepository;
  let ruleEngine: RuleEngine;
  
  beforeEach(() => {
    exerciseRepository = new ExerciseRepository();
    exerciseRepository.loadFromData(exercisesData);
    
    ruleEngine = new RuleEngine();
    ruleEngine.registerRules(basicRules);
    
    gameManager = new GameManager({
      exerciseRepository,
      ruleEngine,
      perfectScore: 100,
      errorPenalty: 10,
    });
  });
  
  // 辅助函数：生成随机音符
  const arbitraryNote = (): fc.Arbitrary<Note> => {
    return fc.record({
      pitch: fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B'),
      octave: fc.integer({ min: 2, max: 5 }),
      duration: fc.constant('w' as const),
    });
  };
  
  // 辅助函数：生成随机和弦
  const arbitraryChord = () => {
    return fc.tuple(
      arbitraryNote(),
      arbitraryNote(),
      arbitraryNote(),
      arbitraryNote()
    );
  };
  
  // 辅助函数：生成随机和弦进行
  const arbitraryProgression = (): fc.Arbitrary<ChordProgression> => {
    return fc.array(arbitraryChord(), { minLength: 1, maxLength: 5 });
  };
  
  describe('属性2: 分数单调递增', () => {
    it('完成关卡后总分数应该增加或保持不变', () => {
      fc.assert(
        fc.property(arbitraryProgression(), (progression) => {
          const state = createInitialGameState();
          const initialScore = state.totalScore;
          
          const result = gameManager.submitExercise(state, '1-1', progression);
          const finalScore = result.state.totalScore;
          
          // 总分数应该 >= 初始分数
          expect(finalScore).toBeGreaterThanOrEqual(initialScore);
          
          // 如果完成关卡，总分数应该增加
          if (result.levelCompleted) {
            expect(finalScore).toBeGreaterThan(initialScore);
          }
        }),
        { numRuns: 100 }
      );
    });
    
    it('重复完成同一关卡不应增加总分', () => {
      fc.assert(
        fc.property(arbitraryProgression(), (progression) => {
          let state = createInitialGameState();
          
          // 第一次完成
          const result1 = gameManager.submitExercise(state, '1-1', progression);
          
          if (result1.levelCompleted) {
            const scoreAfterFirst = result1.state.totalScore;
            
            // 第二次完成
            const result2 = gameManager.submitExercise(result1.state, '1-1', progression);
            const scoreAfterSecond = result2.state.totalScore;
            
            // 总分应该保持不变
            expect(scoreAfterSecond).toBe(scoreAfterFirst);
          }
        }),
        { numRuns: 100 }
      );
    });
    
    it('完成多个不同关卡应累积分数', () => {
      // 创建一个简单的正确和弦进行
      const progression: ChordProgression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      let state = createInitialGameState();
      let totalScore = 0;
      
      // 完成1-1
      const result1 = gameManager.submitExercise(state, '1-1', progression);
      if (result1.levelCompleted) {
        totalScore += result1.score;
        expect(result1.state.totalScore).toBe(totalScore);
        
        // 解锁并完成1-2
        state = updateLevelProgress(result1.state, '1-2', {
          status: LevelStatus.UNLOCKED,
        });
        
        const result2 = gameManager.submitExercise(state, '1-2', progression);
        if (result2.levelCompleted) {
          totalScore += result2.score;
          expect(result2.state.totalScore).toBe(totalScore);
        }
      }
    });
  });
  
  describe('属性3: 错误不扣分（总分不减少）', () => {
    it('提交错误答案不应减少总分', () => {
      fc.assert(
        fc.property(arbitraryProgression(), (progression) => {
          const state = createInitialGameState();
          const initialTotalScore = state.totalScore;
          
          const result = gameManager.submitExercise(state, '1-1', progression);
          const finalTotalScore = result.state.totalScore;
          
          // 总分数不应减少
          expect(finalTotalScore).toBeGreaterThanOrEqual(initialTotalScore);
        }),
        { numRuns: 100 }
      );
    });
    
    it('多次提交错误答案不应减少总分', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryProgression(), { minLength: 1, maxLength: 5 }),
          (progressions) => {
            let state = createInitialGameState();
            let minTotalScore = state.totalScore;
            
            for (const progression of progressions) {
              const result = gameManager.submitExercise(state, '1-1', progression);
              state = result.state;
              
              // 总分数应该 >= 之前的最小值
              expect(state.totalScore).toBeGreaterThanOrEqual(minTotalScore);
              minTotalScore = Math.min(minTotalScore, state.totalScore);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('关卡分数可以减少但总分不应减少', () => {
      fc.assert(
        fc.property(
          arbitraryProgression(),
          arbitraryProgression(),
          (progression1, progression2) => {
            let state = createInitialGameState();
            
            // 第一次提交
            const result1 = gameManager.submitExercise(state, '1-1', progression1);
            
            if (result1.levelCompleted) {
              const totalScoreAfterFirst = result1.state.totalScore;
              
              // 第二次提交（可能得分更低）
              const result2 = gameManager.submitExercise(result1.state, '1-1', progression2);
              const totalScoreAfterSecond = result2.state.totalScore;
              
              // 总分不应减少
              expect(totalScoreAfterSecond).toBeGreaterThanOrEqual(totalScoreAfterFirst);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('属性4: 关卡解锁顺序性', () => {
    it('完成X-1应该解锁X-2', () => {
      const progression: ChordProgression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const state = createInitialGameState();
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (result.levelCompleted) {
        const progress1_2 = result.state.levelProgress.get('1-2')!;
        expect(progress1_2.status).not.toBe(LevelStatus.LOCKED);
      }
    });
    
    it('完成X-2应该解锁(X+1)-1', () => {
      const progression: ChordProgression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      let state = createInitialGameState();
      
      // 完成1-1
      const result1 = gameManager.submitExercise(state, '1-1', progression);
      
      if (result1.levelCompleted) {
        // 解锁并完成1-2
        state = updateLevelProgress(result1.state, '1-2', {
          status: LevelStatus.UNLOCKED,
        });
        
        const result2 = gameManager.submitExercise(state, '1-2', progression);
        
        if (result2.levelCompleted) {
          const progress2_1 = result2.state.levelProgress.get('2-1')!;
          expect(progress2_1.status).not.toBe(LevelStatus.LOCKED);
        }
      }
    });
    
    it('未完成关卡不应解锁新关卡', () => {
      fc.assert(
        fc.property(arbitraryProgression(), (progression) => {
          const state = createInitialGameState();
          const result = gameManager.submitExercise(state, '1-1', progression);
          
          if (!result.levelCompleted) {
            // 1-2应该仍然锁定
            const progress1_2 = result.state.levelProgress.get('1-2')!;
            expect(progress1_2.status).toBe(LevelStatus.LOCKED);
          }
        }),
        { numRuns: 100 }
      );
    });
    
    it('关卡解锁应该是顺序的', () => {
      const progression: ChordProgression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      let state = createInitialGameState();
      
      // 完成1-1
      const result1 = gameManager.submitExercise(state, '1-1', progression);
      
      if (result1.levelCompleted) {
        // 2-1应该仍然锁定（因为1-2未完成）
        expect(result1.state.levelProgress.get('2-1')!.status).toBe(LevelStatus.LOCKED);
        
        // 1-2应该解锁
        expect(result1.state.levelProgress.get('1-2')!.status).not.toBe(LevelStatus.LOCKED);
      }
    });
    
    it('不能跳过关卡解锁', () => {
      const state = createInitialGameState();
      
      // 尝试开始锁定的关卡
      const result = gameManager.startLevel(state, '2-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('未解锁');
    });
  });
  
  describe('额外属性: 状态不变性', () => {
    it('提交练习不应修改原始状态', () => {
      fc.assert(
        fc.property(arbitraryProgression(), (progression) => {
          const state = createInitialGameState();
          const originalTotalScore = state.totalScore;
          const originalCompleted = state.completedLevels;
          
          gameManager.submitExercise(state, '1-1', progression);
          
          // 原始状态不应改变
          expect(state.totalScore).toBe(originalTotalScore);
          expect(state.completedLevels).toBe(originalCompleted);
        }),
        { numRuns: 100 }
      );
    });
    
    it('开始关卡不应修改原始状态', () => {
      const state = createInitialGameState();
      const originalCurrentLevel = state.currentLevelId;
      
      gameManager.startLevel(state, '1-1');
      
      // 原始状态不应改变
      expect(state.currentLevelId).toBe(originalCurrentLevel);
    });
  });
  
  describe('额外属性: 尝试次数单调递增', () => {
    it('每次开始关卡应增加尝试次数', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (numAttempts) => {
          let state = createInitialGameState();
          
          for (let i = 0; i < numAttempts; i++) {
            const result = gameManager.startLevel(state, '1-1');
            state = result.state;
            
            const progress = state.levelProgress.get('1-1')!;
            expect(progress.attempts).toBe(i + 1);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
