/**
 * 练习题仓库
 * 
 * 负责加载、管理和提供练习题数据
 */

import {
  Exercise,
  ChapterData,
  ExerciseDataFile,
  validateExercise,
  validateChapter,
  parseExerciseId,
} from '../types/exercise';

/**
 * 练习题仓库类
 * 
 * 管理所有练习题数据，提供按章节和ID查询的功能
 */
export class ExerciseRepository {
  /** 所有章节的数据，按章节号索引 */
  private chapters: Map<number, ChapterData>;
  
  /** 所有练习题，按ID索引 */
  private exercises: Map<string, Exercise>;
  
  /** 数据是否已加载 */
  private loaded: boolean;
  
  constructor() {
    this.chapters = new Map();
    this.exercises = new Map();
    this.loaded = false;
  }
  
  /**
   * 从JSON数据加载练习题
   * 
   * @param data 练习题数据文件
   * @throws 如果数据验证失败
   */
  loadFromData(data: ExerciseDataFile): void {
    // 清空现有数据
    this.chapters.clear();
    this.exercises.clear();
    
    // 验证并加载每个章节
    for (const chapterData of data.chapters) {
      // 验证章节数据
      const validation = validateChapter(chapterData);
      if (!validation.isValid) {
        throw new Error(
          `章节${chapterData.chapter}数据无效:\n${validation.errors.join('\n')}`
        );
      }
      
      // 存储章节数据
      this.chapters.set(chapterData.chapter, chapterData);
      
      // 存储每个练习题
      for (const exercise of chapterData.exercises) {
        this.exercises.set(exercise.id, exercise);
      }
    }
    
    this.loaded = true;
  }
  
  /**
   * 从JSON文件加载练习题
   * 
   * @param filePath 文件路径
   * @returns Promise，加载完成后resolve
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      // 在浏览器环境中使用fetch
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`无法加载文件: ${filePath}`);
      }
      
      const data: ExerciseDataFile = await response.json();
      this.loadFromData(data);
    } catch (error) {
      throw new Error(`加载练习题数据失败: ${error}`);
    }
  }
  
  /**
   * 获取指定章节的所有练习题
   * 
   * @param chapter 章节号（1-60）
   * @returns 该章节的练习题数组，如果章节不存在则返回空数组
   */
  getExercisesForChapter(chapter: number): Exercise[] {
    const chapterData = this.chapters.get(chapter);
    if (!chapterData) {
      return [];
    }
    
    return [...chapterData.exercises];
  }
  
  /**
   * 获取单个练习题
   * 
   * @param chapter 章节号
   * @param exerciseNumber 练习题编号（1或2）
   * @returns 练习题对象，如果不存在则返回undefined
   */
  getExercise(chapter: number, exerciseNumber: number): Exercise | undefined {
    const id = `${chapter}-${exerciseNumber}`;
    return this.exercises.get(id);
  }
  
  /**
   * 通过ID获取练习题
   * 
   * @param id 练习题ID，格式："{chapter}-{number}"
   * @returns 练习题对象，如果不存在则返回undefined
   */
  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.get(id);
  }
  
  /**
   * 获取章节数据
   * 
   * @param chapter 章节号
   * @returns 章节数据，如果不存在则返回undefined
   */
  getChapter(chapter: number): ChapterData | undefined {
    return this.chapters.get(chapter);
  }
  
  /**
   * 获取所有章节
   * 
   * @returns 所有章节数据的数组，按章节号排序
   */
  getAllChapters(): ChapterData[] {
    return Array.from(this.chapters.values()).sort((a, b) => a.chapter - b.chapter);
  }
  
  /**
   * 获取所有练习题
   * 
   * @returns 所有练习题的数组
   */
  getAllExercises(): Exercise[] {
    return Array.from(this.exercises.values());
  }
  
  /**
   * 检查章节是否存在
   * 
   * @param chapter 章节号
   * @returns 是否存在
   */
  hasChapter(chapter: number): boolean {
    return this.chapters.has(chapter);
  }
  
  /**
   * 检查练习题是否存在
   * 
   * @param id 练习题ID
   * @returns 是否存在
   */
  hasExercise(id: string): boolean {
    return this.exercises.has(id);
  }
  
  /**
   * 获取已加载的章节数量
   * 
   * @returns 章节数量
   */
  getChapterCount(): number {
    return this.chapters.size;
  }
  
  /**
   * 获取已加载的练习题数量
   * 
   * @returns 练习题数量
   */
  getExerciseCount(): number {
    return this.exercises.size;
  }
  
  /**
   * 检查数据是否已加载
   * 
   * @returns 是否已加载
   */
  isLoaded(): boolean {
    return this.loaded;
  }
  
  /**
   * 清空所有数据
   */
  clear(): void {
    this.chapters.clear();
    this.exercises.clear();
    this.loaded = false;
  }
  
  /**
   * 验证所有已加载的数据
   * 
   * @returns 验证结果，包含所有错误和警告
   */
  validateAll(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    for (const chapter of this.chapters.values()) {
      const result = validateChapter(chapter);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
