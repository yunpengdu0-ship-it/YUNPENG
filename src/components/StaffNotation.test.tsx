import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StaffNotation } from './StaffNotation';
import { createNote } from '../core/musicUtils';
import type { ChordProgression } from '../types/music';

describe('StaffNotation 组件', () => {
  it('应该渲染一个空的和弦进行', () => {
    const emptyProgression: ChordProgression = {
      chords: []
    };

    const { container } = render(<StaffNotation progression={emptyProgression} />);
    expect(container.querySelector('.staff-notation')).toBeTruthy();
  });

  it('应该渲染一个包含单个和弦的进行', () => {
    const progression: ChordProgression = {
      chords: [
        {
          notes: [
            createNote('G', 4),  // 女高音
            createNote('E', 4),  // 女低音
            createNote('C', 4),  // 男高音
            createNote('C', 3)   // 男低音
          ]
        }
      ]
    };

    const { container } = render(<StaffNotation progression={progression} />);
    const staffElement = container.querySelector('.staff-notation');
    
    expect(staffElement).toBeTruthy();
    // VexFlow 会创建 SVG 元素
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('应该渲染多个和弦', () => {
    const progression: ChordProgression = {
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
            createNote('F', 2)
          ]
        }
      ]
    };

    const { container } = render(<StaffNotation progression={progression} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('应该处理包含升降号的音符', () => {
    const progression: ChordProgression = {
      chords: [
        {
          notes: [
            createNote('F#', 4),  // 升F
            createNote('D', 4),
            createNote('A', 3),
            createNote('D', 3)
          ]
        }
      ]
    };

    const { container } = render(<StaffNotation progression={progression} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('应该在音符数量不是4时显示警告', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const invalidProgression: ChordProgression = {
      chords: [
        {
          notes: [
            createNote('C', 4),
            createNote('E', 4)
            // 缺少两个音符
          ]
        }
      ]
    };

    render(<StaffNotation progression={invalidProgression} />);
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });
});
