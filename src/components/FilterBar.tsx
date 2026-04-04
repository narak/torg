import React from 'react';
import type { FilterState, TodoState, Priority, Severity } from '../types';
import { C, STATE_COLORS, PRIORITY_COLORS, SEVERITY_COLORS } from '../theme';

interface FilterBarProps {
    filter: FilterState;
    allTags: string[];
    matchCount: number;
    totalCount: number;
    onFilterChange: (f: FilterState) => void;
    focused?: boolean;
    focusIdx?: number;
}

const STATES: NonNullable<TodoState>[] = ['TODO', 'DOING', 'WAITING', 'DONE'];
const PRIORITIES: NonNullable<Priority>[] = ['P0', 'P1', 'P2', 'P3'];
const SEVERITIES: NonNullable<Severity>[] = ['S0', 'S1', 'S2', 'S3'];
const DATE_PRESETS: { label: string; value: NonNullable<FilterState['datePreset']> }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
];

// Pill index layout:
//   0-3:  STATES
//   4-7:  PRIORITIES (P0-P3)
//   8-11: SEVERITIES (S0-S3)
//   12..12+N-1: TAGS
//   12+N..14+N: DATE_PRESETS
const STATE_OFFSET = 0;
const PRIORITY_OFFSET = 4;
const SEVERITY_OFFSET = 8;
const TAG_OFFSET = 12;

function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

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

function GroupLabel({ label, active }: { label: string; active: boolean }) {
    return (
        <span
            style={{
                color: active ? C.blue : C.dim,
                fontWeight: active ? 'bold' : 'normal',
                minWidth: '52px',
                display: 'inline-block',
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
    focused = false,
    focusIdx = 0,
}: FilterBarProps) {
    const hasActive =
        filter.states.length > 0 ||
        filter.priorities.length > 0 ||
        filter.severities.length > 0 ||
        filter.tags.length > 0 ||
        filter.datePreset !== null;

    const dateOffset = TAG_OFFSET + allTags.length;

    const focusedGroup = focused
        ? focusIdx < PRIORITY_OFFSET
            ? 0
            : focusIdx < SEVERITY_OFFSET
              ? 1
              : focusIdx < TAG_OFFSET
                ? 2
                : focusIdx < dateOffset
                  ? 3
                  : 4
        : -1;

    return (
        <div
            style={{
                backgroundColor: C.bgAlt,
                borderBottom: focused ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                flexShrink: 0,
                padding: '5px 14px',
                display: 'flex',
                alignItems: 'flex-start',
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
                    flex: 1,
                    minWidth: 0,
                }}
            >
                {/* State */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <GroupLabel label="state" active={focusedGroup === 0} />
                    {STATES.map((s, i) => (
                        <FilterPill
                            key={s}
                            active={filter.states.includes(s)}
                            color={STATE_COLORS[s]}
                            label={s}
                            onClick={() => onFilterChange({ ...filter, states: toggle(filter.states, s) })}
                            focused={focused && focusIdx === STATE_OFFSET + i}
                        />
                    ))}
                </div>

                {/* Priority */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <GroupLabel label="priority" active={focusedGroup === 1} />
                    {PRIORITIES.map((p, i) => (
                        <FilterPill
                            key={p}
                            active={filter.priorities.includes(p)}
                            color={PRIORITY_COLORS[p]}
                            label={p}
                            onClick={() => onFilterChange({ ...filter, priorities: toggle(filter.priorities, p) })}
                            focused={focused && focusIdx === PRIORITY_OFFSET + i}
                        />
                    ))}
                </div>

                {/* Severity */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <GroupLabel label="severity" active={focusedGroup === 2} />
                    {SEVERITIES.map((s, i) => (
                        <FilterPill
                            key={s}
                            active={filter.severities.includes(s)}
                            color={SEVERITY_COLORS[s]}
                            label={s}
                            onClick={() => onFilterChange({ ...filter, severities: toggle(filter.severities, s) })}
                            focused={focused && focusIdx === SEVERITY_OFFSET + i}
                        />
                    ))}
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <GroupLabel label="tag" active={focusedGroup === 3} />
                        {allTags.map((t, i) => (
                            <FilterPill
                                key={t}
                                active={filter.tags.includes(t)}
                                color={C.green}
                                label={`:${t}:`}
                                onClick={() => onFilterChange({ ...filter, tags: toggle(filter.tags, t) })}
                                focused={focused && focusIdx === TAG_OFFSET + i}
                            />
                        ))}
                    </div>
                )}

                {/* Date */}
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <GroupLabel label="added" active={focusedGroup === 4} />
                    {DATE_PRESETS.map(({ label, value }, i) => (
                        <FilterPill
                            key={value}
                            active={filter.datePreset === value}
                            color={C.cyan}
                            label={label}
                            onClick={() =>
                                onFilterChange({
                                    ...filter,
                                    datePreset: filter.datePreset === value ? null : value,
                                })
                            }
                            focused={focused && focusIdx === dateOffset + i}
                        />
                    ))}
                </div>
            </div>

            {/* Match count + clear + hint */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '3px', flexShrink: 0 }}>
                {hasActive && (
                    <span style={{ color: C.dimBright }}>
                        <span style={{ color: C.yellow }}>{matchCount}</span>/{totalCount}
                    </span>
                )}
                {hasActive && (
                    <span
                        onClick={() =>
                            onFilterChange({
                                states: [],
                                priorities: [],
                                severities: [],
                                tags: [],
                                datePreset: null,
                                hideDone: filter.hideDone,
                            })
                        }
                        style={{ color: C.red, cursor: 'pointer' }}
                        title="c to clear"
                    >
                        clear
                    </span>
                )}
                {focused && (
                    <span style={{ color: C.dim, fontSize: '11px' }}>
                        \:group · h/l:pill · Space:toggle · c:clear · Esc/Enter:exit
                    </span>
                )}
            </div>
        </div>
    );
}
