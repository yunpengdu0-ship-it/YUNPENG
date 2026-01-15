import React, { useState, useEffect } from 'react';
import { Exercise } from '../types/exercise';
import { ChordProgression, Chord } from '../types/music';
import { StaffNotation } from './StaffNotation';
import { ErrorDisplay } from './ErrorDisplay';
import { ChordEditor } from './ChordEditor';
import { ValidationError } from '../validation/types';
import { validateConstraints, ConstraintViolation } from '../utils/constraintValidator';
import './ExerciseView.css';

/**
 * 练习题视图组件属性
 */
export interface ExerciseViewProps {
  /** 当前练习题 */
  exercise: Exercise;
  
  /** 提交和弦进行的回调 */
  onSubmit: (progression: ChordProgression) => void;
  
  /** 显示答案的回调 */
  onShowSolution?: () => void;
  
  /** 跳过练习题的回调 */
  onSkip?: () => void;
  
  /** 验证错误（如果有） */
  validationErrors?: ValidationError[];
  
  /** 是否显示参考答案 */
  showSolution?: boolean;
  
  /** 是否已完成 */
  isCompleted?: boolean;
}

/**
 * 练习题视图组件
 * 
 * 显示练习题说明、起始和弦、五线谱渲染和音符输入
 * 集成和弦编辑器和提交功能
 */
