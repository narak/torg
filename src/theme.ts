import type { TodoState, Priority } from './types';

export const C = {
    bg: '#282c34',
    bgAlt: '#21242b',
    bgSelected: '#383d49',
    fg: '#bbc2cf',
    dim: '#5b6268',
    dimBright: '#73797e',
    blue: '#51afef',
    magenta: '#c678dd',
    green: '#98be65',
    yellow: '#ecbe7b',
    cyan: '#46d9ff',
    red: '#ff6c6b',
    orange: '#da8548',
    violet: '#a9a1e1',
    cursor: '#528bff',
    modelineBg: '#1c1f24',
    border: '#3f444a',
} as const;

export const LEVEL_COLORS = [C.blue, C.magenta, C.green, C.yellow, C.cyan, C.orange];

export const STATE_COLORS: Record<NonNullable<TodoState>, string> = {
    TODO: C.red,
    DONE: C.dim,
    DOING: C.yellow,
    WAITING: C.violet,
};

export const STATE_ICONS: Record<NonNullable<TodoState>, string> = {
    TODO: '☐',
    DONE: '☑',
    DOING: '◑',
    WAITING: '⏸',
};

export const PRIORITY_COLORS: Record<NonNullable<Priority>, string> = {
    A: C.red,
    B: C.yellow,
    C: C.dimBright,
};

export const FONT = "'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace";

export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
