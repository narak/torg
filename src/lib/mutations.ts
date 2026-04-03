import type { OrgNode, TodoState, Priority } from '../types';

export function cycleTodo(state: TodoState): TodoState {
    const cycle: TodoState[] = [null, 'TODO', 'DOING', 'WAITING', 'DONE'];
    return cycle[(cycle.indexOf(state) + 1) % cycle.length];
}

export function cyclePriority(p: Priority): Priority {
    const cycle: Priority[] = [null, 'A', 'B', 'C'];
    return cycle[(cycle.indexOf(p) + 1) % cycle.length];
}

export function demoteSubtree(nodes: OrgNode[], nodeId: string): OrgNode[] {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return nodes;
    const lvl = nodes[idx].level;
    if (lvl >= 6) return nodes;
    let end = idx + 1;
    while (end < nodes.length && nodes[end].level > lvl) end++;
    return nodes.map((n, i) => {
        if (i >= idx && i < end) return { ...n, level: n.level + 1 };
        return n;
    });
}

export function promoteSubtree(nodes: OrgNode[], nodeId: string): OrgNode[] {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return nodes;
    const lvl = nodes[idx].level;
    if (lvl <= 1) return nodes;
    let end = idx + 1;
    while (end < nodes.length && nodes[end].level > lvl) end++;
    return nodes.map((n, i) => {
        if (i >= idx && i < end) return { ...n, level: n.level - 1 };
        return n;
    });
}

export function moveSubtreeDown(nodes: OrgNode[], nodeId: string): OrgNode[] {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return nodes;
    const lvl = nodes[idx].level;
    let end = idx + 1;
    while (end < nodes.length && nodes[end].level > lvl) end++;
    if (end >= nodes.length || nodes[end].level < lvl) return nodes;
    let nextEnd = end + 1;
    while (nextEnd < nodes.length && nodes[nextEnd].level > nodes[end].level) nextEnd++;
    return [
        ...nodes.slice(0, idx),
        ...nodes.slice(end, nextEnd),
        ...nodes.slice(idx, end),
        ...nodes.slice(nextEnd),
    ];
}

export function moveSubtreeUp(nodes: OrgNode[], nodeId: string): OrgNode[] {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx <= 0) return nodes;
    const lvl = nodes[idx].level;
    let prevIdx = idx - 1;
    while (prevIdx >= 0 && nodes[prevIdx].level > lvl) prevIdx--;
    if (prevIdx < 0 || nodes[prevIdx].level < lvl) return nodes;
    let end = idx + 1;
    while (end < nodes.length && nodes[end].level > lvl) end++;
    return [
        ...nodes.slice(0, prevIdx),
        ...nodes.slice(idx, end),
        ...nodes.slice(prevIdx, idx),
        ...nodes.slice(end),
    ];
}
