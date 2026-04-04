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

function getTabLabel(tab: string, tabMode: TabBarProps['tabMode'], nodes: OrgNode[]): string {
    if (tabMode === 'tag') return `:${tab}:`;
    return nodes.find((n) => n.id === tab)?.title ?? tab;
}

interface ModeLabelProps {
    tabMode: TabBarProps['tabMode'];
    focused: boolean;
}

function ModeLabel({ tabMode, focused }: ModeLabelProps) {
    return (
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
            {focused ? '› ' : ''}by {tabMode}
        </span>
    );
}

interface TabItemProps {
    tab: string;
    label: string;
    isActive: boolean;
    focused: boolean;
    onSelect: () => void;
}

function TabItem({ tab, label, isActive, focused, onSelect }: TabItemProps) {
    return (
        <span
            key={tab}
            onClick={onSelect}
            style={{
                padding: '5px 14px',
                cursor: 'pointer',
                flexShrink: 0,
                color: isActive ? C.fg : C.dimBright,
                borderRight: `1px solid ${C.border}`,
                borderBottom: isActive ? `2px solid ${C.blue}` : '2px solid transparent',
                backgroundColor: isActive ? C.bgSelected : 'transparent',
                outline: focused && isActive ? `1px solid ${C.blue}` : 'none',
                outlineOffset: '-2px',
            }}
        >
            {label}
        </span>
    );
}

function CloseButton({ onClose }: { onClose: () => void }) {
    return (
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
    );
}

export function TabBar({ tabMode, tabList, activeTab, nodes, focused, onTabSelect, onClose }: TabBarProps) {
    const tabBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (focused) tabBarRef.current?.focus();
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
            <ModeLabel tabMode={tabMode} focused={focused} />

            {tabList.map((tab) => (
                <TabItem
                    key={tab}
                    tab={tab}
                    label={getTabLabel(tab, tabMode, nodes)}
                    isActive={tab === activeTab}
                    focused={focused}
                    onSelect={() => onTabSelect(tab)}
                />
            ))}

            <CloseButton onClose={onClose} />
        </div>
    );
}
