import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { OrgNode, GuideInfo, FilterState } from '../types';
import { INITIAL_NODES, genId } from '../data';
import { getVisibleNodes, nodeHasChildren, computeNodeGuides, findParent, findPrevSibling, findNextSibling, findFirstSibling, findLastSibling, applyFilters } from '../lib/tree';
import { cycleTodo, cyclePriority, demoteSubtree, promoteSubtree, moveSubtreeDown, moveSubtreeUp } from '../lib/mutations';
import { generateMarkdown } from '../lib/markdown';

export interface OrgState {
  // Refs
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedRef: React.RefObject<HTMLDivElement | null>;
  editRef: React.RefObject<HTMLInputElement | null>;
  tagsRef: React.RefObject<HTMLInputElement | null>;
  // State
  nodes: OrgNode[];
  selectedId: string;
  editingId: string | null;
  editValue: string;
  tagsEditId: string | null;
  tagsEditValue: string;
  message: string;
  showHelp: boolean;
  showMd: boolean;
  showMeta: boolean;
  showSearch: boolean;
  searchQuery: string;
  shiftHeld: boolean;
  filter: FilterState;
  matchIds: Set<string>;
  showFilter: boolean;
  cmdBuf: string;
  copied: boolean;
  // Computed
  visible: OrgNode[];
  guideData: GuideInfo[];
  selIdx: number;
  selNode: OrgNode | undefined;
  allTags: string[];
  markdownText: string;
  stats: { todo: number; doing: number; waiting: number; done: number };
  // Handlers
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  setSelectedId: (id: string) => void;
  setEditValue: (v: string) => void;
  setTagsEditValue: (v: string) => void;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMd: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  setNodes: React.Dispatch<React.SetStateAction<OrgNode[]>>;
  startEdit: (nodeId: string) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
  openTagEdit: (nodeId: string) => void;
  confirmTagEdit: () => void;
  cancelTagEdit: () => void;
  toggleCollapse: (id: string) => void;
  copyMarkdown: () => void;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}

