import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NoteInput } from './NoteInput';
import { Voice, Note } from '../types/music';

describe('NoteInput 组件', () => {
  it('应该渲染音符输入界面', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    expect(screen.getByText('女高音')).toBeInTheDocument();
    expect(screen.getByText('音高')).toBeInTheDocument();
    expect(screen.getByText('变音记号')).toBeInTheDocument();
    expect(screen.getByText('八度')).toBeInTheDocument();
  });

  it('应该显示所有音高按钮', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    pitches.forEach(pitch => {
      expect(screen.getByTestId(`pitch-${pitch}`)).toBeInTheDocument();
    });
  });

  it('应该显示所有变音记号按钮', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    expect(screen.getByTestId('accidental-natural')).toBeInTheDocument();
    expect(screen.getByTestId('accidental-#')).toBeInTheDocument();
    expect(screen.getByTestId('accidental-b')).toBeInTheDocument();
  });

  it('应该显示所有八度按钮', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    [2, 3, 4, 5, 6].forEach(octave => {
      expect(screen.getByTestId(`octave-${octave}`)).toBeInTheDocument();
    });
  });

  it('应该允许选择音高', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    const dButton = screen.getByTestId('pitch-D');
    fireEvent.click(dButton);

    expect(dButton).toHaveClass('selected');
    // 检查当前选择显示中包含 D
    const selectionValue = screen.getByTestId('current-selection-value');
    expect(selectionValue).toHaveTextContent('D');
  });

  it('应该允许选择变音记号', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    const sharpButton = screen.getByTestId('accidental-#');
    fireEvent.click(sharpButton);

    expect(sharpButton).toHaveClass('selected');
  });

  it('应该允许选择八度', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    const octave5Button = screen.getByTestId('octave-5');
    fireEvent.click(octave5Button);

    expect(octave5Button).toHaveClass('selected');
  });

  it('应该在点击确认按钮时调用 onNoteSelect', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    // 选择 C4
    const confirmButton = screen.getByTestId('confirm-note');
    fireEvent.click(confirmButton);

    expect(onNoteSelect).toHaveBeenCalledWith({
      pitch: 'C',
      octave: 4,
      duration: 'w'
    });
  });

  it('应该在选择音符后调用 onNoteSelect', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    // 选择 E5
    fireEvent.click(screen.getByTestId('pitch-E'));
    fireEvent.click(screen.getByTestId('octave-5'));
    fireEvent.click(screen.getByTestId('confirm-note'));

    expect(onNoteSelect).toHaveBeenCalledWith({
      pitch: 'E',
      octave: 5,
      duration: 'w'
    });
  });

  it('应该在选择升号音符后调用 onNoteSelect', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    // 选择 F#4
    fireEvent.click(screen.getByTestId('pitch-F'));
    fireEvent.click(screen.getByTestId('accidental-#'));
    fireEvent.click(screen.getByTestId('confirm-note'));

    expect(onNoteSelect).toHaveBeenCalledWith({
      pitch: 'F#',
      octave: 4,
      duration: 'w'
    });
  });

  it('应该禁用超出声部范围的八度', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Bass} onNoteSelect={onNoteSelect} />);

    // 男低音的范围是 E2-E4，所以八度 5 和 6 应该被禁用
    const octave5Button = screen.getByTestId('octave-5');
    const octave6Button = screen.getByTestId('octave-6');

    expect(octave5Button).toHaveClass('unavailable');
    expect(octave6Button).toHaveClass('unavailable');
    expect(octave5Button).toBeDisabled();
    expect(octave6Button).toBeDisabled();
  });

  it('应该显示当前选择的音符', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);

    // 默认选择是 C4
    expect(screen.getByText(/C♮4/)).toBeInTheDocument();

    // 选择 G#5
    fireEvent.click(screen.getByTestId('pitch-G'));
    fireEvent.click(screen.getByTestId('accidental-#'));
    fireEvent.click(screen.getByTestId('octave-5'));

    expect(screen.getByText(/G#5/)).toBeInTheDocument();
  });

  it('应该在禁用时禁用所有按钮', () => {
    const onNoteSelect = vi.fn();
    render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} disabled={true} />);

    const pitchButton = screen.getByTestId('pitch-C');
    const accidentalButton = screen.getByTestId('accidental-natural');
    const confirmButton = screen.getByTestId('confirm-note');

    expect(pitchButton).toBeDisabled();
    expect(accidentalButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('应该根据 availableNotes 限制可选音符', () => {
    const onNoteSelect = vi.fn();
    const availableNotes: Note[] = [
      { pitch: 'C', octave: 4, duration: 'w' },
      { pitch: 'E', octave: 4, duration: 'w' },
      { pitch: 'G', octave: 4, duration: 'w' }
    ];

    render(
      <NoteInput
        voice={Voice.Soprano}
        onNoteSelect={onNoteSelect}
        availableNotes={availableNotes}
      />
    );

    // C4 应该可用
    fireEvent.click(screen.getByTestId('pitch-C'));
    fireEvent.click(screen.getByTestId('octave-4'));
    const confirmButton = screen.getByTestId('confirm-note');
    expect(confirmButton).not.toBeDisabled();

    // D4 不在可选列表中，应该被禁用
    fireEvent.click(screen.getByTestId('pitch-D'));
    expect(confirmButton).toBeDisabled();
  });

  it('应该为不同声部显示正确的名称', () => {
    const onNoteSelect = vi.fn();

    const { rerender } = render(<NoteInput voice={Voice.Soprano} onNoteSelect={onNoteSelect} />);
    expect(screen.getByText('女高音')).toBeInTheDocument();

    rerender(<NoteInput voice={Voice.Alto} onNoteSelect={onNoteSelect} />);
    expect(screen.getByText('女低音')).toBeInTheDocument();

    rerender(<NoteInput voice={Voice.Tenor} onNoteSelect={onNoteSelect} />);
    expect(screen.getByText('男高音')).toBeInTheDocument();

    rerender(<NoteInput voice={Voice.Bass} onNoteSelect={onNoteSelect} />);
    expect(screen.getByText('男低音')).toBeInTheDocument();
  });
});
