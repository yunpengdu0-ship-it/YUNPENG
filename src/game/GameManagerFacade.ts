/**
 * GameManager 门面类
 * 
 * 为 GameContext 提供简化的接口，管理游戏状态
 */

import { GameManager } from './GameManager';
import { GameState, createInitialGameState } from './GameState';
import { ExerciseRepository } from '../data/ExerciseRepository';
import { RuleEngine } from '../validation/RuleEngine';
import { LocalStorageManager } from '../storage/LocalStorageManager';
import { Exercise } from '../types/exercise';
import { ChordProgression } from '../types/music';
import { ValidationResult } from '../validation/types';
import { basicRules } from '../validation/rules';

/**
 * GameManager 门面类
 * 
 * 封装 GameManager 并管理游戏状态
 */
export class GameManagerFacade {
  private gameManager: GameManager;
  private exerciseRepository: ExerciseRepository;
  private storageManager: LocalStorageManager;
  private state: GameState;
  private currentExercise: Exercise | null = null;
  private exercisesLoaded: boolean = false;

  constructor() {
    // 初始化练习题仓库
    this.exerciseRepository = new ExerciseRepository();

    // 初始化规则引擎
    const ruleEngine = new RuleEngine();
    ruleEngine.registerRules(basicRules);

    // 初始化游戏管理器
    this.gameManager = new GameManager({
      exerciseRepository: this.exerciseRepository,
      ruleEngine,
    });

    // 初始化存储管理器
    this.storageManager = new LocalStorageManager();

    // 初始化状态
    this.state = createInitialGameState();
  }

  /**
   * 加载练习题数据
   */
  private async loadExercises(): Promise<void> {
    if (this.exercisesLoaded) {
      return;
    }

    try {
      console.log('开始加载练习题数据...');
      const response = await fetch('/data/exercises.json');
      if (!response.ok) {
        throw new Error(`Failed to load exercises: ${response.statusText}`);
      }
      const exercisesData = await response.json();
      console.log('练习题数据加载成功:', exercisesData);
      this.exerciseRepository.loadFromData(exercisesData);
      console.log('练习题仓库加载完成，练习题数量:', this.exerciseRepository.getExerciseCount());
      this.exercisesLoaded = true;
    } catch (error) {
      console.error('Error loading exercises:', error);
      throw new Error('无法加载练习题数据');
    }
  }

  /**
   * 加载进度
   */
  async loadProgress(): Promise<void> {
    // 先加载练习题数据
    await this.loadExercises();
    
    const result = this.storageManager.load();
    if (result.success && result.state) {
      this.state = result.state;
    }
  }

  /**
   * 保存进度
   */
  saveProgress(): void {
    this.storageManager.save(this.state);
  }

  /**
   * 获取当前状态
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * 获取当前练习题
   */
  getCurrentExercise(): Exercise | null {
    return this.currentExercise;
  }

  /**
   * 开始关卡
   */
  async startLevel(level: number): Promise<void> {
    console.log('startLevel 被调用，level:', level);
    
    // 确保练习题已加载
    await this.loadExercises();
    
    const levelId = `${Math.ceil(level / 2)}-${level % 2 === 0 ? 2 : 1}`;
    console.log('计算的 levelId:', levelId);
    
    const result = this.gameManager.startLevel(this.state, levelId);
    console.log('GameManager.startLevel 结果:', result);
    
    if (!result.success) {
      throw new Error(result.error || '开始关卡失败');
    }

    this.state = result.state;
    this.currentExercise = result.exercise || null;
    console.log('当前练习题:', this.currentExercise);
    
    // 自动保存
    this.saveProgress();
  }

  /**
   * 提交和弦进行
   */
  async submitProgression(progression: ChordProgression): Promise<ValidationResult> {
    if (!this.state.currentLevelId) {
      throw new Error('没有正在进行的关卡');
    }

    const result = this.gameManager.submitExercise(
      this.state,
      this.state.currentLevelId,
      progression
    );

    this.state = result.state;
    
    // 自动保存
    this.saveProgress();

    return result.validation;
  }

  /**
   * 完成当前练习题
   */
  completeExercise(): void {
    this.currentExercise = null;
    this.state.currentLevelId = null;
    
    // 自动保存
    this.saveProgress();
  }
}
