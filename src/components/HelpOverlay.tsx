import React from 'react';
import { C, FONT } from '../theme';

const HELP: { section?: string; key?: string; desc?: string }[] = [
    { section: 'Navigation' },
    { key: 'j / ↓', desc: 'Line down' },
    { key: 'k / ↑', desc: 'Line up' },
    { key: 'g g', desc: 'Top of buffer' },
    { key: 'G / Shift+g', desc: 'Bottom of buffer' },
    { section: 'Tree Navigation' },
    { key: 'h / ←', desc: 'Collapse if open, else jump to parent' },
    { key: 'l / →', desc: 'Expand + jump to first child' },
    { key: '[ / Ctrl+↑', desc: 'Previous sibling' },
    { key: '] / Ctrl+↓', desc: 'Next sibling' },
    { key: '{', desc: 'First sibling' },
    { key: '}', desc: 'Last sibling' },
    { key: 'u / Ctrl+←', desc: 'Jump to parent heading' },
    { section: 'Editing' },
    { key: 'Enter', desc: 'Edit heading title' },
    { key: 'Esc (in edit)', desc: 'Cancel edit' },
    { key: '< / >', desc: 'Unindent / indent heading (promote/demote)' },
    { key: 'o', desc: 'New sibling below' },
    { key: 'O / Shift+o', desc: 'New sibling above' },
    { key: 'd d', desc: 'Kill heading + subtree' },
    { section: 'States & Tags' },
    { key: 't / Space', desc: 'Cycle TODO state' },
    { key: 'p', desc: 'Cycle priority (P0 → P1 → P2 → P3)' },
    { key: 's', desc: 'Cycle severity (S0 → S1 → S2 → S3)' },
    { key: ':', desc: 'Edit tags for heading' },
    { section: 'Subtree Movement' },
    { key: 'Alt+↑ / Alt+↓', desc: 'Move subtree up / down' },
    { section: 'Search' },
    { key: '/ or ⌘K', desc: 'Open fuzzy search' },
    { key: 'H / Shift+h', desc: 'Toggle hide DONE items' },
    { key: 'w', desc: 'Toggle word wrap (off shows full title in peek bar)' },
    { key: '\\', desc: 'Open / cycle filter group (state → priority → tag → date)' },
    { key: 'c  (filter focused)', desc: 'Clear all active filters' },
    { key: 'T / Shift+t', desc: 'Cycle tab mode (off → by tag → by heading)' },
    { key: 'Esc', desc: 'Focus tab bar (when tabs visible)' },
    { key: 'Enter', desc: 'Focus editor / exit tab bar' },
    { key: 'h / ← or l / →', desc: 'Previous / next tab (when tab bar focused)' },
    { section: 'View' },
    { key: 'f / F', desc: 'Cycle global fold (overview/contents/all)' },
    { key: 'M / Shift+m', desc: 'Toggle markdown export panel' },
    { key: 'I / Shift+i', desc: 'Toggle metadata annotations (created date/time)' },
    { key: '?', desc: 'Toggle this help screen' },
    { key: 'Esc', desc: 'Close overlays / cancel' },
    { section: 'Undo / Redo' },
    { key: 'z', desc: 'Undo (up to 50 steps)' },
    { key: 'Z / Shift+z', desc: 'Redo' },
];

interface HelpOverlayProps {
    onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.78)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                fontFamily: FONT,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: C.bgAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px',
                    padding: '22px 30px',
                    maxWidth: '640px',
                    width: '92vw',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    fontSize: '13px',
                    color: C.fg,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ color: C.blue, fontSize: '14px', marginBottom: '16px' }}>
                    ✦ Org-Mode Keybindings
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '200px 1fr',
                        rowGap: '3px',
                        columnGap: '20px',
                    }}
                >
                    {HELP.map((entry, i) => {
                        if (entry.section)
                            return (
                                <div
                                    key={i}
                                    style={{
                                        gridColumn: '1/-1',
                                        color: C.magenta,
                                        marginTop: i > 0 ? '10px' : '0',
                                        paddingBottom: '2px',
                                        borderBottom: `1px solid ${C.border}`,
                                    }}
                                >
                                    {entry.section}
                                </div>
                            );
                        return (
                            <React.Fragment key={i}>
                                <span style={{ color: C.yellow }}>{entry.key}</span>
                                <span style={{ color: C.dimBright }}>{entry.desc}</span>
                            </React.Fragment>
                        );
                    })}
                </div>
                <div
                    style={{
                        marginTop: '16px',
                        color: C.dim,
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: '8px',
                        fontSize: '11px',
                    }}
                >
                    Click outside or press <span style={{ color: C.yellow }}>?</span> /{' '}
                    <span style={{ color: C.yellow }}>Esc</span> to close
                </div>
            </div>
        </div>
    );
}
