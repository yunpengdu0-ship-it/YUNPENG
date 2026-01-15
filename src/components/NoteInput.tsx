import React, { useState } from 'react';
import { Note, Voice } from '../types/music';
import { isNoteInVoiceRange } from '../core/voiceRanges';
import './NoteInput.css';

/**
 * 音符输入组件属性
 */
export interface NoteInputProps {
  /** 当前声部 */
  voice: Voice;
  /** 音符选择回调 */
  onNoteSelect: (note: Note) => void;
  /** 可选音符列表（可选，用于练习题约束） */
  availableNotes?: Note[];
  /** 是否禁用输入 */
  disabled?: boolean;
}

/**
 * 音高列表（不含升降号）
 */
const PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * 变音记号
 */
const ACCIDENTALS = [
  { symbol: '', label: '♮' },
  { symbol: '#', label: '♯' },
  { symbol: 'b', label: '♭' }
];

/**
 * 八度范围（覆盖所有声部）
 */
const OCTAVES = [2, 3, 4, 5, 6];

/**
 * 音符输入组件
 * 提供音高、变音记号和八度的选择界面
 */
export const NoteInput: React.FC<NoteInputProps> = ({
  voice,
  onNoteSelect,
  availableNotes,
  disabled = false
}) => {
  const [selectedPitch, setSelectedPitch] = useState<string>('C');
  const [selectedAccidental, setSelectedAccidental] = useState<string>('');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);

  /**
   * 获取声部名称
   */
  const getVoiceName = (v: Voice): string => {
    const names: Record<Voice, string> = {
      [Voice.Soprano]: '女高音',
      [Voice.Alto]: '女低音',
      [Voice.Tenor]: '男高音',
      [Voice.Bass]: '男低音'
    };
    return names[v];
  };

  /**
   * 检查音符是否可用
   */
  const isNoteAvailable = (pitch: string, octave: number): boolean => {
    const fullPitch = pitch + selectedAccidental;
    const note: Note = {
      pitch: fullPitch,
      octave,
      duration: 'w'
    };

    // 检查是否在声部范围内
    if (!isNoteInVoiceRange(note, voice)) {
      return false;
    }

    // 如果有可选音符列表，检查是否在列表中
    if (availableNotes && availableNotes.length > 0) {
      return availableNotes.some(
        n => n.pitch === fullPitch && n.octave === octave
      );
    }

    return true;
  };

  /**
   * 处理音符选择
   */
  const handleNoteSelect = () => {
    const fullPitch = selectedPitch + selectedAccidental;
    const note: Note = {
      pitch: fullPitch,
      octave: selectedOctave,
      duration: 'w'
    };

    if (isNoteAvailable(selectedPitch, selectedOctave)) {
      onNoteSelect(note);
    }
  };

  /**
   * 检查当前选择是否有效
   */
  const isCurrentSelectionValid = isNoteAvailable(selectedPitch, selectedOctave);

  return (
    <div className="note-input" data-testid="note-input">
      <div className="note-input-header">
        <h3>{getVoiceName(voice)}</h3>
      </div>

      <div className="note-input-body">
        {/* 音高选择 */}
        <div className="input-section">
          <label>音高</label>
          <div className="pitch-buttons">
            {PITCHES.map(pitch => (
              <button
                key={pitch}
                className={`pitch-button ${selectedPitch === pitch ? 'selected' : ''}`}
                onClick={() => setSelectedPitch(pitch)}
                disabled={disabled}
                data-testid={`pitch-${pitch}`}
              >
                {pitch}
              </button>
            ))}
          </div>
        </div>

        {/* 变音记号选择 */}
        <div className="input-section">
          <label>变音记号</label>
          <div className="accidental-buttons">
            {ACCIDENTALS.map(acc => (
              <button
                key={acc.symbol}
                className={`accidental-button ${selectedAccidental === acc.symbol ? 'selected' : ''}`}
                onClick={() => setSelectedAccidental(acc.symbol)}
                disabled={disabled}
                data-testid={`accidental-${acc.symbol || 'natural'}`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* 八度选择 */}
        <div className="input-section">
          <label>八度</label>
          <div className="octave-buttons">
            {OCTAVES.map(octave => {
              const available = isNoteAvailable(selectedPitch, octave);
              return (
                <button
                  key={octave}
                  className={`octave-button ${selectedOctave === octave ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                  onClick={() => setSelectedOctave(octave)}
                  disabled={disabled || !available}
                  data-testid={`octave-${octave}`}
                  title={!available ? '此八度超出声部范围' : ''}
                >
                  {octave}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前选择预览 */}
        <div className="current-selection">
          <span className="selection-label">当前选择：</span>
          <span className="selection-value" data-testid="current-selection-value">
            {selectedPitch}{selectedAccidental || '♮'}{selectedOctave}
          </span>
          {!isCurrentSelectionValid && (
            <span className="selection-warning">（超出范围）</span>
          )}
        </div>

        {/* 确认按钮 */}
        <button
          className="confirm-button"
          onClick={handleNoteSelect}
          disabled={disabled || !isCurrentSelectionValid}
          data-testid="confirm-note"
        >
          添加音符
        </button>
      </div>
    </div>
  );
};
