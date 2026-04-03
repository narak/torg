import React from 'react';
import type { FilterState, TodoState } from '../types';
import { C, STATE_COLORS } from '../theme';

interface FilterBarProps {
  filter: FilterState;
  allTags: string[];
  matchCount: number;
  totalCount: number;
  onFilterChange: (f: FilterState) => void;
  onClose: () => void;
}

const STATES: NonNullable<TodoState>[] = ['TODO', 'DOING', 'WAITING', 'DONE'];
const DATE_PRESETS: { label: string; value: NonNullable<FilterState['datePreset']> }[] = [
  { label: 'Today',      value: 'today' },
  { label: 'This week',  value: 'week'  },
  { label: 'This month', value: 'month' },
];

export function FilterBar({ filter, allTags, matchCount, totalCount, onFilterChange, onClose }: FilterBarProps) {
  const hasActive = filter.states.length > 0 || filter.tags.length > 0 || filter.datePreset !== null;

  const toggleState = (s: NonNullable<TodoState>) => {
    const next = filter.states.includes(s)
      ? filter.states.filter(x => x !== s)
      : [...filter.states, s];
    onFilterChange({ ...filter, states: next });
  };

  const toggleTag = (t: string) => {
    const next = filter.tags.includes(t)
      ? filter.tags.filter(x => x !== t)
      : [...filter.tags, t];
    onFilterChange({ ...filter, tags: next });
  };

  const toggleDate = (v: NonNullable<FilterState['datePreset']>) => {
    onFilterChange({ ...filter, datePreset: filter.datePreset === v ? null : v });
  };

  const pill = (active: boolean, color: string, label: string, onClick: () => void) => (
    <span
      key={label}
      onClick={onClick}
      style={{
        cursor: 'pointer', padding: '1px 8px', borderRadius: '3px', fontSize: '12px',
        border: `1px solid ${active ? color : C.border}`,
        color: active ? color : C.dimBright,
        backgroundColor: active ? `${color}18` : 'transparent',
      }}
    >
      {label}
    </span>
  );

  return (
    <div style={{ backgroundColor: C.bgAlt, borderBottom: `1px solid ${C.border}`,
      flexShrink: 0, padding: '5px 14px', display: 'flex', alignItems: 'center',
      gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>

      {/* State filters */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <span style={{ color: C.dim, marginRight: '2px' }}>state</span>
        {STATES.map(s => pill(filter.states.includes(s), STATE_COLORS[s], s, () => toggleState(s)))}
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ color: C.dim, marginRight: '2px' }}>tag</span>
          {allTags.map(t => pill(filter.tags.includes(t), C.green, `:${t}:`, () => toggleTag(t)))}
        </div>
      )}

      {/* Date filters */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <span style={{ color: C.dim, marginRight: '2px' }}>added</span>
        {DATE_PRESETS.map(({ label, value }) =>
          pill(filter.datePreset === value, C.cyan, label, () => toggleDate(value))
        )}
      </div>

      {/* Match count + clear */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {hasActive && (
          <span style={{ color: C.dimBright }}>
            <span style={{ color: C.yellow }}>{matchCount}</span>/{totalCount} match
          </span>
        )}
        {hasActive && (
          <span
            onClick={() => onFilterChange({ states: [], tags: [], datePreset: null })}
            style={{ color: C.red, cursor: 'pointer' }}
          >
            clear
          </span>
        )}
        <span onClick={onClose} style={{ color: C.dimBright, cursor: 'pointer' }}>✕</span>
      </div>
    </div>
  );
}
