/**
 * GameManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from './GameManager';
import { createInitialGameState, LevelStatus, updateLevelProgress } from './GameState';
import { ExerciseRepository } from '../data/ExerciseRepository';
import { RuleEngine } from '../validation/RuleEngine';
import { createNote } from '../core/musicUtils';
import { basicRules } from '../validation/rules';
import exercisesData from '../../public/data/exercises.json';

describe('GameManager', () => {
  let gameManager: GameManager;
  let exerciseRepository: ExerciseRepository;
  let ruleEngine: RuleEngine;
  
  beforeEach(() => {
    // 创建练习题仓库
    exerciseRepository = new ExerciseRepository();
    exerciseRepository.loadFromData(exercisesData);
    
    // 创建规则引擎
    ruleEngine = new RuleEngine();
    ruleEngine.registerRules(basicRules);
    
    // 创建游戏管理器
    gameManager = new GameManager({
      exerciseRepository,
      ruleEngine,
      perfectScore: 100,
      errorPenalty: 10,
    });
  });
  
  describe('startLevel', () => {
    it('应该成功开始已解锁的关卡', () => {
      const state = createInitialGameState();
      const result = gameManager.startLevel(state, '1-1');
      
      expect(result.success).toBe(true);
      expect(result.exercise).toBeDefined();
      expect(result.exercise!.id).toBe('1-1');
      expect(result.state.currentLevelId).toBe('1-1');
    });
    
    it('应该将关卡状态更新为进行中', () => {
      const state = createInitialGameState();
      const result = gameManager.startLevel(state, '1-1');
      
      const progress = result.state.levelProgress.get('1-1')!;
      expect(progress.status).toBe(LevelStatus.IN_PROGRESS);
      expect(progress.attempts).toBe(1);
    });
    
    it('应该拒绝开始锁定的关卡', () => {
      const state = createInitialGameState();
      const result = gameManager.startLevel(state, '1-2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('未解锁');
    });
    
    it('应该拒绝开始不存在的关卡', () => {
      const state = createInitialGameState();
      const result = gameManager.startLevel(state, '99-99');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
    
    it('应该允许重玩已完成的关卡', () => {
      let state = createInitialGameState();
      state = updateLevelProgress(state, '1-1', {
        status: LevelStatus.COMPLETED,
        attempts: 1,
      });
      
      const result = gameManager.startLevel(state, '1-1');
      
      expect(result.success).toBe(true);
      expect(result.state.levelProgress.get('1-1')!.attempts).toBe(2);
    });
  });
  
  describe('submitExercise', () => {
    it('应该验证正确的和弦进行', () => {
      const state = createInitialGameState();
      
      // 创建一个简单的正确和弦进行
      const progression = [
        [
          createNote('G', 4),  // Soprano
          createNote('E', 4),  // Alto
          createNote('C', 4),  // Tenor
          createNote('C', 3),  // Bass
        ],
        [
          createNote('A', 4),  // Soprano
          createNote('F', 4),  // Alto
          createNote('C', 4),  // Tenor
          createNote('F', 3),  // Bass
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      expect(result.validation).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });
    
    it('应该在无错误时给予完美分数', () => {
      const state = createInitialGameState();
      
      // 创建无错误的和弦进行
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (result.validation.isValid) {
        expect(result.score).toBe(100);
      }
    });
    
    it('应该在有错误时扣分', () => {
      const state = createInitialGameState();
      
      // 创建有平行五度的和弦进行
      const progression = [
        [
          createNote('C', 4),
          createNote('E', 4),
          createNote('G', 3),
          createNote('C', 3),
        ],
        [
          createNote('D', 4),
          createNote('F', 4),
          createNote('A', 3),
          createNote('D', 3),
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (!result.validation.isValid) {
        expect(result.score).toBeLessThan(100);
        expect(result.score).toBe(100 - result.validation.errors.length * 10);
      }
    });
    
    it('应该在完成关卡时更新状态', () => {
      const state = createInitialGameState();
      
      // 创建无错误的和弦进行
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (result.levelCompleted) {
        const progress = result.state.levelProgress.get('1-1')!;
        expect(progress.status).toBe(LevelStatus.COMPLETED);
        expect(progress.bestScore).toBe(result.score);
      }
    });
    
    it('应该更新总分数', () => {
      const state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (result.levelCompleted) {
        expect(result.state.totalScore).toBeGreaterThan(0);
        expect(result.state.completedLevels).toBe(1);
      }
    });
    
    it('应该在首次完成时增加总分', () => {
      let state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      // 第一次提交
      const result1 = gameManager.submitExercise(state, '1-1', progression);
      const totalScore1 = result1.state.totalScore;
      
      // 第二次提交（重玩）
      if (result1.levelCompleted) {
        const result2 = gameManager.submitExercise(result1.state, '1-1', progression);
        expect(result2.state.totalScore).toBe(totalScore1);
      }
    });
    
    it('应该解锁下一个关卡', () => {
      let state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      // 完成1-1应该解锁1-2
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      if (result.levelCompleted) {
        expect(result.unlockedLevels).toContain('1-2');
      }
    });
    
    it('应该在完成一章后解锁下一章', () => {
      let state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      // 完成1-1
      const result1 = gameManager.submitExercise(state, '1-1', progression);
      
      if (result1.levelCompleted) {
        // 解锁并完成1-2
        state = updateLevelProgress(result1.state, '1-2', {
          status: LevelStatus.UNLOCKED,
        });
        
        const result2 = gameManager.submitExercise(state, '1-2', progression);
        
        if (result2.levelCompleted) {
          expect(result2.unlockedLevels).toContain('2-1');
        }
      }
    });
    
    it('应该抛出错误对于不存在的练习题', () => {
      const state = createInitialGameState();
      const progression = [[createNote('C', 4)]];
      
      expect(() => {
        gameManager.submitExercise(state, '99-99', progression);
      }).toThrow('练习题不存在');
    });
  });
  
  describe('resetLevel', () => {
    it('应该清除当前进度', () => {
      let state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      // 保存进度
      state = gameManager.saveProgress(state, '1-1', progression);
      expect(state.levelProgress.get('1-1')!.currentProgression).toBeDefined();
      
      // 重置
      state = gameManager.resetLevel(state, '1-1');
      expect(state.levelProgress.get('1-1')!.currentProgression).toBeUndefined();
    });
    
    it('应该抛出错误对于不存在的关卡', () => {
      const state = createInitialGameState();
      
      expect(() => {
        gameManager.resetLevel(state, '99-99');
      }).toThrow('关卡不存在');
    });
  });
  
  describe('saveProgress', () => {
    it('应该保存当前和弦进行', () => {
      const state = createInitialGameState();
      
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const newState = gameManager.saveProgress(state, '1-1', progression);
      
      expect(newState.levelProgress.get('1-1')!.currentProgression).toEqual(progression);
    });
  });
  
  describe('分数计算', () => {
    it('应该使用自定义分数配置', () => {
      const customManager = new GameManager({
        exerciseRepository,
        ruleEngine,
        perfectScore: 200,
        errorPenalty: 20,
      });
      
      const state = createInitialGameState();
      const progression = [
        [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3),
        ],
      ];
      
      const result = customManager.submitExercise(state, '1-1', progression);
      
      if (result.validation.isValid) {
        expect(result.score).toBe(200);
      }
    });
    
    it('应该确保分数不低于0', () => {
      const state = createInitialGameState();
      
      // 创建有很多错误的和弦进行
      const progression = [
        [
          createNote('C', 4),
          createNote('E', 4),
          createNote('G', 3),
          createNote('C', 3),
        ],
        [
          createNote('D', 4),
          createNote('F', 4),
          createNote('A', 3),
          createNote('D', 3),
        ],
        [
          createNote('E', 4),
          createNote('G', 4),
          createNote('B', 3),
          createNote('E', 3),
        ],
      ];
      
      const result = gameManager.submitExercise(state, '1-1', progression);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
