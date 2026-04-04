import type { OrgNode } from './types';

export const genId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function d(iso: string) {
    return new Date(iso).getTime();
}

export const INITIAL_NODES: OrgNode[] = [
    {
        id: 'n1',
        level: 1,
        title: 'Work',
        state: null,
        tags: ['work'],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-03T09:00'),
    },
    {
        id: 'n15',
        level: 1,
        title: 'Personal',
        state: null,
        tags: ['personal'],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-03T09:05'),
    },
    {
        id: 'n16',
        level: 2,
        title: 'Health & Fitness',
        state: null,
        tags: [],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-04T07:30'),
    },
    {
        id: 'n20',
        level: 2,
        title: 'Learning',
        state: null,
        tags: ['learn'],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-06T20:00'),
    },
    {
        id: 'n25',
        level: 2,
        title: 'Side Projects',
        state: null,
        tags: [],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-10T22:00'),
    },
    {
        id: 'n28',
        level: 1,
        title: 'Home',
        state: null,
        tags: ['home'],
        collapsed: false,
        priority: null,
        severity: null,
        createdAt: d('2026-01-03T09:10'),
    },
];
