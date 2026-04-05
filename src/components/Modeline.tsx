import React from 'react';
import { C } from '../theme';

interface ModelineProps {
    message: string;
    cmdBuf: string;
    tagsEditId: string | null;
    tagsEditValue: string;
    allTags: string[];
    tagsRef: React.RefObject<HTMLInputElement | null>;
    onTagsChange: (v: string) => void;
    onConfirmTagEdit: () => void;
    onCancelTagEdit: () => void;
}

const HINTS: { key: string; label: string }[] = [
    { key: '/', label: 'search' },
    { key: 'j/k', label: 'nav' },
    { key: 'h/l', label: 'tree' },
    { key: 'gg/G', label: 'top/bot' },
    { key: 'Enter', label: 'edit' },
    { key: 't', label: 'todo' },
    { key: 'p', label: 'priority' },
    { key: ':', label: 'tags' },
    { key: 'o/O', label: 'new' },
    { key: 'dd', label: 'kill' },
    { key: '</>', label: 'indent' },
    { key: 'f', label: 'fold' },
    { key: 'M', label: 'markdown' },
    { key: 'I', label: 'meta' },
    { key: '?', label: 'help' },
];

interface TagsEditInputProps {
    tagsEditValue: string;
    allTags: string[];
    tagsRef: React.RefObject<HTMLInputElement | null>;
    onTagsChange: (v: string) => void;
    onConfirmTagEdit: () => void;
    onCancelTagEdit: () => void;
}

function TagsEditInput({
    tagsEditValue,
    allTags,
    tagsRef,
    onTagsChange,
    onConfirmTagEdit,
    onCancelTagEdit,
}: TagsEditInputProps) {
    return (
        <>
            <span style={{ color: C.green, flexShrink: 0 }}>Tags:</span>
            <input
                ref={tagsRef}
                value={tagsEditValue}
                onChange={(e) => onTagsChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        onConfirmTagEdit();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onCancelTagEdit();
                    }
                }}
                placeholder="tag1 tag2 tag3 …"
                style={{
                    background: 'transparent',
                    color: C.green,
                    border: 'none',
                    outline: 'none',
                    borderBottom: `1px solid ${C.green}`,
                    fontSize: '12px',
                    flex: 1,
                    padding: 0,
                }}
            />
            {allTags.length > 0 && (
                <span style={{ color: C.dim, flexShrink: 0, fontSize: '11px' }}>
                    existing:{' '}
                    {allTags.slice(0, 8).map((t) => (
                        <span
                            key={t}
                            style={{ color: C.dimBright, cursor: 'pointer', marginLeft: '4px' }}
                            onClick={() => {
                                const cur = tagsEditValue.trim();
                                const already = cur.split(/\s+/).includes(t);
                                if (!already) onTagsChange(cur ? `${cur} ${t}` : t);
                            }}
                        >
                            :{t}:
                        </span>
                    ))}
                </span>
            )}
            <span style={{ color: C.dim, flexShrink: 0, fontSize: '11px' }}>
                Enter=confirm Esc=cancel
            </span>
        </>
    );
}

interface HintBarProps {
    message: string;
    cmdBuf: string;
}

function HintBar({ message, cmdBuf }: HintBarProps) {
    return (
        <>
            <span
                style={{
                    color: cmdBuf ? C.yellow : C.dim,
                    fontSize: '12px',
                    minWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {message || '\u00a0'}
            </span>
            <span style={{ color: C.border, flexShrink: 0 }}>│</span>
            <span
                style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '11px',
                }}
            >
                {HINTS.map(({ key, label }) => (
                    <span key={key} style={{ flexShrink: 0, color: C.dim, whiteSpace: 'nowrap' }}>
                        <span style={{ color: C.yellow }}>{key}</span> {label}
                    </span>
                ))}
            </span>
        </>
    );
}

export function Modeline({
    message,
    cmdBuf,
    tagsEditId,
    tagsEditValue,
    allTags,
    tagsRef,
    onTagsChange,
    onConfirmTagEdit,
    onCancelTagEdit,
}: ModelineProps) {
    return (
        <div
            style={{
                backgroundColor: C.modelineBg,
                borderTop: `1px solid ${C.border}`,
                flexShrink: 0,
                fontSize: '13px',
            }}
        >
            <div
                style={{
                    backgroundColor: C.bgAlt,
                    padding: '2px 14px',
                    fontSize: '12px',
                    minHeight: '20px',
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                {tagsEditId ? (
                    <TagsEditInput
                        tagsEditValue={tagsEditValue}
                        allTags={allTags}
                        tagsRef={tagsRef}
                        onTagsChange={onTagsChange}
                        onConfirmTagEdit={onConfirmTagEdit}
                        onCancelTagEdit={onCancelTagEdit}
                    />
                ) : (
                    <HintBar message={message} cmdBuf={cmdBuf} />
                )}
            </div>
        </div>
    );
}
