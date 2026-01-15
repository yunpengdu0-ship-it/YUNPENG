import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseView } from './ExerciseView';
import { Exercise } from '../types/exercise';
import { createNote } from '../core/musicUtils';

describe('ExerciseView 组件', () => {
  const createTestExercise = (): Exercise => ({
    id: '1-1',
    chapter: 1,
    number: 1,
    instructions: '完成以下和弦进行：I - IV - V - I',
    key: 'C major',
    startingChords: [
      {
        notes: [
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 4),
          createNote('C', 3)
        ]
      }
    ],
    expectedLength: 4,
    difficulty: 1,
    hints: ['保持共同音不动', '避免平行五八度'],
    solution: {
      chords: [
        {
          notes: [
            createNote('G', 4),
            createNote('E', 4),
            createNote('C', 4),
            createNote('C', 3)
          ]
        },
        {
          notes: [
            createNote('A', 4),
            createNote('F', 4),
            createNote('C', 4),
            createNote('F', 3)
          ]
        },
        {
          notes: [
            createNote('G', 4),
            createNote('F', 4),
            createNote('D', 4),
            createNote('G', 3)
          ]
        },
        {
          notes: [
            createNote('G', 4),
            createNote('E', 4),
            createNote('C', 4),
            createNote('C', 3)
          ]
        }
      ],
      key: 'C major'
    }
  });

  it('应该渲染练习题视图', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText('练习题 1-1')).toBeInTheDocument();
  });

  it('应该显示练习题说明', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText('完成以下和弦进行：I - IV - V - I')).toBeInTheDocument();
  });

  it('应该显示调性', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText('C major')).toBeInTheDocument();
  });

  it('应该显示难度', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText(/难度:/)).toBeInTheDocument();
  });

  it('应该显示提示信息', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText('保持共同音不动')).toBeInTheDocument();
    expect(screen.getByText('避免平行五八度')).toBeInTheDocument();
  });

  it('应该显示进度指示', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText(/当前进度: 1 \/ 4 个和弦/)).toBeInTheDocument();
  });

  it('应该显示添加和弦按钮', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    const addButton = screen.getByTestId('add-chord');
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();
  });

  it('应该允许添加和弦', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 初始有1个和弦
    expect(screen.getByText(/当前进度: 1 \/ 4 个和弦/)).toBeInTheDocument();

    // 添加和弦
    fireEvent.click(screen.getByTestId('add-chord'));

    // 现在应该有2个和弦
    expect(screen.getByText(/当前进度: 2 \/ 4 个和弦/)).toBeInTheDocument();
  });

  it('应该在达到期望长度时禁用添加按钮', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加3个和弦（总共4个）
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    // 添加按钮应该被禁用
    expect(screen.getByTestId('add-chord')).toBeDisabled();
  });

  it('应该在达到期望长度时启用提交按钮', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    const submitButton = screen.getByTestId('submit-progression');

    // 初始时提交按钮应该被禁用
    expect(submitButton).toBeDisabled();

    // 添加3个和弦（总共4个）
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    // 提交按钮应该被启用
    expect(submitButton).not.toBeDisabled();
  });

  it('应该在点击提交时调用 onSubmit', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加3个和弦
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    // 提交
    fireEvent.click(screen.getByTestId('submit-progression'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'C major',
        chords: expect.arrayContaining([
          expect.objectContaining({
            notes: expect.any(Array)
          })
        ])
      })
    );
  });

  it('应该允许重置练习题', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加2个和弦
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    expect(screen.getByText(/当前进度: 3 \/ 4 个和弦/)).toBeInTheDocument();

    // 重置
    fireEvent.click(screen.getByTestId('reset-exercise'));

    // 应该回到初始状态
    expect(screen.getByText(/当前进度: 1 \/ 4 个和弦/)).toBeInTheDocument();
  });

  it('应该显示约束条件', () => {
    const exercise: Exercise = {
      ...createTestExercise(),
      constraints: {
        requiredChords: ['IV', 'V'],
        forbiddenChords: ['II'],
        minLength: 3,
        maxLength: 5
      }
    };
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    expect(screen.getByText(/必须使用: IV, V/)).toBeInTheDocument();
    expect(screen.getByText(/禁止使用: II/)).toBeInTheDocument();
    expect(screen.getByText(/最少和弦数: 3/)).toBeInTheDocument();
    expect(screen.getByText(/最多和弦数: 5/)).toBeInTheDocument();
  });

  it('应该在违反约束时显示约束违规', async () => {
    const exercise: Exercise = {
      ...createTestExercise(),
      constraints: {
        requiredChords: ['IV', 'V']
      }
    };
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加和弦但不包含必需的和弦
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    // 应该显示约束违规
    expect(await screen.findByText(/约束违规/)).toBeInTheDocument();
  });

  it('应该在违反约束时禁用提交按钮', () => {
    const exercise: Exercise = {
      ...createTestExercise(),
      constraints: {
        requiredChords: ['IV', 'V']
      }
    };
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加3个和弦（达到期望长度）
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    // 提交按钮应该被禁用（因为违反约束）
    expect(screen.getByTestId('submit-progression')).toBeDisabled();
  });

  it('应该显示验证错误', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();
    const errors = [
      {
        ruleId: 'parallel-fifths',
        ruleName: '平行五度',
        message: '检测到平行五度',
        chapterReference: 1,
        affectedVoices: [0, 1],
        affectedChords: [0, 1]
      }
    ];

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        validationErrors={errors}
      />
    );

    expect(screen.getByText('平行五度')).toBeInTheDocument();
  });

  it('应该支持显示参考答案', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();
    const onShowSolution = vi.fn();

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        onShowSolution={onShowSolution}
        showSolution={false}
      />
    );

    // 应该有查看答案按钮
    const showButton = screen.getByTestId('show-solution');
    expect(showButton).toBeInTheDocument();
    expect(showButton).toHaveTextContent('查看答案');

    // 点击按钮
    fireEvent.click(showButton);
    expect(onShowSolution).toHaveBeenCalled();
  });

  it('应该在显示答案时渲染参考答案', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        showSolution={true}
      />
    );

    expect(screen.getByText('参考答案')).toBeInTheDocument();
    expect(screen.getByText(/这只是一个参考答案/)).toBeInTheDocument();
  });

  it('应该支持跳过功能', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();
    const onSkip = vi.fn();

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    );

    const skipButton = screen.getByTestId('skip-exercise');
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);
    expect(onSkip).toHaveBeenCalled();
  });

  it('应该在完成时显示完成标记', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        isCompleted={true}
      />
    );

    expect(screen.getByText('✓ 已完成')).toBeInTheDocument();
  });

  it('应该在完成时禁用提交按钮', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(
      <ExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        isCompleted={true}
      />
    );

    // 即使达到期望长度，提交按钮也应该被禁用
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));
    fireEvent.click(screen.getByTestId('add-chord'));

    expect(screen.getByTestId('submit-progression')).toBeDisabled();
  });

  it('应该允许删除非起始和弦', () => {
    const exercise = createTestExercise();
    const onSubmit = vi.fn();

    render(<ExerciseView exercise={exercise} onSubmit={onSubmit} />);

    // 添加一个和弦
    fireEvent.click(screen.getByTestId('add-chord'));
    expect(screen.getByText(/当前进度: 2 \/ 4 个和弦/)).toBeInTheDocument();

    // 应该显示删除按钮
    const deleteButton = screen.getByTestId('delete-chord');
    expect(deleteButton).toBeInTheDocument();

    // 删除和弦
    fireEvent.click(deleteButton);
    expect(screen.getByText(/当前进度: 1 \/ 4 个和弦/)).toBeInTheDocument();
  });
});
