import React from 'react';
import type { OrgNode } from '../types';
import { C } from '../theme';

interface TopbarProps {
    selNode: OrgNode | undefined;
    selIdx: number;
    visibleCount: number;
    stats: { todo: number; doing: number; waiting: number; done: number };
}

export function Topbar({ selNode, selIdx, visibleCount, stats }: TopbarProps) {
    return (
        <div
            style={{
                backgroundColor: C.bgAlt,
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                padding: '5px 16px',
                gap: '0',
            }}
        >
            {/* Buffer label */}
            <span
                style={{
                    backgroundColor: C.blue,
                    color: C.bgAlt,
                    padding: '0 6px',
                    borderRadius: '2px',
                    flexShrink: 0,
                }}
            >
                Org
            </span>
            <span style={{ color: C.blue, marginLeft: '8px' }}>TASKS.org</span>

            {/* Position */}
            {selNode && (
                <>
                    <span style={{ color: C.border }}>&nbsp;&nbsp;│&nbsp;&nbsp;</span>
                    <span style={{ color: C.dimBright }}>
                        L{selNode.level} · {selIdx + 1}/{visibleCount}
                    </span>
                </>
            )}

            {/* Stats */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: C.red }}>TODO:{stats.todo}</span>
                <span style={{ color: C.yellow }}>DOING:{stats.doing}</span>
                <span style={{ color: C.violet }}>WAIT:{stats.waiting}</span>
                <span style={{ color: C.green }}>DONE:{stats.done}</span>
            </div>
        </div>
    );
}
