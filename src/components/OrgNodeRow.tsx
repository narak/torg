import React from 'react';
import type { OrgNode, GuideInfo, TodoState } from '../types';
import {
    C,
    LEVEL_COLORS,
    STATE_COLORS,
    STATE_LABELS,
    PRIORITY_COLORS,
    SEVERITY_COLORS,
    FONT,
    hexToRgba,
} from '../theme';
import { nodeHasChildren } from '../lib/tree';

interface OrgNodeRowProps {
    node: OrgNode;
    nodes: OrgNode[];
    isSel: boolean;
    isEdit: boolean;
    editValue: string;
    guideInfo: GuideInfo;
    selectedRef?: React.RefObject<HTMLDivElement | null>;
    editRef: React.RefObject<HTMLInputElement | null>;
    onSelect: () => void;
    onDoubleClick: () => void;
    onEditChange: (v: string) => void;
    onConfirmEdit: () => void;
    onCancelEdit: () => void;
    onToggleCollapse: () => void;
    onOpenTagEdit: () => void;
    editingId: string | null;
    showMeta: boolean;
    shiftHeld: boolean;
    isMatch: boolean | null;
}

// State icons used as bullet indicators
function IconCircle() {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
}
function IconCircleDot() {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </svg>
    );
}
function IconClock() {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function IconCircleCheck() {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}

const STATE_BULLET: Record<NonNullable<TodoState>, React.ReactElement> = {
    TODO: <IconCircle />,
    DOING: <IconCircleDot />,
    WAITING: <IconClock />,
    DONE: <IconCircleCheck />,
};

function IndentGuides({ guides }: { guides: boolean[] }) {
    return (
        <>
            {guides.map((active, l) => (
                <span
                    key={l}
                    style={{
                        display: 'inline-block',
                        width: '16px',
                        flexShrink: 0,
                        color: active
                            ? hexToRgba(LEVEL_COLORS[l % LEVEL_COLORS.length], 0.35)
                            : 'transparent',
                        textAlign: 'left',
                    }}
                >
                    │
                </span>
            ))}
        </>
    );
}

interface TagsCellProps {
    tags: string[];
    isSel: boolean;
    editingId: string | null;
    onOpenTagEdit: () => void;
}

function TagsCell({ tags, isSel, editingId, onOpenTagEdit }: TagsCellProps) {
    if (tags.length > 0) {
        return (
            <span
                style={{ color: C.green, flexShrink: 0, marginLeft: 'auto', cursor: 'pointer' }}
                title="Click or press : to edit tags"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenTagEdit();
                }}
            >
                :{tags.join(':')}:
            </span>
        );
    }
    if (isSel && !editingId) {
        return (
            <span
                style={{
                    color: C.dim,
                    flexShrink: 0,
                    marginLeft: 'auto',
                    paddingRight: '16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                }}
                title="Press : to add tags"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenTagEdit();
                }}
            >
                :…:
            </span>
        );
    }
    return null;
}