export function useOrgState(): OrgState {
  const [nodes,         setNodes]         = useState<OrgNode[]>(() => {
    try {
      const saved = localStorage.getItem('torg:nodes');
      if (saved) return JSON.parse(saved) as OrgNode[];
    } catch {}
    return INITIAL_NODES;
  });
  const [selectedId,    setSelectedId]    = useState<string>(INITIAL_NODES[0].id);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editValue,     setEditValue]     = useState('');
  const [isNewNode,     setIsNewNode]     = useState(false);
  const [message,       setMessage]       = useState('Press ? for keybindings.');
  const [showHelp,      setShowHelp]      = useState(false);
  const [showMd,        setShowMd]        = useState(false);
  const [showMeta,      setShowMeta]      = useState(false);
  const [cmdBuf,        setCmdBuf]        = useState('');
  const [tagsEditId,    setTagsEditId]    = useState<string | null>(null);
  const [tagsEditValue, setTagsEditValue] = useState('');
  const [copied,        setCopied]        = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [shiftHeld,     setShiftHeld]     = useState(false);
  const [filter,        setFilter]        = useState<FilterState>({ states: [], tags: [], datePreset: null });
  const [showFilter,    setShowFilter]    = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef  = useRef<HTMLDivElement>(null);
  const editRef      = useRef<HTMLInputElement>(null);
  const tagsRef      = useRef<HTMLInputElement>(null);
  const cmdTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef   = useRef<OrgNode[][]>([]);
  const futureRef    = useRef<OrgNode[][]>([]);

  const { filtered: filteredNodes, matchIds } = useMemo(() => applyFilters(nodes, filter), [nodes, filter]);
  const visible     = useMemo(() => getVisibleNodes(filteredNodes), [filteredNodes]);
  const guideData   = useMemo(() => computeNodeGuides(visible), [visible]);
  const selIdx      = useMemo(() => visible.findIndex(n => n.id === selectedId), [visible, selectedId]);
  const selNode     = useMemo(() => nodes.find(n => n.id === selectedId), [nodes, selectedId]);
  const allTags     = useMemo(() => {
    const s = new Set<string>();
    nodes.forEach(n => n.tags.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [nodes]);
  const markdownText = useMemo(() => generateMarkdown(nodes), [nodes]);
  const stats = useMemo(() => ({
    todo:    nodes.filter(n => n.state === 'TODO').length,
    doing:   nodes.filter(n => n.state === 'DOING').length,
    waiting: nodes.filter(n => n.state === 'WAITING').length,
    done:    nodes.filter(n => n.state === 'DONE').length,
  }), [nodes]);

  const msg = useCallback((m: string) => setMessage(m), []);

  const HISTORY_LIMIT = 50;
  const commitNodes = useCallback((next: OrgNode[] | ((prev: OrgNode[]) => OrgNode[])) => {
    setNodes(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      historyRef.current = [...historyRef.current, prev].slice(-HISTORY_LIMIT);
      futureRef.current = [];
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) { msg('Nothing to undo'); return; }
    setNodes(prev => {
      const past = historyRef.current[historyRef.current.length - 1];
      historyRef.current = historyRef.current.slice(0, -1);
      futureRef.current = [prev, ...futureRef.current].slice(0, HISTORY_LIMIT);
      return past;
    });
    msg('Undo');
  }, [msg]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) { msg('Nothing to redo'); return; }
    setNodes(prev => {
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      historyRef.current = [...historyRef.current, prev].slice(-HISTORY_LIMIT);
      return next;
    });
    msg('Redo');
  }, [msg]);

  useEffect(() => { selectedRef.current?.scrollIntoView({ block: 'nearest' }); }, [selectedId]);
  useEffect(() => { containerRef.current?.focus(); }, []);
  useEffect(() => {
    try { localStorage.setItem('torg:nodes', JSON.stringify(nodes)); } catch {}
  }, [nodes]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(true); };
    const up   = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  useEffect(() => {
    if (editingId) requestAnimationFrame(() => { editRef.current?.focus(); editRef.current?.select(); });
  }, [editingId]);
  useEffect(() => {
    if (tagsEditId) requestAnimationFrame(() => { tagsRef.current?.focus(); tagsRef.current?.select(); });
  }, [tagsEditId]);

  // ── Tag editing ──────────────────────────────────────────────────────────────

  const openTagEdit = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setTagsEditId(nodeId);
    setTagsEditValue(node.tags.join(' '));
    msg('Edit tags (space-separated)  ·  Enter=confirm  Esc=cancel');
  }, [nodes, msg]);

  const confirmTagEdit = useCallback(() => {
    if (!tagsEditId) return;
    const tags = tagsEditValue.split(/\s+/).map(t => t.trim().replace(/^:+|:+$/g, '')).filter(t => t.length > 0);
    commitNodes(prev => prev.map(n => n.id === tagsEditId ? { ...n, tags } : n));
    msg(`Tags updated: ${tags.length > 0 ? ':' + tags.join(':') + ':' : '(none)'}`);
    setTagsEditId(null);
    setTagsEditValue('');
    containerRef.current?.focus();
  }, [tagsEditId, tagsEditValue, msg]);

  const cancelTagEdit = useCallback(() => {
    setTagsEditId(null);
    setTagsEditValue('');
    msg('Tag edit cancelled');
    containerRef.current?.focus();
  }, [msg]);

  // ── Editing ──────────────────────────────────────────────────────────────────

  const startEdit = useCallback((nodeId: string, isNew = false) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setEditValue(node.title);
    setEditingId(nodeId);
    setIsNewNode(isNew);
    msg('Editing… Enter=confirm  Esc=cancel');
  }, [nodes, msg]);

  const confirmEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (trimmed === '') {
      const vIdx = visible.findIndex(n => n.id === editingId);
      const adj  = visible[vIdx - 1] ?? visible[vIdx + 1];
      if (adj) setSelectedId(adj.id);
      commitNodes(prev => prev.filter(n => n.id !== editingId));
      msg('Heading removed');
    } else {
      commitNodes(prev => prev.map(n => n.id === editingId ? { ...n, title: trimmed } : n));
      msg('');
    }
    setEditingId(null); setEditValue(''); setIsNewNode(false);
    containerRef.current?.focus();
  }, [editingId, editValue, visible, msg]);

  const cancelEdit = useCallback(() => {
    if (!editingId) return;
    if (isNewNode) {
      const vIdx = visible.findIndex(n => n.id === editingId);
      const adj  = visible[vIdx - 1] ?? visible[vIdx + 1];
      if (adj) setSelectedId(adj.id);
      commitNodes(prev => prev.filter(n => n.id !== editingId));
    }
    setEditingId(null); setEditValue(''); setIsNewNode(false);
    msg('Edit cancelled');
    containerRef.current?.focus();
  }, [editingId, isNewNode, visible, msg]);

  const insertNode = useCallback((below: boolean) => {
    const cur = nodes.find(n => n.id === selectedId);
    if (!cur) return;
    const newNode: OrgNode = { id: genId(), level: cur.level, title: '', state: null, tags: [], collapsed: false, priority: null, createdAt: Date.now() };
    commitNodes(prev => {
      const idx = prev.findIndex(n => n.id === selectedId);
      let at = below ? idx + 1 : idx;
      if (below) while (at < prev.length && prev[at].level > cur.level) at++;
      return [...prev.slice(0, at), newNode, ...prev.slice(at)];
    });
    setSelectedId(newNode.id);
    setEditValue('');
    setEditingId(newNode.id);
    setIsNewNode(true);
    msg('Editing… Enter=confirm  Esc=cancel');
  }, [nodes, selectedId, commitNodes, msg]);

  const deleteSelected = useCallback(() => {
    const idx = nodes.findIndex(n => n.id === selectedId);
    if (idx === -1) return;
    const node = nodes[idx];
    let end = idx + 1;
    while (end < nodes.length && nodes[end].level > node.level) end++;
    const childCount = end - idx - 1;
    const vIdx = visible.findIndex(n => n.id === selectedId);
    const adj  = visible[vIdx + 1] ?? visible[vIdx - 1];
    if (adj && adj.id !== selectedId) setSelectedId(adj.id);
    commitNodes(prev => prev.filter((_, i) => i < idx || i >= end));
    msg(childCount > 0 ? `Killed "${node.title}" and ${childCount} child${childCount !== 1 ? 'ren' : ''}` : `Killed "${node.title}"`);
  }, [nodes, selectedId, visible, msg]);

  const cycleGlobalFold = useCallback(() => {
    setNodes(prev => {
      const allOpen  = prev.every(n => !n.collapsed);
      const noneOpen = prev.every(n => n.collapsed || !(prev.some((_, i) => i + 1 < prev.length && prev[i + 1].level > prev[i].level && prev[i].id === n.id)));
      // Simplified: allOpen → overview, else if any collapsed → show all
      if (allOpen) {
        msg('Global: OVERVIEW');
        return prev.map((n, i) => {
          const hasKids = i + 1 < prev.length && prev[i + 1].level > n.level;
          return hasKids ? { ...n, collapsed: true } : n;
        });
      } else if (noneOpen) {
        msg('Global: CONTENTS');
        return prev.map((n, i) => {
          const hasKids = i + 1 < prev.length && prev[i + 1].level > n.level;
          return hasKids ? { ...n, collapsed: n.level >= 2 } : n;
        });
      } else {
        msg('Global: SHOW ALL');
        return prev.map(n => ({ ...n, collapsed: false }));
      }
    });
  }, [msg]);

  const toggleCollapse = useCallback((id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : n));
    setSelectedId(id);
  }, []);

  const copyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(markdownText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [markdownText]);

  // ── Navigate to ID helper ─────────────────────────────────────────────────────

  const jumpTo = useCallback((id: string | null, label: string) => {
    if (!id) { msg(`(no ${label})`); return; }
    setSelectedId(id);
    msg(`→ ${label}`);
  }, [msg]);

  // ── Main keyboard handler ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showHelp) {
      if (['Escape', '?', 'q'].includes(e.key)) { e.preventDefault(); setShowHelp(false); }
      return;
    }

    if (showSearch) {
      if (e.key === 'Escape') { e.preventDefault(); setShowSearch(false); }
      return;
    }

    if (tagsEditId) {
      if (e.key === 'Enter')  { e.preventDefault(); confirmTagEdit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelTagEdit(); }
      return;
    }

    if (editingId) {
      if (e.key === 'Enter')  { e.preventDefault(); confirmEdit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      return;
    }

    const { key, altKey, shiftKey, ctrlKey } = e;

    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)) e.preventDefault();
    if (cmdTimer.current) clearTimeout(cmdTimer.current);

    // Line navigation
    if ((key === 'ArrowDown' || key === 'j') && !altKey && !ctrlKey && !shiftKey) {
      if (selIdx < visible.length - 1) setSelectedId(visible[selIdx + 1].id);
      setCmdBuf(''); return;
    }
    if ((key === 'ArrowUp' || key === 'k') && !altKey && !ctrlKey && !shiftKey) {
      if (selIdx > 0) setSelectedId(visible[selIdx - 1].id);
      setCmdBuf(''); return;
    }

    // h / ← : collapse if open, else jump to parent
    if ((key === 'h' || key === 'ArrowLeft') && !altKey && !ctrlKey && !shiftKey) {
      const curNode = nodes.find(n => n.id === selectedId);
      if (curNode && !curNode.collapsed && nodeHasChildren(nodes, selectedId)) {
        setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, collapsed: true } : n)); // view-only, not undoable
        msg('Subtree folded');
      } else {
        jumpTo(findParent(nodes, selectedId), 'parent');
      }
      setCmdBuf(''); return;
    }

    // l / → : expand + jump to first child
    if ((key === 'l' || key === 'ArrowRight') && !altKey && !ctrlKey && !shiftKey) {
      const curNode = nodes.find(n => n.id === selectedId);
      if (curNode && nodeHasChildren(nodes, selectedId)) {
        const newNodes = curNode.collapsed
          ? nodes.map(n => n.id === selectedId ? { ...n, collapsed: false } : n)
          : nodes;
        if (curNode.collapsed) setNodes(newNodes); // view-only, not undoable
        const cIdx = newNodes.findIndex(n => n.id === selectedId);
        if (cIdx !== -1 && cIdx + 1 < newNodes.length && newNodes[cIdx + 1].level > curNode.level) {
          setSelectedId(newNodes[cIdx + 1].id);
          msg(curNode.collapsed ? 'Expanded → first child' : '→ first child');
        }
      } else {
        msg('(no children)');
      }
      setCmdBuf(''); return;
    }

    // Tree-structure navigation
    if ((key === '[') || (key === 'ArrowUp' && ctrlKey)) {
      e.preventDefault(); jumpTo(findPrevSibling(visible, selectedId), 'previous sibling'); setCmdBuf(''); return;
    }
    if ((key === ']') || (key === 'ArrowDown' && ctrlKey)) {
      e.preventDefault(); jumpTo(findNextSibling(visible, selectedId), 'next sibling'); setCmdBuf(''); return;
    }
    if ((key === 'u') || (key === 'ArrowLeft' && ctrlKey)) {
      e.preventDefault(); jumpTo(findParent(nodes, selectedId), 'parent'); setCmdBuf(''); return;
    }
    if (key === '{') { jumpTo(findFirstSibling(visible, selectedId), 'first sibling'); setCmdBuf(''); return; }
    if (key === '}') { jumpTo(findLastSibling(visible, selectedId), 'last sibling');   setCmdBuf(''); return; }

    // F : cycle global fold (moved from Z to free up Z for undo/redo)
    if ((key === 'F' || key === 'f') && !altKey && !ctrlKey) { cycleGlobalFold(); setCmdBuf(''); return; }

    // < / > : promote / demote
    if (key === '<' && !ctrlKey) {
      const result = promoteSubtree(nodes, selectedId);
      if (result !== nodes) { commitNodes(result); msg('Promoted ← (unindented)'); }
      else msg('(already at top level)');
      setCmdBuf(''); return;
    }
    if (key === '>' && !ctrlKey) {
      const result = demoteSubtree(nodes, selectedId);
      if (result !== nodes) { commitNodes(result); msg('Demoted → (indented)'); }
      else msg('(max depth reached)');
      setCmdBuf(''); return;
    }

    // Edit
    if (key === 'Enter') { e.preventDefault(); startEdit(selectedId); setCmdBuf(''); return; }

    // State cycle
    if (key === 't' && !altKey && !ctrlKey) {
      commitNodes(prev => prev.map(n => {
        if (n.id !== selectedId) return n;
        const ns = cycleTodo(n.state);
        msg(`State → ${ns ?? '(none)'}`);
        return { ...n, state: ns };
      }));
      setCmdBuf(''); return;
    }

    // Priority
    if (key === 'p' && !altKey && !ctrlKey) {
      commitNodes(prev => prev.map(n => {
        if (n.id !== selectedId) return n;
        const np = cyclePriority(n.priority);
        msg(`Priority → ${np ? `[#${np}]` : '(none)'}`);
        return { ...n, priority: np };
      }));
      setCmdBuf(''); return;
    }

    // Tag edit
    if (key === ':' && !ctrlKey) { e.preventDefault(); openTagEdit(selectedId); setCmdBuf(''); return; }

    // Insert
    if (key === 'o' && !altKey && !ctrlKey && !shiftKey) { e.preventDefault(); insertNode(true);  setCmdBuf(''); return; }
    if (key === 'O' && !altKey && !ctrlKey)               { e.preventDefault(); insertNode(false); setCmdBuf(''); return; }

    // Alt+Arrow: subtree movement / promote / demote
    if (altKey && key === 'ArrowDown')  { commitNodes(prev => moveSubtreeDown(prev, selectedId));  msg('Moved ↓'); return; }
    if (altKey && key === 'ArrowUp')    { commitNodes(prev => moveSubtreeUp(prev, selectedId));    msg('Moved ↑'); return; }
    if (altKey && key === 'ArrowRight') { commitNodes(prev => demoteSubtree(prev, selectedId));    msg('Demoted →'); return; }
    if (altKey && key === 'ArrowLeft')  { commitNodes(prev => promoteSubtree(prev, selectedId));   msg('Promoted ←'); return; }

    // Markdown toggle
    if (key === 'M' && !altKey && !ctrlKey) {
      setShowMd(v => !v);
      msg(showMd ? 'Markdown panel closed' : 'Markdown export panel open');
      setCmdBuf(''); return;
    }

    // z / Z : undo / redo
    if (key === 'z' && !altKey && !ctrlKey && !shiftKey) { undo(); setCmdBuf(''); return; }
    if (key === 'Z' && !altKey && !ctrlKey)               { redo(); setCmdBuf(''); return; }

    // gg / G
    if (key === 'g') {
      if (cmdBuf === 'g') { setSelectedId(visible[0].id); msg('Top'); setCmdBuf(''); return; }
      setCmdBuf('g'); msg('g-');
      cmdTimer.current = setTimeout(() => { setCmdBuf(''); msg(''); }, 1500); return;
    }
    if (key === 'G') { setSelectedId(visible[visible.length - 1].id); msg('Bottom'); setCmdBuf(''); return; }

    // dd
    if (key === 'd') {
      if (cmdBuf === 'd') { deleteSelected(); setCmdBuf(''); return; }
      setCmdBuf('d'); msg('d-  (press d again to kill)');
      cmdTimer.current = setTimeout(() => { setCmdBuf(''); msg(''); }, 1500); return;
    }

    // Meta toggle
    if (key === 'I' && !altKey && !ctrlKey) {
      setShowMeta(v => !v);
      msg(showMeta ? 'Metadata annotations off' : 'Metadata annotations on');
      setCmdBuf(''); return;
    }

    // Filter
    if (key === '\\' && !ctrlKey && !altKey) {
      e.preventDefault(); setShowFilter(v => !v); setCmdBuf(''); return;
    }

    // Search
    if ((key === '/' && !ctrlKey) || (key === 'k' && (e.metaKey || ctrlKey))) {
      e.preventDefault(); setShowSearch(true); setCmdBuf(''); return;
    }

    // Help
    if (key === '?') { e.preventDefault(); setShowHelp(v => !v); setCmdBuf(''); return; }
    if (key === 'Escape') { setCmdBuf(''); setShowHelp(false); setShowSearch(false); setShowFilter(false); msg(''); return; }

    if (key.length === 1) setCmdBuf('');
  }, [
    showHelp, showSearch, showMeta, tagsEditId, editingId, cmdBuf, selIdx, visible, nodes, selectedId, showMd,
    confirmTagEdit, cancelTagEdit, confirmEdit, cancelEdit, startEdit, insertNode,
    deleteSelected, cycleGlobalFold, openTagEdit, jumpTo, undo, redo, msg,
  ]);

  return {
    containerRef, selectedRef, editRef, tagsRef,
    nodes, selectedId, editingId, editValue, tagsEditId, tagsEditValue,
    message, showHelp, showMd, showMeta, showSearch, searchQuery, shiftHeld, filter, matchIds, cmdBuf, copied,
    visible, guideData, selIdx, selNode, allTags, markdownText, stats,
    handleKeyDown, setSelectedId, setEditValue, setTagsEditValue,
    setShowHelp, setShowMd, setShowSearch, setSearchQuery, setNodes,
    startEdit, confirmEdit, cancelEdit,
    openTagEdit, confirmTagEdit, cancelTagEdit,
    toggleCollapse, copyMarkdown, setFilter, showFilter, setShowFilter,
  };
}
