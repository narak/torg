import React, { useState, useEffect, useRef, useMemo } from 'react';
import Fuse, { type FuseResult, type RangeTuple } from 'fuse.js';
import type { OrgNode } from '../types';
import { C, FONT } from '../theme';

interface SearchOverlayProps {
    nodes: OrgNode[];
    query: string;
    onQueryChange: (q: string) => void;
    onSelect: (id: string) => void;
    onClose: () => void;
}

function mergeRanges(indices: readonly RangeTuple[]): RangeTuple[] {
    const sorted = [...indices].sort((a, b) => a[0] - b[0]);
    const merged: RangeTuple[] = [];
    for (const [s, e] of sorted) {
        const last = merged[merged.length - 1];
        if (last && s <= last[1] + 1) {
            last[1] = Math.max(last[1], e);
        } else merged.push([s, e]);
    }
    return merged;
}

function highlight(text: string, indices: readonly RangeTuple[] | undefined) {
    if (!indices || indices.length === 0) return <>{text}</>;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const [start, end] of mergeRanges(indices)) {
        if (start > last) parts.push(text.slice(last, start));
        parts.push(
            <span
                key={start}
                style={{ textDecoration: 'underline', textDecorationColor: C.yellow, color: C.fg }}
            >
                {text.slice(start, end + 1)}
            </span>,
        );
        last = end + 1;
    }
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts}</>;
}

function getIndices(result: FuseResult<OrgNode>, key: string, refIndex?: number) {
    const match = result.matches?.find(
        (m) => m.key === key && (refIndex === undefined || m.refIndex === refIndex),
    );
    return match?.indices;
}

function stateColor(state: NonNullable<OrgNode['state']>): string {
    if (state === 'DONE') return C.green;
    if (state === 'DOING') return C.yellow;
    if (state === 'WAITING') return C.violet;
    return C.red;
}

interface SearchResultItemProps {
    result: FuseResult<OrgNode>;
    isCursor: boolean;
    onSelect: () => void;
}

function SearchResultItem({ result, isCursor, onSelect }: SearchResultItemProps) {
    const node = result.item;
    return (
        <div
            onClick={onSelect}
            style={{
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backgroundColor: isCursor ? C.modelineBg : 'transparent',
                borderLeft: isCursor ? `2px solid ${C.blue}` : '2px solid transparent',
            }}
        >
            {'  '.repeat(node.level - 1)}
            {node.state && (
                <span style={{ fontSize: '11px', flexShrink: 0, color: stateColor(node.state) }}>
                    {highlight(node.state, getIndices(result, 'state'))}
                </span>
            )}
            <span
                style={{
                    color: C.fg,
                    fontSize: '13px',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {highlight(node.title || '(untitled)', getIndices(result, 'title'))}
            </span>
            {node.tags.length > 0 && (
                <span style={{ color: C.dim, fontSize: '11px', flexShrink: 0 }}>
                    {node.tags.map((t, ti) => (
                        <span key={t}>
                            {ti === 0 ? ':' : ''}
                            {highlight(t, getIndices(result, 'tags', ti))}:
                        </span>
                    ))}
                </span>
            )}
        </div>
    );
}

export function SearchOverlay({
    nodes,
    query,
    onQueryChange,
    onSelect,
    onClose,
}: SearchOverlayProps) {
    const [cursor, setCursor] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const fuse = useMemo(
        () =>
            new Fuse(nodes, {
                keys: ['title', 'state', 'tags'],
                threshold: 0.5,
                includeScore: true,
                includeMatches: true,
                ignoreLocation: true,
            }),
        [nodes],
    );

    const results: FuseResult<OrgNode>[] = useMemo(() => {
        if (!query.trim()) return nodes.slice(0, 30).map((item) => ({ item, refIndex: 0 }));
        const seen = new Map<string, FuseResult<OrgNode>>();
        for (const r of fuse.search(query)) {
            const existing = seen.get(r.item.id);
            if (!existing) {
                seen.set(r.item.id, { ...r, matches: [...(r.matches ?? [])] });
            } else {
                // Merge matches from duplicate entries so all highlights are kept
                existing.matches = [...(existing.matches ?? []), ...(r.matches ?? [])];
                if (
                    r.score !== undefined &&
                    (existing.score === undefined || r.score < existing.score)
                ) {
                    existing.score = r.score;
                }
            }
        }
        return Array.from(seen.values());
    }, [fuse, query, nodes]);

    useEffect(() => {
        setCursor(0);
    }, [query]);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.focus();
        input.select();
    }, []);

    useEffect(() => {
        const el = listRef.current?.children[cursor] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [cursor]);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const hit = results[cursor];
            if (hit) {
                onSelect(hit.item.id);
                onClose();
            }
            return;
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 300,
                paddingTop: '12vh',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: C.bgAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px',
                    width: '560px',
                    maxWidth: '92vw',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderBottom: `1px solid ${C.border}`,
                    }}
                >
                    <span style={{ color: C.dim, fontSize: '13px', flexShrink: 0 }}>Search:</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="title, tag, state…"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: C.fg,
                            fontSize: '13px',
                            padding: 0,
                        }}
                    />
                    {results.length > 0 && (
                        <span style={{ color: C.dim, fontSize: '11px', flexShrink: 0 }}>
                            {results.length}
                        </span>
                    )}
                </div>
                <div ref={listRef} style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {results.length === 0 ? (
                        <div style={{ padding: '12px 14px', color: C.dim, fontSize: '13px' }}>
                            No matches
                        </div>
                    ) : (
                        results.map((result, i) => (
                            <SearchResultItem
                                key={result.item.id}
                                result={result}
                                isCursor={i === cursor}
                                onSelect={() => {
                                    onSelect(result.item.id);
                                    onClose();
                                }}
                            />
                        ))
                    )}
                </div>
                <div
                    style={{
                        padding: '4px 14px',
                        borderTop: `1px solid ${C.border}`,
                        fontSize: '11px',
                        color: C.dim,
                        display: 'flex',
                        gap: '12px',
                    }}
                >
                    <span>↑↓ navigate</span>
                    <span>Enter select</span>
                    <span>Esc close</span>
                </div>
            </div>
        </div>
    );
}
