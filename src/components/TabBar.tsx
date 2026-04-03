import React, { useRef, useEffect } from 'react';
import { C } from '../theme';
import type { OrgNode } from '../types';

interface TabBarProps {
    tabMode: 'none' | 'tag' | 'heading';
    tabList: string[];
    activeTab: string | null;
    nodes: OrgNode[];
    focused: boolean;
    onTabSelect: (tab: string) => void;
    onClose: () => void;
}

export function TabBar({ tabMode, tabList, activeTab, nodes, focused, onTabSelect, onClose }: TabBarProps) {
    const tabBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (focused) {
            tabBarRef.current?.focus();
        }
    }, [focused]);

    return (
        <div
            ref={tabBarRef}
            tabIndex={-1}
            style={{
                backgroundColor: C.bgAlt,
                borderBottom: focused ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                overflowX: 'auto',
                fontSize: '13px',
                outline: 'none',
            }}
        >
            {/* Mode label — highlighted when focused */}
            <span
                style={{
                    color: focused ? C.blue : C.dim,
                    backgroundColor: focused ? C.bgSelected : 'transparent',
                    padding: '0 10px',
                    flexShrink: 0,
                    fontSize: '11px',
                    borderRight: `1px solid ${C.border}`,
                    fontWeight: focused ? 'bold' : 'normal',
                    alignSelf: 'stretch',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {focused ? '›' : ''} by {tabMode}
            </span>

            {/* Tabs */}
            {tabList.map((tab) => {
                const isActive = tab === activeTab;
                return (
                    <span
                        key={tab}
                        onClick={() => onTabSelect(tab)}
                        style={{
                            padding: '5px 14px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            color: isActive ? C.fg : C.dimBright,
                            borderRight: `1px solid ${C.border}`,
                            borderBottom: isActive
                                ? `2px solid ${C.blue}`
                                : '2px solid transparent',
                            backgroundColor: isActive ? C.bgSelected : 'transparent',
                            outline: focused && isActive ? `1px solid ${C.blue}` : 'none',
                            outlineOffset: '-2px',
                        }}
                    >
                        {tabMode === 'tag'
                            ? `:${tab}:`
                            : (nodes.find((n) => n.id === tab)?.title ?? tab)}
                    </span>
                );
            })}

            {/* Close */}
            <span
                onClick={onClose}
                style={{
                    marginLeft: 'auto',
                    padding: '5px 12px',
                    color: C.dimBright,
                    cursor: 'pointer',
                    flexShrink: 0,
                    borderLeft: `1px solid ${C.border}`,
                }}
            >
                ✕
            </span>
        </div>
    );
}
