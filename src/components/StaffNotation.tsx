import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import type { ChordProgression, Note } from '../types/music';

/**
 * StaffNotation 组件属性
 */
export interface StaffNotationProps {
  /** 要渲染的和弦进行 */
  progression: ChordProgression;
  /** 点击音符时的回调 */
  onNoteClick?: (chordIndex: number, voiceIndex: number) => void;
  /** 需要高亮显示的音符 */
  highlightedNotes?: Array<{ chordIndex: number; voiceIndex: number }>;
}

/**
 * 将 Note 对象转换为 VexFlow 音符字符串格式
 * 例如: { pitch: 'C', octave: 4 } => 'c/4'
 */
function noteToVexFlowString(note: Note): string {
  return `${note.pitch.toLowerCase()}/${note.octave}`;
}

/**
 * 五线谱渲染组件
 * 使用 VexFlow 渲染和弦进行
 */
export function StaffNotation({ progression, onNoteClick, highlightedNotes = [] }: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || progression.chords.length === 0) {
      return;
    }

    // 清空容器
    containerRef.current.innerHTML = '';

    try {
      // 创建 VexFlow 渲染器
      const renderer = new Renderer(
        containerRef.current,
        Renderer.Backends.SVG
      );

      // 设置渲染器尺寸
      const width = Math.max(600, progression.chords.length * 150);
      const height = 300;
      renderer.resize(width, height);

      const context = renderer.getContext();

      // 创建五线谱（高音谱表和低音谱表）
      const trebleStave = new Stave(10, 40, width - 20);
      trebleStave.addClef('treble');
      trebleStave.setContext(context).draw();

      const bassStave = new Stave(10, 140, width - 20);
      bassStave.addClef('bass');
      bassStave.setContext(context).draw();

      // 为每个和弦创建音符
      const trebleNotes: StaveNote[] = [];
      const bassNotes: StaveNote[] = [];

      progression.chords.forEach((chord, chordIndex) => {
        // 确保和弦有4个音符（女高音、女低音、男高音、男低音）
        if (chord.notes.length !== 4) {
          console.warn(`和弦 ${chordIndex} 的音符数量不是4个`);
          return;
        }

        // 女高音和女低音在高音谱表
        const soprano = chord.notes[0]; // 女高音
        const alto = chord.notes[1];    // 女低音

        // 男高音和男低音在低音谱表
        const tenor = chord.notes[2];   // 男高音
        const bass = chord.notes[3];    // 男低音

        // 创建高音谱表音符（女高音和女低音）
        const trebleNote = new StaveNote({
          keys: [noteToVexFlowString(alto), noteToVexFlowString(soprano)],
          duration: 'w',
          clef: 'treble'
        });

        // 创建低音谱表音符（男高音和男低音）
        const bassNote = new StaveNote({
          keys: [noteToVexFlowString(bass), noteToVexFlowString(tenor)],
          duration: 'w',
          clef: 'bass'
        });

        // 添加升降号（如果需要）
        [soprano, alto].forEach((note, voiceIndex) => {
          if (note.pitch.includes('#')) {
            trebleNote.addModifier(new Accidental('#'), voiceIndex);
          } else if (note.pitch.includes('b')) {
            trebleNote.addModifier(new Accidental('b'), voiceIndex);
          }
        });

        [bass, tenor].forEach((note, voiceIndex) => {
          if (note.pitch.includes('#')) {
            bassNote.addModifier(new Accidental('#'), voiceIndex);
          } else if (note.pitch.includes('b')) {
            bassNote.addModifier(new Accidental('b'), voiceIndex);
          }
        });

        trebleNotes.push(trebleNote);
        bassNotes.push(bassNote);
      });

      // 创建 Voice 对象并格式化
      if (trebleNotes.length > 0 && bassNotes.length > 0) {
        const trebleVoice = new Voice({ num_beats: trebleNotes.length, beat_value: 1 });
        trebleVoice.addTickables(trebleNotes);

        const bassVoice = new Voice({ num_beats: bassNotes.length, beat_value: 1 });
        bassVoice.addTickables(bassNotes);

        // 格式化并渲染
        new Formatter()
          .joinVoices([trebleVoice])
          .format([trebleVoice], width - 40);

        new Formatter()
          .joinVoices([bassVoice])
          .format([bassVoice], width - 40);

        trebleVoice.draw(context, trebleStave);
        bassVoice.draw(context, bassStave);
      }

      // TODO: 实现音符点击和高亮功能
      // 这需要在 SVG 元素上添加事件监听器

    } catch (error) {
      console.error('渲染五线谱时出错:', error);
    }
  }, [progression, highlightedNotes]);

  return (
    <div 
      ref={containerRef} 
      className="staff-notation"
      style={{ 
        width: '100%', 
        overflow: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        backgroundColor: '#fff'
      }}
    />
  );
}
