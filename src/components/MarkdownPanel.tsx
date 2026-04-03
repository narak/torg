import React from 'react';
import { C, LEVEL_COLORS, hexToRgba } from '../theme';

interface MarkdownPanelProps {
  markdownText: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export function MarkdownPanel({ markdownText, copied, onCopy, onClose }: MarkdownPanelProps) {
  return (
    <div style={{ width: '42%', flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: `1px solid ${C.border}`, backgroundColor: C.bgAlt, overflow: 'hidden' }}>
      <div style={{ padding: '5px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ color: C.cyan, fontSize: '13px' }}>Markdown Export</span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <span
            onClick={onCopy}
            style={{ color: copied ? C.green : C.dimBright, cursor: 'pointer', padding: '1px 6px',
              border: `1px solid ${copied ? C.green : C.border}`, borderRadius: '2px' }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </span>
          <span
            onClick={onClose}
            style={{ color: C.dimBright, cursor: 'pointer', padding: '1px 6px',
              border: `1px solid ${C.border}`, borderRadius: '2px' }}
          >
            ✕
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {markdownText.split('\n').map((line, i) => {
          const hm = line.match(/^(#{1,6})\s(.*)$/);
          if (hm) {
            const lvl = hm[1].length;
            const lc  = LEVEL_COLORS[(lvl - 1) % LEVEL_COLORS.length];
            return (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6', marginBottom: lvl <= 2 ? '2px' : '0' }}>
                <span style={{ color: hexToRgba(lc, 0.5) }}>{hm[1]}</span>
                <span> </span>
                <span style={{ color: lc }}>{hm[2]}</span>
              </div>
            );
          }
          if (line === '') return <div key={i} style={{ height: '8px' }} />;
          return (
            <div key={i} style={{ color: C.fg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
              {line}
            </div>
          );
        })}
        <div style={{ height: '24px' }} />
      </div>
    </div>
  );
}
