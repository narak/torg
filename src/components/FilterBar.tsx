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
    focused?: boolean;
    focusIdx?: number;
}

const STATES: NonNullable<TodoState>[] = ['TODO', 'DOING', 'WAITING', 'DONE'];
const DATE_PRESETS: { label: string; value: NonNullable<FilterState['datePreset']> }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
];

interface FilterPillProps {
    active: boolean;
    color: string;
    label: string;
    onClick: () => void;
    focused?: boolean;
}

function FilterPill({ active, color, label, onClick, focused }: FilterPillProps) {
    return (
        <span
            onClick={onClick}
            style={{
                cursor: 'pointer',
                padding: '1px 8px',
                borderRadius: '3px',
                fontSize: '12px',
                border: `1px solid ${active ? color : C.border}`,
                color: active ? color : C.dimBright,
                backgroundColor: active ? `${color}18` : 'transparent',
                outline: focused ? `1px solid ${color}` : 'none',
                outlineOffset: '2px',
            }}
        >
            {label}
        </span>
    );
}

export function FilterBar({
    filter,
    allTags,
    matchCount,
    totalCount,
    onFilterChange,
    onClose,
    focused = false,
    focusIdx = 0,
}: FilterBarProps) {
    const hasActive =
        filter.states.length > 0 || filter.tags.length > 0 || filter.datePreset !== null;

    const toggleState = (s: NonNullable<TodoState>) => {
        const next = filter.states.includes(s)
            ? filter.states.filter((x) => x !== s)
            : [...filter.states, s];
        onFilterChange({ ...filter, states: next });
    };

    const toggleTag = (t: string) => {
        const next = filter.tags.includes(t)
            ? filter.tags.filter((x) => x !== t)
            : [...filter.tags, t];
        onFilterChange({ ...filter, tags: next });
    };

    const toggleDate = (v: NonNullable<FilterState['datePreset']>) => {
        onFilterChange({ ...filter, datePreset: filter.datePreset === v ? null : v });
    };

    // Pill indices: STATES(0-3), allTags(4..3+N), DATE_PRESETS(4+N..6+N)
    const tagOffset = STATES.length;
    const dateOffset = tagOffset + allTags.length;

    return (
        <div
            style={{
                backgroundColor: C.bgAlt,
                borderBottom: focused ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                flexShrink: 0,
                padding: '5px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '12px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '5px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                }}
            >
                {/* State filters */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ color: C.dim, marginRight: '2px' }}>state</span>
                    {STATES.map((s, i) => (
                        <FilterPill
                            key={s}
                            active={filter.states.includes(s)}
                            color={STATE_COLORS[s]}
                            label={s}
                            onClick={() => toggleState(s)}
                            focused={focused && focusIdx === i}
                        />
                    ))}
                </div>

                {/* Tag filters */}
                {allTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{ color: C.dim, marginRight: '2px' }}>tag</span>
                        {allTags.map((t, i) => (
                            <FilterPill
                                key={t}
                                active={filter.tags.includes(t)}
                                color={C.green}
                                label={`:${t}:`}
                                onClick={() => toggleTag(t)}
                                focused={focused && focusIdx === tagOffset + i}
                            />
                        ))}
                    </div>
                )}

                {/* Date filters */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ color: C.dim, marginRight: '2px' }}>added</span>
                    {DATE_PRESETS.map(({ label, value }, i) => (
                        <FilterPill
                            key={value}
                            active={filter.datePreset === value}
                            color={C.cyan}
                            label={label}
                            onClick={() => toggleDate(value)}
                            focused={focused && focusIdx === dateOffset + i}
                        />
                    ))}
                </div>
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
                <span onClick={onClose} style={{ color: C.dimBright, cursor: 'pointer' }}>
                    ✕
                </span>
            </div>
        </div>
    );
}
