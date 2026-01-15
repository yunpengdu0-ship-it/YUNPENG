import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LevelSelector, LevelInfo } from './LevelSelector';

describe('LevelSelector 组件', () => {
  const createTestLevels = (): LevelInfo[] => {
    const levels: LevelInfo[] = [];
    for (let i = 1; i <= 10; i++) {
      levels.push({
        number: i,
        title: `第 ${Math.ceil(i / 2)} 章`,
        chapter: Math.ceil(i / 2),
        isUnlocked: i <= 3,
        isCompleted: i <= 2
      });
    }
    return levels;
  };

  it('应该渲染关卡选择器', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    expect(screen.getByText('关卡选择')).toBeInTheDocument();
  });

  it('应该显示统计信息', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    expect(screen.getByText('已完成:')).toBeInTheDocument();
    expect(screen.getByText('已解锁:')).toBeInTheDocument();
    expect(screen.getByText('总计:')).toBeInTheDocument();
  });

  it('应该显示正确的统计数字', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    // 2个已完成，3个已解锁，10个总计
    const statValues = screen.getAllByTestId(/^stat-value-/);
    expect(statValues[0]).toHaveTextContent('2'); // 已完成
    expect(statValues[1]).toHaveTextContent('3'); // 已解锁
    expect(statValues[2]).toHaveTextContent('10'); // 总计
  });

  it('应该显示图例', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('可进行')).toBeInTheDocument();
    expect(screen.getByText('未解锁')).toBeInTheDocument();
    expect(screen.getByText('当前关卡')).toBeInTheDocument();
  });

  it('应该显示所有关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    levels.forEach(level => {
      expect(screen.getByTestId(`level-${level.number}`)).toBeInTheDocument();
    });
  });

  it('应该按章节分组显示关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    // 应该有5个章节（10个关卡，每章2个）
    const chapterHeaders = screen.getAllByText(/第 \d+ 章/);
    expect(chapterHeaders.length).toBeGreaterThan(0);
  });

  it('应该标记已完成的关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level1 = screen.getByTestId('level-1');
    const level2 = screen.getByTestId('level-2');

    expect(level1).toHaveClass('completed');
    expect(level2).toHaveClass('completed');
  });

  it('应该标记已解锁但未完成的关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level3 = screen.getByTestId('level-3');

    expect(level3).toHaveClass('unlocked');
    expect(level3).not.toHaveClass('completed');
  });

  it('应该标记锁定的关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level4 = screen.getByTestId('level-4');

    expect(level4).toHaveClass('locked');
    expect(level4).toBeDisabled();
  });

  it('应该标记当前关卡', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={2}
        onLevelSelect={onLevelSelect}
      />
    );

    const level2 = screen.getByTestId('level-2');

    expect(level2).toHaveClass('current');
  });

  it('应该在点击已解锁关卡时调用 onLevelSelect', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level2 = screen.getByTestId('level-2');
    fireEvent.click(level2);

    expect(onLevelSelect).toHaveBeenCalledWith(2);
  });

  it('应该在点击锁定关卡时不调用 onLevelSelect', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level4 = screen.getByTestId('level-4');
    fireEvent.click(level4);

    expect(onLevelSelect).not.toHaveBeenCalled();
  });

  it('应该显示完成标记', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level1 = screen.getByTestId('level-1');
    expect(level1).toHaveTextContent('✓');
  });

  it('应该显示锁定图标', () => {
    const levels = createTestLevels();
    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    const level4 = screen.getByTestId('level-4');
    expect(level4).toHaveTextContent('🔒');
  });

  it('应该处理大量关卡', () => {
    const levels: LevelInfo[] = [];
    for (let i = 1; i <= 60; i++) {
      levels.push({
        number: i,
        title: `第 ${Math.ceil(i / 2)} 章`,
        chapter: Math.ceil(i / 2),
        isUnlocked: i === 1,
        isCompleted: false
      });
    }

    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    // 应该显示所有60个关卡
    expect(screen.getByTestId('level-1')).toBeInTheDocument();
    expect(screen.getByTestId('level-60')).toBeInTheDocument();
  });

  it('应该支持不同的章节标题', () => {
    const levels: LevelInfo[] = [
      {
        number: 1,
        title: '三和弦的原位',
        chapter: 1,
        isUnlocked: true,
        isCompleted: false
      },
      {
        number: 2,
        title: '三和弦的原位',
        chapter: 1,
        isUnlocked: true,
        isCompleted: false
      }
    ];

    const onLevelSelect = vi.fn();

    render(
      <LevelSelector
        levels={levels}
        currentLevel={1}
        onLevelSelect={onLevelSelect}
      />
    );

    expect(screen.getByText('三和弦的原位')).toBeInTheDocument();
  });
});
