import React from 'react';
import type { OrgNode, GuideInfo } from '../types';
import { C, LEVEL_COLORS, STATE_COLORS, PRIORITY_COLORS, FONT, hexToRgba } from '../theme';
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
                onClick={(e) => { e.stopPropagation(); onOpenTagEdit(); }}
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
                onClick={(e) => { e.stopPropagation(); onOpenTagEdit(); }}
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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flex: 1,
                    padding: '1px 0',
                    paddingLeft: '4px',
                    paddingRight: '14px',
                    minWidth: 0,
                }}
            >
                <IndentGuides guides={guides} />

                {/* Connector (level ≥ 2) */}
                {node.level >= 2 && (
                    <span style={{ color: hexToRgba(lc, 0.5), flexShrink: 0 }}>
                        {isLastSibling ? '└─' : '├─'}
                    </span>
                )}

                {/* Fold / bullet indicator */}
                <span
                    style={{
                        color: lc,
                        flexShrink: 0,
                        marginLeft: node.level >= 2 ? '4px' : '2px',
                        marginRight: '5px',
                        cursor: hasKids ? 'pointer' : 'default',
                    }}
                    onClick={(e) => {
                        if (!hasKids) return;
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                >
                    {hasKids ? (node.collapsed ? '▸' : '▾') : '○'}
                </span>

                {/* State keyword */}
                {node.state && (
                    <span
                        style={{
                            color: STATE_COLORS[node.state],
                            flexShrink: 0,
                            marginRight: '6px',
                        }}
                    >
                        {node.state}
                    </span>
                )}

                {/* Priority */}
                {node.priority && (
                    <span
                        style={{
                            color: PRIORITY_COLORS[node.priority],
                            flexShrink: 0,
                            marginRight: '6px',
                        }}
                    >
                        [#{node.priority}]
                    </span>
                )}

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
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {node.title || (
                            <span style={{ color: C.dim, fontStyle: 'italic' }}>untitled</span>
                        )}
                    </span>
                )}

                {/* Collapsed indicator */}
                {!isEdit && hasKids && node.collapsed && (
                    <span style={{ color: C.dim, flexShrink: 0, marginLeft: '6px' }}>…</span>
                )}

                {/* Metadata annotation */}
                {!isEdit && (showMeta || (shiftHeld && isSel)) && node.createdAt && (
                    <span
                        style={{
                            color: C.dimBright,
                            flexShrink: 0,
                            marginLeft: '10px',
                            fontStyle: 'italic',
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