export function OrgNodeRow({
    node,
    nodes,
    isSel,
    isEdit,
    editValue,
    guideInfo,
    selectedRef,
    editRef,
    onSelect,
    onDoubleClick,
    onEditChange,
    onConfirmEdit,
    onCancelEdit,
    onToggleCollapse,
    onOpenTagEdit,
    editingId,
    showMeta,
    shiftHeld,
    isMatch,
}: OrgNodeRowProps) {
    const { guides, isLastSibling } = guideInfo;
    const lc = LEVEL_COLORS[(node.level - 1) % LEVEL_COLORS.length];
    const hasKids = nodeHasChildren(nodes, node.id);
    const isDone = node.state === 'DONE';

    // Font weight driven by highest urgency across P and S (0=heaviest, 3=lightest)
    const P_WEIGHT: Record<NonNullable<typeof node.priority>, number> = { P0: 800, P1: 700, P2: 600, P3: 500 };
    const S_WEIGHT: Record<NonNullable<typeof node.severity>, number> = { S0: 800, S1: 700, S2: 600, S3: 500 };
    const titleWeight = Math.max(
        node.priority ? P_WEIGHT[node.priority] : 400,
        node.severity ? S_WEIGHT[node.severity] : 400,
    );

    // Bullet: state icon if state exists, else fold/plain indicator
    const bullet = node.state ? (
        <span style={{ color: STATE_COLORS[node.state], display: 'flex', alignItems: 'center' }}>
            {STATE_BULLET[node.state]}
        </span>
    ) : (
        <span style={{ color: lc }}>{hasKids ? (node.collapsed ? '▸' : '▾') : '○'}</span>
    );

    return (
        <div
            ref={selectedRef}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick();
            }}
            style={{
                display: 'flex',
                alignItems: 'stretch',
                minHeight: '22px',
                backgroundColor: isSel ? C.bgSelected : 'transparent',
                borderLeft: isSel
                    ? `3px solid ${C.cursor}`
                    : isMatch === true
                      ? `3px solid ${C.green}`
                      : '3px solid transparent',
                opacity: isMatch === false && !isSel ? 0.4 : 1,
                cursor: 'default',
            }}
        >
            {/* Left gutter: state text + P badge + S badge */}
            <div
                style={{
                    width: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 6px',
                    // justifyContent: 'flex-end',
                    fontSize: '10px',
                    fontWeight: 'bold',
                }}
            >
                <span style={{ color: PRIORITY_COLORS[node.priority], minWidth: '12px' }}>
                    {node.priority || ''}
                </span>
                <span style={{ color: SEVERITY_COLORS[node.severity], minWidth: '12px' }}>
                    {node.severity || ''}
                </span>
                {node.state && (
                    <span
                        style={{
                            color: STATE_COLORS[node.state],
                            letterSpacing: '0.3px',
                            textAlign: 'right',
                        }}
                    >
                        {STATE_LABELS[node.state]}
                    </span>
                )}
            </div>

            {/* Main content */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    padding: '1px 0',
                    paddingRight: '14px',
                    minWidth: 0,
                }}
            >
                <IndentGuides guides={guides} />

                {/* Connector (level ≥ 2) */}
                {node.level >= 2 && (
                    <span
                        style={{ color: hexToRgba(lc, 0.5), flexShrink: 0, alignSelf: 'baseline' }}
                    >
                        {isLastSibling ? '└─' : '├─'}
                    </span>
                )}

                {/* Bullet / state icon */}
                <span
                    style={{
                        flexShrink: 0,
                        marginLeft: node.level >= 2 ? '4px' : '2px',
                        marginRight: '5px',
                        cursor: hasKids ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    onClick={(e) => {
                        if (!hasKids) return;
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                >
                    {bullet}
                </span>

                {/* Title or edit input */}
                {isEdit ? (
                    <input
                        ref={editRef}
                        value={editValue}
                        onChange={(e) => onEditChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onConfirmEdit();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                onCancelEdit();
                            }
                        }}
                        style={{
                            background: 'transparent',
                            color: isDone ? C.dim : lc,
                            outline: 'none',
                            border: 'none',
                            borderBottom: `1px solid ${C.cursor}`,
                            fontFamily: FONT,
                            fontSize: '14px',
                            lineHeight: '1.55',
                            flex: 1,
                            padding: 0,
                            minWidth: '160px',
                        }}
                        placeholder="Heading title…"
                    />
                ) : (
                    <span
                        style={{
                            color: isDone ? C.dim : node.level === 1 ? lc : C.fg,
                            textDecoration: isDone ? 'line-through' : 'none',
                            fontWeight: titleWeight,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            alignSelf: 'baseline',
                        }}
                    >
                        {node.title || (
                            <span style={{ color: C.dim, fontStyle: 'italic' }}>untitled</span>
                        )}
                    </span>
                )}

                {/* Collapsed indicator */}
                {!isEdit && hasKids && node.collapsed && (
                    <span
                        style={{
                            color: C.dim,
                            flexShrink: 0,
                            marginLeft: '6px',
                            alignSelf: 'baseline',
                        }}
                    >
                        …
                    </span>
                )}

                {/* Metadata annotation */}
                {!isEdit && (showMeta || (shiftHeld && isSel)) && node.createdAt && (
                    <span
                        style={{
                            color: C.dimBright,
                            flexShrink: 0,
                            marginLeft: '10px',
                            fontStyle: 'italic',
                            alignSelf: 'baseline',
                        }}
                    >
                        {new Date(node.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                )}

                {!isEdit && (
                    <TagsCell
                        tags={node.tags}
                        isSel={isSel}
                        editingId={editingId}
                        onOpenTagEdit={onOpenTagEdit}
                    />
                )}
            </div>
        </div>
    );
}