export const ExerciseView: React.FC<ExerciseViewProps> = ({
  exercise,
  onSubmit,
  onShowSolution,
  onSkip,
  validationErrors = [],
  showSolution = false,
  isCompleted = false
}) => {
  // 初始化和弦进行：从起始和弦开始
  const [progression, setProgression] = useState<ChordProgression>({
    chords: [...exercise.startingChords],
    key: exercise.key
  });
  
  // 当前正在编辑的和弦索引
  const [editingChordIndex, setEditingChordIndex] = useState<number>(
    exercise.startingChords.length
  );

  // 约束违规信息
  const [constraintViolations, setConstraintViolations] = useState<ConstraintViolation[]>([]);

  // 验证约束
  useEffect(() => {
    const result = validateConstraints(progression, exercise.constraints);
    setConstraintViolations(result.violations);
  }, [progression, exercise.constraints]);

  /**
   * 添加新和弦
   */
  const handleAddChord = () => {
    if (progression.chords.length >= exercise.expectedLength) {
      return;
    }

    // 创建一个默认和弦（C大三和弦）
    const newChord: Chord = {
      notes: [
        { pitch: 'C', octave: 5, duration: 'w' },
        { pitch: 'G', octave: 4, duration: 'w' },
        { pitch: 'E', octave: 4, duration: 'w' },
        { pitch: 'C', octave: 3, duration: 'w' }
      ],
      romanNumeral: 'I',
      inversion: 0
    };

    setProgression({
      ...progression,
      chords: [...progression.chords, newChord]
    });
    
    setEditingChordIndex(progression.chords.length);
  };

  /**
   * 更新和弦
   */
  const handleChordChange = (chord: Chord) => {
    const newChords = [...progression.chords];
    newChords[editingChordIndex] = chord;
    
    setProgression({
      ...progression,
      chords: newChords
    });
  };

  /**
   * 删除和弦
   */
  const handleDeleteChord = (index: number) => {
    // 不能删除起始和弦
    if (index < exercise.startingChords.length) {
      return;
    }

    const newChords = progression.chords.filter((_, i) => i !== index);
    setProgression({
      ...progression,
      chords: newChords
    });

    // 调整编辑索引
    if (editingChordIndex >= newChords.length) {
      setEditingChordIndex(Math.max(0, newChords.length - 1));
    }
  };

  /**
   * 提交和弦进行
   */
  const handleSubmit = () => {
    onSubmit(progression);
  };

  /**
   * 重置练习题
   */
  const handleReset = () => {
    setProgression({
      chords: [...exercise.startingChords],
      key: exercise.key
    });
    setEditingChordIndex(exercise.startingChords.length);
  };

  /**
   * 检查是否可以提交
   */
  const canSubmit = 
    progression.chords.length === exercise.expectedLength && 
    !isCompleted &&
    constraintViolations.length === 0;

  /**
   * 检查是否可以添加和弦
   */
  const canAddChord = progression.chords.length < exercise.expectedLength;

  return (
    <div className="exercise-view" data-testid="exercise-view">
      {/* 练习题头部 */}
      <div className="exercise-header">
        <div className="exercise-title">
          <h2>练习题 {exercise.chapter}-{exercise.number}</h2>
          <span className="exercise-key">{exercise.key}</span>
        </div>
        
        {exercise.difficulty && (
          <div className="exercise-difficulty">
            难度: {'★'.repeat(exercise.difficulty)}{'☆'.repeat(5 - exercise.difficulty)}
          </div>
        )}
      </div>

      {/* 练习题说明 */}
      <div className="exercise-instructions">
        <h3>题目说明</h3>
        <p>{exercise.instructions}</p>
      </div>

      {/* 约束条件 */}
      {exercise.constraints && (
        <div className="exercise-constraints">
          <h4>约束条件</h4>
          <ul>
            {exercise.constraints.requiredChords && exercise.constraints.requiredChords.length > 0 && (
              <li>必须使用: {exercise.constraints.requiredChords.join(', ')}</li>
            )}
            {exercise.constraints.forbiddenChords && exercise.constraints.forbiddenChords.length > 0 && (
              <li>禁止使用: {exercise.constraints.forbiddenChords.join(', ')}</li>
            )}
            {exercise.constraints.minLength && (
              <li>最少和弦数: {exercise.constraints.minLength}</li>
            )}
            {exercise.constraints.maxLength && (
              <li>最多和弦数: {exercise.constraints.maxLength}</li>
            )}
          </ul>
        </div>
      )}

      {/* 提示信息 */}
      {exercise.hints && exercise.hints.length > 0 && (
        <div className="exercise-hints">
          <h4>💡 提示</h4>
          <ul>
            {exercise.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 进度指示 */}
      <div className="exercise-progress">
        <span>当前进度: {progression.chords.length} / {exercise.expectedLength} 个和弦</span>
        {isCompleted && <span className="completed-badge">✓ 已完成</span>}
      </div>

      {/* 五线谱显示 */}
      <div className="exercise-staff">
        <h3>和弦进行</h3>
        <StaffNotation 
          progression={progression}
          onNoteClick={(chordIndex) => setEditingChordIndex(chordIndex)}
        />
      </div>

      {/* 验证错误显示 */}
      {validationErrors.length > 0 && (
        <div className="exercise-errors">
          <ErrorDisplay errors={validationErrors} />
        </div>
      )}

      {/* 约束违规显示 */}
      {constraintViolations.length > 0 && (
        <div className="exercise-constraint-violations">
          <h4>⚠️ 约束违规</h4>
          <ul>
            {constraintViolations.map((violation, index) => (
              <li key={index} className={`violation-${violation.type}`}>
                {violation.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 和弦编辑器 */}
      {editingChordIndex < progression.chords.length && (
        <div className="exercise-editor">
          <div className="editor-header">
            <h3>编辑和弦 {editingChordIndex + 1}</h3>
            {editingChordIndex >= exercise.startingChords.length && (
              <button
                className="delete-chord-button"
                onClick={() => handleDeleteChord(editingChordIndex)}
                data-testid="delete-chord"
              >
                删除此和弦
              </button>
            )}
          </div>
          <ChordEditor
            chord={progression.chords[editingChordIndex]}
            onChange={handleChordChange}
            availableNotes={exercise.constraints?.requiredChords ? undefined : undefined}
            disabled={editingChordIndex < exercise.startingChords.length}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="exercise-actions">
        <button
          className="add-chord-button"
          onClick={handleAddChord}
          disabled={!canAddChord}
          data-testid="add-chord"
        >
          添加和弦 ({progression.chords.length}/{exercise.expectedLength})
        </button>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          data-testid="submit-progression"
        >
          提交答案
        </button>

        <button
          className="reset-button"
          onClick={handleReset}
          data-testid="reset-exercise"
        >
          重置
        </button>

        {onShowSolution && (
          <button
            className="show-solution-button"
            onClick={onShowSolution}
            data-testid="show-solution"
          >
            {showSolution ? '隐藏答案' : '查看答案'}
          </button>
        )}

        {onSkip && (
          <button
            className="skip-button"
            onClick={onSkip}
            data-testid="skip-exercise"
          >
            跳过
          </button>
        )}
      </div>

      {/* 参考答案显示 */}
      {showSolution && (
        <div className="exercise-solution">
          <h3>参考答案</h3>
          <StaffNotation progression={exercise.solution} />
          <p className="solution-note">
            注意：这只是一个参考答案，可能有多种正确的解法。
          </p>
        </div>
      )}
    </div>
  );
};
