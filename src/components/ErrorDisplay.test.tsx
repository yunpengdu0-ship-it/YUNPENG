import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from './ErrorDisplay';
import type { ValidationError } from '../validation/types';

describe('ErrorDisplay 组件', () => {
  it('应该在没有错误时不渲染任何内容', () => {
    const { container } = render(<ErrorDisplay errors={[]} />);
    expect(container.querySelector('.error-display')).toBeNull();
  });

  it('应该显示错误数量', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'parallel-fifths',
        ruleName: '平行五度',
        message: '检测到平行五度',
        chapterReference: 1,
        affectedVoices: [0, 1],
        affectedChords: [0, 1]
      },
      {
        ruleId: 'parallel-octaves',
        ruleName: '平行八度',
        message: '检测到平行八度',
        chapterReference: 1,
        affectedVoices: [2, 3],
        affectedChords: [1, 2]
      }
    ];

    render(<ErrorDisplay errors={errors} />);
    expect(screen.getByText(/发现 2 个和声错误/)).toBeTruthy();
  });

  it('应该显示每个错误的详细信息', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'parallel-fifths',
        ruleName: '平行五度',
        message: '女高音和女低音之间存在平行五度',
        chapterReference: 1,
        affectedVoices: [0, 1],
        affectedChords: [0, 1]
      }
    ];

    render(<ErrorDisplay errors={errors} />);

    // 验证规则名称
    expect(screen.getByText('平行五度')).toBeTruthy();

    // 验证错误消息
    expect(screen.getByText('女高音和女低音之间存在平行五度')).toBeTruthy();

    // 验证章节引用
    expect(screen.getByText(/第 1 章/)).toBeTruthy();

    // 验证受影响的声部
    expect(screen.getByText(/女高音, 女低音/)).toBeTruthy();

    // 验证受影响的和弦
    expect(screen.getByText(/第 1 个, 第 2 个/)).toBeTruthy();
  });

  it('应该在点击错误时调用回调', () => {
    const onErrorClick = vi.fn();
    const errors: ValidationError[] = [
      {
        ruleId: 'parallel-fifths',
        ruleName: '平行五度',
        message: '检测到平行五度',
        chapterReference: 1,
        affectedVoices: [0, 1],
        affectedChords: [0, 1]
      }
    ];

    const { container } = render(
      <ErrorDisplay errors={errors} onErrorClick={onErrorClick} />
    );

    const errorItem = container.querySelector('.error-item');
    expect(errorItem).toBeTruthy();

    fireEvent.click(errorItem!);
    expect(onErrorClick).toHaveBeenCalledWith(errors[0]);
  });

  it('应该显示多个错误', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'parallel-fifths',
        ruleName: '平行五度',
        message: '错误1',
        chapterReference: 1,
        affectedVoices: [0, 1],
        affectedChords: [0, 1]
      },
      {
        ruleId: 'parallel-octaves',
        ruleName: '平行八度',
        message: '错误2',
        chapterReference: 1,
        affectedVoices: [2, 3],
        affectedChords: [1, 2]
      },
      {
        ruleId: 'voice-crossing',
        ruleName: '声部交叉',
        message: '错误3',
        chapterReference: 2,
        affectedVoices: [1, 2],
        affectedChords: [2]
      }
    ];

    const { container } = render(<ErrorDisplay errors={errors} />);

    const errorItems = container.querySelectorAll('.error-item');
    expect(errorItems.length).toBe(3);
  });

  it('应该处理没有受影响声部的错误', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'test-rule',
        ruleName: '测试规则',
        message: '测试消息',
        chapterReference: 1,
        affectedVoices: [],
        affectedChords: []
      }
    ];

    render(<ErrorDisplay errors={errors} />);
    expect(screen.getByText('测试规则')).toBeTruthy();
    expect(screen.getByText('测试消息')).toBeTruthy();
  });

  it('应该处理没有章节引用的错误', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'test-rule',
        ruleName: '测试规则',
        message: '测试消息',
        affectedVoices: [0],
        affectedChords: [0]
      }
    ];

    const { container } = render(<ErrorDisplay errors={errors} />);
    expect(container.querySelector('.error-display')).toBeTruthy();
    expect(screen.getByText('测试规则')).toBeTruthy();
  });

  it('应该显示提示信息', () => {
    const errors: ValidationError[] = [
      {
        ruleId: 'test-rule',
        ruleName: '测试规则',
        message: '测试消息',
        chapterReference: 1,
        affectedVoices: [0],
        affectedChords: [0]
      }
    ];

    render(<ErrorDisplay errors={errors} />);
    expect(screen.getByText(/点击错误可以在五线谱上高亮显示相关音符/)).toBeTruthy();
  });
});
