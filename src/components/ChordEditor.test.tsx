import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChordEditor } from './ChordEditor';
import { Voice, Chord } from '../types/music';
import { createNote } from '../core/musicUtils';

describe('ChordEditor 组件', () => {
  const createTestChord = (): Chord => ({
    notes: [
      createNote('C', 5), // 女高音
      createNote('G', 4), // 女低音
      createNote('E', 4), // 男高音
      createNote('C', 3)  // 男低音
    ]
  });

  it('应该渲染和弦编辑器', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    expect(screen.getByText('和弦编辑器')).toBeInTheDocument();
  });

  it('应该显示所有四个声部', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    expect(screen.getByText('女高音')).toBeInTheDocument();
    expect(screen.getByText('女低音')).toBeInTheDocument();
    expect(screen.getByText('男高音')).toBeInTheDocument();
    expect(screen.getByText('男低音')).toBeInTheDocument();
  });

  it('应该显示每个声部的音符', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    expect(screen.getByText('C5')).toBeInTheDocument();
    expect(screen.getByText('G4')).toBeInTheDocument();
    expect(screen.getByText('E4')).toBeInTheDocument();
    expect(screen.getByText('C3')).toBeInTheDocument();
  });

  it('应该在点击音符时显示编辑面板', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 点击女高音音符
    const sopranoNote = screen.getByTestId('note-display-0');
    fireEvent.click(sopranoNote);

    // 应该显示音符输入面板
    expect(screen.getByTestId('note-input-panel')).toBeInTheDocument();
    expect(screen.getByText('编辑 女高音')).toBeInTheDocument();
  });

  it('应该在选择新音符后更新和弦', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 点击女高音音符开始编辑
    fireEvent.click(screen.getByTestId('note-display-0'));

    // 选择新音符 D5
    fireEvent.click(screen.getByTestId('pitch-D'));
    fireEvent.click(screen.getByTestId('octave-5'));
    fireEvent.click(screen.getByTestId('confirm-note'));

    // 应该调用 onChange 并更新女高音音符
    expect(onChange).toHaveBeenCalledWith({
      notes: [
        { pitch: 'D', octave: 5, duration: 'w' }, // 女高音更新为 D5
        createNote('G', 4), // 女低音不变
        createNote('E', 4), // 男高音不变
        createNote('C', 3)  // 男低音不变
      ]
    });
  });

  it('应该在选择音符后关闭编辑面板', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 打开编辑面板
    fireEvent.click(screen.getByTestId('note-display-0'));
    expect(screen.getByTestId('note-input-panel')).toBeInTheDocument();

    // 选择音符
    fireEvent.click(screen.getByTestId('confirm-note'));

    // 编辑面板应该关闭
    expect(screen.queryByTestId('note-input-panel')).not.toBeInTheDocument();
  });

  it('应该在点击取消按钮时关闭编辑面板', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 打开编辑面板
    fireEvent.click(screen.getByTestId('note-display-0'));
    expect(screen.getByTestId('note-input-panel')).toBeInTheDocument();

    // 点击取消按钮
    fireEvent.click(screen.getByTestId('cancel-edit'));

    // 编辑面板应该关闭
    expect(screen.queryByTestId('note-input-panel')).not.toBeInTheDocument();
    // 不应该调用 onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it('应该支持编辑不同的声部', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 编辑女低音
    fireEvent.click(screen.getByTestId('note-display-1'));
    expect(screen.getByText('编辑 女低音')).toBeInTheDocument();

    // 取消
    fireEvent.click(screen.getByTestId('cancel-edit'));

    // 编辑男高音
    fireEvent.click(screen.getByTestId('note-display-2'));
    expect(screen.getByText('编辑 男高音')).toBeInTheDocument();

    // 取消
    fireEvent.click(screen.getByTestId('cancel-edit'));

    // 编辑男低音
    fireEvent.click(screen.getByTestId('note-display-3'));
    expect(screen.getByText('编辑 男低音')).toBeInTheDocument();
  });

  it('应该在点击删除按钮时删除音符', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 点击女高音的删除按钮
    fireEvent.click(screen.getByTestId('delete-button-0'));

    // 应该调用 onChange
    expect(onChange).toHaveBeenCalled();
  });

  it('应该在禁用时禁用所有交互', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} disabled={true} />);

    // 删除按钮应该被禁用
    const deleteButton = screen.getByTestId('delete-button-0');
    expect(deleteButton).toBeDisabled();

    // 点击音符不应该打开编辑面板
    fireEvent.click(screen.getByTestId('note-display-0'));
    expect(screen.queryByTestId('note-input-panel')).not.toBeInTheDocument();
  });

  it('应该高亮正在编辑的声部', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 点击女高音开始编辑
    fireEvent.click(screen.getByTestId('note-display-0'));

    // 女高音的 voice-item 应该有 editing 类
    const sopranoItem = screen.getByTestId('voice-item-0');
    expect(sopranoItem).toHaveClass('editing');
  });

  it('应该将 availableNotes 传递给 NoteInput', () => {
    const chord = createTestChord();
    const onChange = vi.fn();
    const availableNotes = [
      createNote('C', 5),
      createNote('D', 5),
      createNote('E', 5)
    ];

    render(
      <ChordEditor
        chord={chord}
        onChange={onChange}
        availableNotes={availableNotes}
      />
    );

    // 打开编辑面板
    fireEvent.click(screen.getByTestId('note-display-0'));

    // NoteInput 应该接收到 availableNotes
    // 这里我们通过检查是否可以选择不在列表中的音符来验证
    fireEvent.click(screen.getByTestId('pitch-F'));
    fireEvent.click(screen.getByTestId('octave-5'));

    // F5 不在 availableNotes 中，确认按钮应该被禁用
    const confirmButton = screen.getByTestId('confirm-note');
    expect(confirmButton).toBeDisabled();
  });

  it('应该支持连续编辑多个声部', () => {
    const chord = createTestChord();
    const onChange = vi.fn();

    render(<ChordEditor chord={chord} onChange={onChange} />);

    // 编辑女高音
    fireEvent.click(screen.getByTestId('note-display-0'));
    fireEvent.click(screen.getByTestId('pitch-D'));
    fireEvent.click(screen.getByTestId('confirm-note'));

    expect(onChange).toHaveBeenCalledTimes(1);

    // 编辑女低音
    fireEvent.click(screen.getByTestId('note-display-1'));
    fireEvent.click(screen.getByTestId('pitch-A'));
    fireEvent.click(screen.getByTestId('confirm-note'));

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
