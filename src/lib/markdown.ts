import type { OrgNode } from '../types';

const STATE_LABELS: Record<NonNullable<OrgNode['state']>, string> = {
    TODO: 'TODO',
    DOING: 'DOING',
    WAITING: 'WAITING',
    DONE: 'DONE',
};

export function generateMarkdown(nodes: OrgNode[]): string {
    const lines: string[] = [];
    const parentIds = new Set(
        nodes
            .slice(0, -1)
            .filter((n, i) => nodes[i + 1].level > n.level)
            .map((n) => n.id),
    );

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isParent = parentIds.has(node.id);
        const stateMarker = node.state ? `${STATE_LABELS[node.state]} ` : '';
        const priority = node.priority ? `[#${node.priority}] ` : '';
        const title = node.state === 'DONE' ? `~~${node.title}~~` : node.title;
        const tags = node.tags.length > 0 ? '  ' + node.tags.map((t) => `\`${t}\``).join(' ') : '';

        if (isParent) {
            if (lines.length > 0) lines.push('');
            const hashes = '#'.repeat(Math.min(node.level, 6));
            lines.push(`${hashes} ${stateMarker}${priority}${title}${tags}`);
        } else {
            const indent = '  '.repeat(Math.max(0, node.level - 1));
            lines.push(`${indent}- ${stateMarker}${priority}${title}${tags}`);
        }
    }
    return lines.join('\n').trim();
}
