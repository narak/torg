import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { OrgNode, GuideInfo, FilterState } from '../types';
import { INITIAL_NODES, genId } from '../data';
import {
    getVisibleNodes,
    computeNodeGuides,
    applyFilters,
    applyTabFilter,
} from '../lib/tree';
import { generateMarkdown } from '../lib/markdown';
import { useKeyboardHandler } from './useKeyboardHandler';

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
    wordWrap: boolean;
    searchQuery: string;
    shiftHeld: boolean;
    filter: FilterState;
    matchIds: Set<string>;
    showFilter: boolean;
    filterBarFocused: boolean;
    filterFocusIdx: number;
    tabMode: 'none' | 'tag' | 'heading';
    activeTab: string | null;
    tabList: string[];
    tabBarFocused: boolean;
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
    toggleWordWrap: () => void;
    setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMd: React.Dispatch<React.SetStateAction<boolean>>;
    setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
    setFilterBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
    setFilterFocusIdx: React.Dispatch<React.SetStateAction<number>>;
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
    setTabMode: React.Dispatch<React.SetStateAction<'none' | 'tag' | 'heading'>>;
    setActiveTab: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useOrgState(): OrgState {
    const [nodes, setNodes] = useState<OrgNode[]>(() => {
        try {
            const saved = localStorage.getItem('torg:nodes');
            if (saved) {
                const parsed = JSON.parse(saved) as OrgNode[];
                // Migrate old A/B/C priorities to P0/P1/P2
                return parsed.map((n) => {
                    const p = n.priority as string | null;
                    const migrated = {
                        ...n,
                        severity: (n as OrgNode & { severity?: unknown }).severity ?? null,
                    };
                    if (p === 'A') return { ...migrated, priority: 'P0' as const };
                    if (p === 'B') return { ...migrated, priority: 'P1' as const };
                    if (p === 'C') return { ...migrated, priority: 'P2' as const };
                    // Strip old S-series priorities that ended up on priority field
                    if (typeof p === 'string' && p.startsWith('S'))
                        return { ...migrated, priority: null, severity: p as OrgNode['severity'] };
                    return migrated;
                });
            }
        } catch {}
        return INITIAL_NODES;
    });
    const [selectedId, setSelectedId] = useState<string>(INITIAL_NODES[0].id);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isNewNode, setIsNewNode] = useState(false);
    const [message, setMessage] = useState('Press ? for keybindings.');
    const [showHelp, setShowHelp] = useState(false);
    const [showMd, setShowMd] = useState(false);
    const [showMeta, setShowMeta] = useState(false);
    const [cmdBuf, setCmdBuf] = useState('');
    const [tagsEditId, setTagsEditId] = useState<string | null>(null);
    const [tagsEditValue, setTagsEditValue] = useState('');
    const [copied, setCopied] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [shiftHeld, setShiftHeld] = useState(false);
    const [filter, setFilter] = useState<FilterState>({
        states: [],
        priorities: [],
        severities: [],
        tags: [],
        datePreset: null,
        hideDone: true,
    });
    const [showFilter, setShowFilter] = useState(false);
    const [tabMode, setTabMode] = useState<'none' | 'tag' | 'heading'>('none');
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [tabBarFocused, setTabBarFocused] = useState(false);
    const [filterBarFocused, setFilterBarFocused] = useState(false);
    const [filterFocusIdx, setFilterFocusIdx] = useState(0);
    const [wordWrap, setWordWrap] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLDivElement>(null);
    const editRef = useRef<HTMLInputElement>(null);
    const tagsRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<OrgNode[][]>([]);
    const futureRef = useRef<OrgNode[][]>([]);

    // Tab mode: compute list of tabs and slice nodes to the active tab
    const tabList = useMemo<string[]>(() => {
        if (tabMode === 'tag') {
            const seen = new Set<string>();
            const tags: string[] = [];
            for (const n of nodes)
                for (const t of n.tags)
                    if (!seen.has(t)) {
                        seen.add(t);
                        tags.push(t);
                    }
            return tags;
        }
        if (tabMode === 'heading') {
            return nodes.filter((n) => n.level === 1).map((n) => n.id);
        }
        return [];
    }, [nodes, tabMode]);

    // Reset activeTab and tabBarFocused when tabList changes and current tab is no longer valid
    useEffect(() => {
        if (tabMode === 'none') {
            setActiveTab(null);
            setTabBarFocused(false);
            containerRef.current?.focus();
            return;
        }
        if (tabList.length > 0 && (activeTab === null || !tabList.includes(activeTab))) {
            setActiveTab(tabList[0]);
        }
    }, [tabMode, tabList, activeTab]);

    const { filtered: tabbedNodes, matchIds: tabMatchIds } = useMemo(() => {
        if (tabMode === 'none' || activeTab === null)
            return { filtered: nodes, matchIds: new Set<string>() };
        return applyTabFilter(nodes, tabMode, activeTab);
    }, [nodes, tabMode, activeTab]);

    // Retain selectedId when switching tabs; fall back to first node of new tab
    useEffect(() => {
        if (tabMode === 'none' || !activeTab) return;
        if (tabbedNodes.length > 0 && !tabbedNodes.find((n) => n.id === selectedId)) {
            setSelectedId(tabbedNodes[0].id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const { filtered: filteredNodes, matchIds: filterMatchIds } = useMemo(
        () => applyFilters(tabbedNodes, filter),
        [tabbedNodes, filter],
    );
    const matchIds = useMemo(
        () => (filterMatchIds.size > 0 ? filterMatchIds : tabMatchIds),
        [filterMatchIds, tabMatchIds],
    );
    const visible = useMemo(() => getVisibleNodes(filteredNodes), [filteredNodes]);
    const guideData = useMemo(() => computeNodeGuides(visible), [visible]);
    const selIdx = useMemo(
        () => visible.findIndex((n) => n.id === selectedId),
        [visible, selectedId],
    );
    const selNode = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);
    const allTags = useMemo(() => {
        const s = new Set<string>();
        nodes.forEach((n) => n.tags.forEach((t) => s.add(t)));
        return Array.from(s).sort();
    }, [nodes]);
    const markdownText = useMemo(() => generateMarkdown(nodes), [nodes]);
    const stats = useMemo(
        () => ({
            todo: nodes.filter((n) => n.state === 'TODO').length,
            doing: nodes.filter((n) => n.state === 'DOING').length,
            waiting: nodes.filter((n) => n.state === 'WAITING').length,
            done: nodes.filter((n) => n.state === 'DONE').length,
        }),
        [nodes],
    );

    const msg = useCallback((m: string) => setMessage(m), []);

    // Pill layout: 0-3=states, 4-7=priorities, 8-11=severities, 12..12+N-1=tags, 12+N..14+N=dates
    const FILTER_STATES_ARR = ['TODO', 'DOING', 'WAITING', 'DONE'] as const;
    const FILTER_PRIORITY_ARR = ['P0', 'P1', 'P2', 'P3'] as const;
    const FILTER_SEVERITY_ARR = ['S0', 'S1', 'S2', 'S3'] as const;
    const FILTER_DATE_ARR = ['today', 'week', 'month'] as const;
    const filterPillCount = 4 + 4 + 4 + allTags.length + 3;

    const toggleFilterPill = useCallback(
        (idx: number) => {
            if (idx < 4) {
                const s = FILTER_STATES_ARR[idx];
                setFilter((f) => ({
                    ...f,
                    states: f.states.includes(s) ? f.states.filter((x) => x !== s) : [...f.states, s],
                }));
            } else if (idx < 8) {
                const p = FILTER_PRIORITY_ARR[idx - 4];
                setFilter((f) => ({
                    ...f,
                    priorities: f.priorities.includes(p)
                        ? f.priorities.filter((x) => x !== p)
                        : [...f.priorities, p],
                }));
            } else if (idx < 12) {
                const sv = FILTER_SEVERITY_ARR[idx - 8];
                setFilter((f) => ({
                    ...f,
                    severities: f.severities.includes(sv)
                        ? f.severities.filter((x) => x !== sv)
                        : [...f.severities, sv],
                }));
            } else if (idx < 12 + allTags.length) {
                const t = allTags[idx - 12];
                setFilter((f) => ({
                    ...f,
                    tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t],
                }));
            } else {
                const dateIdx = idx - 12 - allTags.length;
                if (dateIdx >= 0 && dateIdx < 3) {
                    const v = FILTER_DATE_ARR[dateIdx];
                    setFilter((f) => ({ ...f, datePreset: f.datePreset === v ? null : v }));
                }
            }
        },
        [allTags],
    );

    const clearFilters = useCallback(
        () =>
            setFilter((f) => ({
                states: [],
                priorities: [],
                severities: [],
                tags: [],
                datePreset: null,
                hideDone: f.hideDone,
            })),
        [],
    );

    const toggleWordWrap = useCallback(
        () =>
            setWordWrap((v) => {
                msg(v ? 'Word wrap: off' : 'Word wrap: on');
                return !v;
            }),
        [msg],
    );

    const toggleHideDone = useCallback(
        () =>
            setFilter((f) => {
                msg(f.hideDone ? 'Showing DONE items' : 'Hiding DONE items');
                return { ...f, hideDone: !f.hideDone };
            }),
        [msg],
    );

    const HISTORY_LIMIT = 50;
    const commitNodes = useCallback((next: OrgNode[] | ((prev: OrgNode[]) => OrgNode[])) => {
        setNodes((prev) => {
            const resolved = typeof next === 'function' ? next(prev) : next;
            historyRef.current = [...historyRef.current, prev].slice(-HISTORY_LIMIT);
            futureRef.current = [];
            return resolved;
        });
    }, []);

    const undo = useCallback(() => {
        if (historyRef.current.length === 0) {
            msg('Nothing to undo');
            return;
        }
        setNodes((prev) => {
            const past = historyRef.current[historyRef.current.length - 1];
            historyRef.current = historyRef.current.slice(0, -1);
            futureRef.current = [prev, ...futureRef.current].slice(0, HISTORY_LIMIT);
            return past;
        });
        msg('Undo');
    }, [msg]);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) {
            msg('Nothing to redo');
            return;
        }
        setNodes((prev) => {
            const next = futureRef.current[0];
            futureRef.current = futureRef.current.slice(1);
            historyRef.current = [...historyRef.current, prev].slice(-HISTORY_LIMIT);
            return next;
        });
        msg('Redo');
    }, [msg]);

    useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selectedId]);
    useEffect(() => {
        containerRef.current?.focus();
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem('torg:nodes', JSON.stringify(nodes));
        } catch {}
    }, [nodes]);
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftHeld(true);
        };
        const up = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftHeld(false);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);
    useEffect(() => {
        if (editingId)
            requestAnimationFrame(() => {
                editRef.current?.focus();
                editRef.current?.select();
            });
    }, [editingId]);
    useEffect(() => {
        if (tagsEditId)
            requestAnimationFrame(() => {
                tagsRef.current?.focus();
                tagsRef.current?.select();
            });
    }, [tagsEditId]);

    // ── Tag editing ──────────────────────────────────────────────────────────────

    const openTagEdit = useCallback(
        (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;
            setTagsEditId(nodeId);
            setTagsEditValue(node.tags.join(' '));
            msg('Edit tags (space-separated)  ·  Enter=confirm  Esc=cancel');
        },
        [nodes, msg],
    );

    const confirmTagEdit = useCallback(() => {
        if (!tagsEditId) return;
        const tags = tagsEditValue
            .split(/\s+/)
            .map((t) => t.trim().replace(/^:+|:+$/g, ''))
            .filter((t) => t.length > 0);
        commitNodes((prev) => prev.map((n) => (n.id === tagsEditId ? { ...n, tags } : n)));
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

    const startEdit = useCallback(
        (nodeId: string, isNew = false) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;
            setEditValue(node.title);
            setEditingId(nodeId);
            setIsNewNode(isNew);
            msg('Editing… Enter=confirm  Esc=cancel');
        },
        [nodes, msg],
    );

    const confirmEdit = useCallback(() => {
        if (!editingId) return;
        const trimmed = editValue.trim();
        if (trimmed === '') {
            const vIdx = visible.findIndex((n) => n.id === editingId);
            const adj = visible[vIdx - 1] ?? visible[vIdx + 1];
            if (adj) setSelectedId(adj.id);
            commitNodes((prev) => prev.filter((n) => n.id !== editingId));
            msg('Heading removed');
        } else {
            commitNodes((prev) =>
                prev.map((n) => (n.id === editingId ? { ...n, title: trimmed } : n)),
            );
            msg('');
        }
        setEditingId(null);
        setEditValue('');
        setIsNewNode(false);
        containerRef.current?.focus();
    }, [editingId, editValue, visible, msg]);

    const cancelEdit = useCallback(() => {
        if (!editingId) return;
        if (isNewNode) {
            const vIdx = visible.findIndex((n) => n.id === editingId);
            const adj = visible[vIdx - 1] ?? visible[vIdx + 1];
            if (adj) setSelectedId(adj.id);
            commitNodes((prev) => prev.filter((n) => n.id !== editingId));
        }
        setEditingId(null);
        setEditValue('');
        setIsNewNode(false);
        msg('Edit cancelled');
        containerRef.current?.focus();
    }, [editingId, isNewNode, visible, msg]);

    const insertNode = useCallback(
        (below: boolean) => {
            const cur = nodes.find((n) => n.id === selectedId);
            if (!cur) return;
            const newNode: OrgNode = {
                id: genId(),
                level: cur.level,
                title: '',
                state: null,
                tags: [],
                collapsed: false,
                priority: null,
                severity: null,
                createdAt: Date.now(),
            };
            commitNodes((prev) => {
                const idx = prev.findIndex((n) => n.id === selectedId);
                let at = below ? idx + 1 : idx;
                if (below) while (at < prev.length && prev[at].level > cur.level) at++;
                return [...prev.slice(0, at), newNode, ...prev.slice(at)];
            });
            setSelectedId(newNode.id);
            setEditValue('');
            setEditingId(newNode.id);
            setIsNewNode(true);
            msg('Editing… Enter=confirm  Esc=cancel');
        },
        [nodes, selectedId, commitNodes, msg],
    );

    const deleteSelected = useCallback(() => {
        const idx = nodes.findIndex((n) => n.id === selectedId);
        if (idx === -1) return;
        const node = nodes[idx];
        let end = idx + 1;
        while (end < nodes.length && nodes[end].level > node.level) end++;
        const childCount = end - idx - 1;

        const deletedIds = new Set(nodes.slice(idx, end).map((n) => n.id));
        const vIdx = visible.findIndex((n) => n.id === selectedId);
        const nextVisible = visible.slice(vIdx + 1).find((n) => !deletedIds.has(n.id));
        const prevVisible = visible.slice(0, vIdx).reverse().find((n) => !deletedIds.has(n.id));
        const target = nextVisible ?? prevVisible;
        if (target) setSelectedId(target.id);

        commitNodes((prev) => prev.filter((_, i) => i < idx || i >= end));
        msg(
            childCount > 0
                ? `Killed "${node.title}" and ${childCount} child${childCount !== 1 ? 'ren' : ''}`
                : `Killed "${node.title}"`,
        );
    }, [nodes, selectedId, visible, msg]);

    const cycleGlobalFold = useCallback(() => {
        setNodes((prev) => {
            const allOpen = prev.every((n) => !n.collapsed);
            const noneOpen = prev.every(
                (n) =>
                    n.collapsed ||
                    !prev.some(
                        (_, i) =>
                            i + 1 < prev.length &&
                            prev[i + 1].level > prev[i].level &&
                            prev[i].id === n.id,
                    ),
            );
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
                return prev.map((n) => ({ ...n, collapsed: false }));
            }
        });
    }, [msg]);

    const toggleCollapse = useCallback((id: string) => {
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : n)));
        setSelectedId(id);
    }, []);

    const copyMarkdown = useCallback(() => {
        navigator.clipboard.writeText(markdownText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    }, [markdownText]);

    // ── Navigate to ID helper ─────────────────────────────────────────────────────

    const jumpTo = useCallback(
        (id: string | null, label: string) => {
            if (!id) {
                msg(`(no ${label})`);
                return;
            }
            setSelectedId(id);
            msg(`→ ${label}`);
        },
        [msg],
    );

    // ── Main keyboard handler ─────────────────────────────────────────────────────

    const handleKeyDown = useKeyboardHandler({
        showHelp,
        showSearch,
        showMeta,
        showMd,
        tagsEditId,
        editingId,
        cmdBuf,
        selIdx,
        visible,
        nodes,
        selectedId,
        tabMode,
        tabList,
        tabBarFocused,
        showFilter,
        filterBarFocused,
        filterFocusIdx,
        filterPillCount,
        filterTagCount: allTags.length,
        setShowHelp,
        setShowSearch,
        setShowMd,
        setShowMeta,
        setSelectedId,
        setCmdBuf,
        setTabMode,
        setActiveTab,
        setTabBarFocused,
        setShowFilter,
        setFilterBarFocused,
        setFilterFocusIdx,
        toggleFilterPill,
        clearFilters,
        toggleHideDone,
        toggleWordWrap,
        setNodes,
        confirmTagEdit,
        cancelTagEdit,
        confirmEdit,
        cancelEdit,
        startEdit,
        insertNode,
        deleteSelected,
        cycleGlobalFold,
        openTagEdit,
        jumpTo,
        commitNodes,
        undo,
        redo,
        msg,
    });

    return {
        containerRef,
        selectedRef,
        editRef,
        tagsRef,
        nodes,
        selectedId,
        editingId,
        editValue,
        tagsEditId,
        tagsEditValue,
        message,
        showHelp,
        showMd,
        showMeta,
        showSearch,
        searchQuery,
        wordWrap,
        toggleWordWrap,
        shiftHeld,
        filter,
        matchIds,
        cmdBuf,
        copied,
        visible,
        guideData,
        selIdx,
        selNode,
        allTags,
        markdownText,
        stats,
        handleKeyDown,
        setSelectedId,
        setEditValue,
        setTagsEditValue,
        setShowHelp,
        setShowMd,
        setShowSearch,
        setSearchQuery,
        setNodes,
        startEdit,
        confirmEdit,
        cancelEdit,
        openTagEdit,
        confirmTagEdit,
        cancelTagEdit,
        toggleCollapse,
        copyMarkdown,
        setFilter,
        showFilter,
        setShowFilter,
        filterBarFocused,
        filterFocusIdx,
        setFilterBarFocused,
        setFilterFocusIdx,
        tabMode,
        activeTab,
        tabList,
        tabBarFocused,
        setTabMode,
        setActiveTab,
    };
}
