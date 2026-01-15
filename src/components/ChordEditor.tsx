import React, { useState } from 'react';
import { Chord, Note, Voice } from '../types/music';
import { NoteInput } from './NoteInput';
import './ChordEditor.css';

/**
 * 和弦编辑器组件属性
 */
export interface ChordEditorProps {
  /** 当前和弦 */
  chord: Chord;
  /** 和弦变化回调 */
  onChange: (chord: Chord) => void;
  /** 可选音符列表（可选，用于练习题约束） */
  availableNotes?: Note[];
  /** 是否禁用编辑 */
  disabled?: boolean;
}

/**
 * 获取声部名称
 */
const getVoiceName = (voice: Voice): string => {
  const names: Record<Voice, string> = {
    [Voice.Soprano]: '女高音',
    [Voice.Alto]: '女低音',
    [Voice.Tenor]: '男高音',
    [Voice.Bass]: '男低音'
  };
  return names[voice];
};

/**
 * 格式化音符显示
 */
const formatNote = (note: Note | null): string => {
  if (!note) return '(空)';
  return `${note.pitch}${note.octave}`;
};

/**
 * 和弦编辑器组件
 * 显示四个声部的音符，支持点击编辑和删除
 */
export const ChordEditor: React.FC<ChordEditorProps> = ({
  chord,
  onChange,
  availableNotes,
  disabled = false
}) => {
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);

  /**
   * 处理音符选择
   */
  const handleNoteSelect = (note: Note) => {
    if (editingVoice === null) return;

    const newNotes = [...chord.notes];
    newNotes[editingVoice] = note;

    onChange({
      ...chord,
      notes: newNotes
    });

    setEditingVoice(null);
  };

  /**
   * 处理音符删除
   */
  const handleNoteDelete = (voice: Voice) => {
    if (disabled) return;

    const newNotes = [...chord.notes];
    // 将音符设置为 null 表示删除（但保持数组长度）
    // 实际上我们需要保持4个声部，所以这里用一个占位符
    newNotes[voice] = { pitch: 'C', octave: 4, duration: 'w' };

    onChange({
      ...chord,
      notes: newNotes
    });
  };

  /**
   * 处理音符点击（开始编辑）
   */
  const handleNoteClick = (voice: Voice) => {
    if (disabled) return;
    setEditingVoice(voice);
  };

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setEditingVoice(null);
  };

  return (
    <div className="chord-editor" data-testid="chord-editor">
      <div className="chord-editor-header">
        <h3>和弦编辑器</h3>
      </div>

      <div className="chord-editor-body">
        {/* 显示四个声部 */}
        <div className="voices-list">
          {[Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass].map(voice => {
            const note = chord.notes[voice];
            const isEditing = editingVoice === voice;

            return (
              <div
                key={voice}
                className={`voice-item ${isEditing ? 'editing' : ''}`}
                data-testid={`voice-item-${voice}`}
              >
                <div className="voice-label">{getVoiceName(voice)}</div>
                <div className="voice-content">
                  <div
                    className="note-display"
                    onClick={() => handleNoteClick(voice)}
                    data-testid={`note-display-${voice}`}
                  >
                    {formatNote(note)}
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => handleNoteDelete(voice)}
                    disabled={disabled}
                    data-testid={`delete-button-${voice}`}
                    title="删除音符"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 音符输入面板 */}
        {editingVoice !== null && (
          <div className="note-input-panel" data-testid="note-input-panel">
            <div className="panel-header">
              <h4>编辑 {getVoiceName(editingVoice)}</h4>
              <button
                className="cancel-button"
                onClick={handleCancelEdit}
                data-testid="cancel-edit"
              >
                取消
              </button>
            </div>
            <NoteInput
              voice={editingVoice}
              onNoteSelect={handleNoteSelect}
              availableNotes={availableNotes}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};
