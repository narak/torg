import type { OrgNode, GuideInfo, FilterState } from '../types';

export function getVisibleNodes(nodes: OrgNode[]): OrgNode[] {
  const visible: OrgNode[] = [];
  let hideBelow: number | null = null;
  for (const node of nodes) {
    if (hideBelow !== null) {
      if (node.level > hideBelow) continue;
      else hideBelow = null;
    }
    visible.push(node);
    if (node.collapsed) hideBelow = node.level;
  }
  return visible;
}

export function nodeHasChildren(nodes: OrgNode[], nodeId: string): boolean {
  const idx = nodes.findIndex(n => n.id === nodeId);
  if (idx === -1) return false;
  return idx + 1 < nodes.length && nodes[idx + 1].level > nodes[idx].level;
}

export function computeNodeGuides(visible: OrgNode[]): GuideInfo[] {
  return visible.map((node, i) => {
    const guides: boolean[] = [];
    for (let l = 1; l < node.level; l++) {
      let active = false;
      for (let j = i + 1; j < visible.length; j++) {
        if (visible[j].level <= l) { active = visible[j].level === l; break; }
      }
      guides.push(active);
    }
    let isLast = true;
    for (let j = i + 1; j < visible.length; j++) {
      if (visible[j].level <= node.level) { isLast = visible[j].level < node.level; break; }
    }
    return { guides, isLastSibling: isLast };
  });
}

export function findParent(nodes: OrgNode[], nodeId: string): string | null {
  const idx = nodes.findIndex(n => n.id === nodeId);
  if (idx <= 0) return null;
  const lvl = nodes[idx].level;
  for (let i = idx - 1; i >= 0; i--) {
    if (nodes[i].level < lvl) return nodes[i].id;
  }
  return null;
}

export function findPrevSibling(visible: OrgNode[], nodeId: string): string | null {
  const idx = visible.findIndex(n => n.id === nodeId);
  if (idx <= 0) return null;
  const lvl = visible[idx].level;
  for (let i = idx - 1; i >= 0; i--) {
    if (visible[i].level === lvl) return visible[i].id;
    if (visible[i].level < lvl) return null;
  }
  return null;
}

export function findNextSibling(visible: OrgNode[], nodeId: string): string | null {
  const idx = visible.findIndex(n => n.id === nodeId);
  if (idx === -1) return null;
  const lvl = visible[idx].level;
  for (let i = idx + 1; i < visible.length; i++) {
    if (visible[i].level === lvl) return visible[i].id;
    if (visible[i].level < lvl) return null;
  }
  return null;
}

export function findFirstSibling(visible: OrgNode[], nodeId: string): string | null {
  const idx = visible.findIndex(n => n.id === nodeId);
  if (idx <= 0) return null;
  const lvl = visible[idx].level;
  let first: string | null = null;
  for (let i = idx - 1; i >= 0; i--) {
    if (visible[i].level === lvl) first = visible[i].id;
    else if (visible[i].level < lvl) break;
  }
  return first;
}

export function findLastSibling(visible: OrgNode[], nodeId: string): string | null {
  const idx = visible.findIndex(n => n.id === nodeId);
  if (idx === -1) return null;
  const lvl = visible[idx].level;
  let last: string | null = null;
  for (let i = idx + 1; i < visible.length; i++) {
    if (visible[i].level === lvl) last = visible[i].id;
    else if (visible[i].level < lvl) break;
  }
  return last;
}

// Returns the subset of nodes that match the filter, plus any ancestors needed
// for context. Also returns a Set of IDs that are direct matches (for highlighting).
export function applyFilters(
  nodes: OrgNode[],
  filter: FilterState,
): { filtered: OrgNode[]; matchIds: Set<string> } {
  const empty = !filter.states.length && !filter.tags.length && !filter.datePreset;
  if (empty) return { filtered: nodes, matchIds: new Set() };

  const now = Date.now();
  const cutoff: Record<NonNullable<FilterState['datePreset']>, number> = {
    today: now - 86_400_000,
    week:  now - 7 * 86_400_000,
    month: now - 30 * 86_400_000,
  };

  const matchIds = new Set<string>();
  for (const n of nodes) {
    const stateOk  = !filter.states.length  || filter.states.includes(n.state);
    const tagOk    = !filter.tags.length    || filter.tags.every(t => n.tags.includes(t));
    const dateOk   = !filter.datePreset     || (!!n.createdAt && n.createdAt >= cutoff[filter.datePreset]);
    if (stateOk && tagOk && dateOk) matchIds.add(n.id);
  }

  // Include ancestors of matches so the tree context is visible
  const included = new Set<string>();
  for (const id of matchIds) {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) continue;
    included.add(id);
    const lvl = nodes[idx].level;
    for (let i = idx - 1; i >= 0; i--) {
      if (nodes[i].level < lvl) { included.add(nodes[i].id); }
      if (nodes[i].level === 1) break;
    }
  }

  const filtered = nodes.filter(n => included.has(n.id));
  return { filtered, matchIds };
}
