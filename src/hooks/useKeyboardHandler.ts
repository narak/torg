import { useRef, useCallback } from 'react';
import type { OrgNode } from '../types';
import {
    nodeHasChildren,
    findParent,
    findPrevSibling,
    findNextSibling,
    findFirstSibling,
    findLastSibling,
} from '../lib/tree';
import {
    cycleTodo,
    cyclePriority,
    demoteSubtree,
    promoteSubtree,
    moveSubtreeDown,
    moveSubtreeUp,
} from '../lib/mutations';

export interface KeyboardHandlerDeps {
    // Reactive state
    showHelp: boolean;
    showSearch: boolean;
    showMeta: boolean;
    showMd: boolean;
    tagsEditId: string | null;
    editingId: string | null;
    cmdBuf: string;
    selIdx: number;
    visible: OrgNode[];
    nodes: OrgNode[];
    selectedId: string;
    tabMode: 'none' | 'tag' | 'heading';
    tabList: string[];
    tabBarFocused: boolean;
    // Stable setters (omitted from useCallback deps)
    setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
    setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMd: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMeta: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedId: (id: string) => void;
    setCmdBuf: React.Dispatch<React.SetStateAction<string>>;
    setTabMode: React.Dispatch<React.SetStateAction<'none' | 'tag' | 'heading'>>;
    setActiveTab: React.Dispatch<React.SetStateAction<string | null>>;
    setTabBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
    setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
    setNodes: React.Dispatch<React.SetStateAction<OrgNode[]>>;
    // Memoized callbacks
    confirmTagEdit: () => void;
    cancelTagEdit: () => void;
    confirmEdit: () => void;
    cancelEdit: () => void;
    startEdit: (nodeId: string) => void;
    insertNode: (below: boolean) => void;
    deleteSelected: () => void;
    cycleGlobalFold: () => void;
    openTagEdit: (nodeId: string) => void;
    jumpTo: (id: string | null, label: string) => void;
    commitNodes: (next: OrgNode[] | ((prev: OrgNode[]) => OrgNode[])) => void;
    undo: () => void;
    redo: () => void;
    msg: (m: string) => void;
}

export function useKeyboardHandler({
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
}: KeyboardHandlerDeps): (e: React.KeyboardEvent<HTMLDivElement>) => void {
    const cmdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            // ── Modal / overlay early exits ───────────────────────────────────────────
            const handleModalKeys = (): boolean => {
                if (showHelp) {
                    if (['Escape', '?', 'q'].includes(e.key)) { e.preventDefault(); setShowHelp(false); }
                    return true;
                }
                if (showSearch) {
                    if (e.key === 'Escape') { e.preventDefault(); setShowSearch(false); }
                    return true;
                }
                if (tagsEditId) {
                    if (e.key === 'Enter') { e.preventDefault(); confirmTagEdit(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelTagEdit(); }
                    return true;
                }
                if (editingId) {
                    if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                    return true;
                }
                return false;
            };

            if (handleModalKeys()) return;

            const { key, altKey, shiftKey, ctrlKey } = e;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key))
                e.preventDefault();
            if (cmdTimer.current) clearTimeout(cmdTimer.current);

            // ── Navigation ────────────────────────────────────────────────────────────
            const handleNavKeys = (): boolean => {
                if ((key === 'ArrowDown' || key === 'j') && !altKey && !ctrlKey && !shiftKey) {
                    if (tabBarFocused) { setTabBarFocused(false); msg(''); }
                    if (selIdx < visible.length - 1) setSelectedId(visible[selIdx + 1].id);
                    setCmdBuf('');
                    return true;
                }
                if ((key === 'ArrowUp' || key === 'k') && !altKey && !ctrlKey && !shiftKey) {
                    if (tabBarFocused) { setTabBarFocused(false); msg(''); }
                    if (selIdx > 0) setSelectedId(visible[selIdx - 1].id);
                    setCmdBuf('');
                    return true;
                }
                if ((key === 'h' || key === 'ArrowLeft') && !altKey && !ctrlKey && !shiftKey) {
                    if (tabBarFocused) {
                        setActiveTab((prev) => {
                            if (!prev || tabList.length === 0) return prev;
                            const i = tabList.indexOf(prev);
                            return tabList[Math.max(0, i - 1)];
                        });
                        setCmdBuf('');
                        return true;
                    }
                    const curNode = nodes.find((n) => n.id === selectedId);
                    if (curNode && !curNode.collapsed && nodeHasChildren(nodes, selectedId)) {
                        setNodes((prev) =>
                            prev.map((n) => (n.id === selectedId ? { ...n, collapsed: true } : n)),
                        );
                        msg('Subtree folded');
                    } else {
                        jumpTo(findParent(nodes, selectedId), 'parent');
                    }
                    setCmdBuf('');
                    return true;
                }
                if ((key === 'l' || key === 'ArrowRight') && !altKey && !ctrlKey && !shiftKey) {
                    if (tabBarFocused) {
                        setActiveTab((prev) => {
                            if (!prev || tabList.length === 0) return prev;
                            const i = tabList.indexOf(prev);
                            return tabList[Math.min(tabList.length - 1, i + 1)];
                        });
                        setCmdBuf('');
                        return true;
                    }
                    const curNode = nodes.find((n) => n.id === selectedId);
                    if (curNode && nodeHasChildren(nodes, selectedId)) {
                        const newNodes = curNode.collapsed
                            ? nodes.map((n) => (n.id === selectedId ? { ...n, collapsed: false } : n))
                            : nodes;
                        if (curNode.collapsed) setNodes(newNodes);
                        const cIdx = newNodes.findIndex((n) => n.id === selectedId);
                        if (
                            cIdx !== -1 &&
                            cIdx + 1 < newNodes.length &&
                            newNodes[cIdx + 1].level > curNode.level
                        ) {
                            setSelectedId(newNodes[cIdx + 1].id);
                            msg(curNode.collapsed ? 'Expanded → first child' : '→ first child');
                        }
                    } else {
                        msg('(no children)');
                    }
                    setCmdBuf('');
                    return true;
                }
                if (key === '[' || (key === 'ArrowUp' && ctrlKey)) {
                    e.preventDefault();
                    jumpTo(findPrevSibling(visible, selectedId), 'previous sibling');
                    setCmdBuf('');
                    return true;
                }
                if (key === ']' || (key === 'ArrowDown' && ctrlKey)) {
                    e.preventDefault();
                    jumpTo(findNextSibling(visible, selectedId), 'next sibling');
                    setCmdBuf('');
                    return true;
                }
                if (key === 'u' || (key === 'ArrowLeft' && ctrlKey)) {
                    e.preventDefault();
                    jumpTo(findParent(nodes, selectedId), 'parent');
                    setCmdBuf('');
                    return true;
                }
                if (key === '{') {
                    jumpTo(findFirstSibling(visible, selectedId), 'first sibling');
                    setCmdBuf('');
                    return true;
                }
                if (key === '}') {
                    jumpTo(findLastSibling(visible, selectedId), 'last sibling');
                    setCmdBuf('');
                    return true;
                }
                if (key === 'g') {
                    if (cmdBuf === 'g') {
                        setSelectedId(visible[0].id);
                        msg('Top');
                        setCmdBuf('');
                        return true;
                    }
                    setCmdBuf('g');
                    msg('g-');
                    cmdTimer.current = setTimeout(() => { setCmdBuf(''); msg(''); }, 1500);
                    return true;
                }
                if (key === 'G') {
                    setSelectedId(visible[visible.length - 1].id);
                    msg('Bottom');
                    setCmdBuf('');
                    return true;
                }
                return false;
            };

            // ── Mutations ─────────────────────────────────────────────────────────────
            const handleMutationKeys = (): boolean => {
                if ((key === 'F' || key === 'f') && !altKey && !ctrlKey) {
                    cycleGlobalFold();
                    setCmdBuf('');
                    return true;
                }
                if (key === '<' && !ctrlKey) {
                    const result = promoteSubtree(nodes, selectedId);
                    if (result !== nodes) {
                        commitNodes(result);
                        msg('Promoted ← (unindented)');
                    } else msg('(already at top level)');
                    setCmdBuf('');
                    return true;
                }
                if (key === '>' && !ctrlKey) {
                    const result = demoteSubtree(nodes, selectedId);
                    if (result !== nodes) {
                        commitNodes(result);
                        msg('Demoted → (indented)');
                    } else msg('(max depth reached)');
                    setCmdBuf('');
                    return true;
                }
                if (key === 'Enter') {
                    e.preventDefault();
                    if (tabBarFocused) {
                        setTabBarFocused(false);
                        msg('');
                        setCmdBuf('');
                        return true;
                    }
                    startEdit(selectedId);
                    setCmdBuf('');
                    return true;
                }
                if (key === 't' && !altKey && !ctrlKey) {
                    commitNodes((prev) =>
                        prev.map((n) => {
                            if (n.id !== selectedId) return n;
                            const ns = cycleTodo(n.state);
                            msg(`State → ${ns ?? '(none)'}`);
                            return { ...n, state: ns };
                        }),
                    );
                    setCmdBuf('');
                    return true;
                }
                if (key === 'p' && !altKey && !ctrlKey) {
                    commitNodes((prev) =>
                        prev.map((n) => {
                            if (n.id !== selectedId) return n;
                            const np = cyclePriority(n.priority);
                            msg(`Priority → ${np ? `[#${np}]` : '(none)'}`);
                            return { ...n, priority: np };
                        }),
                    );
                    setCmdBuf('');
                    return true;
                }
                if (key === ':' && !ctrlKey) {
                    e.preventDefault();
                    openTagEdit(selectedId);
                    setCmdBuf('');
                    return true;
                }
                if (key === 'o' && !altKey && !ctrlKey && !shiftKey) {
                    e.preventDefault();
                    insertNode(true);
                    setCmdBuf('');
                    return true;
                }
                if (key === 'O' && !altKey && !ctrlKey) {
                    e.preventDefault();
                    insertNode(false);
                    setCmdBuf('');
                    return true;
                }
                if (altKey && key === 'ArrowDown') {
                    commitNodes((prev) => moveSubtreeDown(prev, selectedId));
                    msg('Moved ↓');
                    return true;
                }
                if (altKey && key === 'ArrowUp') {
                    commitNodes((prev) => moveSubtreeUp(prev, selectedId));
                    msg('Moved ↑');
                    return true;
                }
                if (altKey && key === 'ArrowRight') {
                    commitNodes((prev) => demoteSubtree(prev, selectedId));
                    msg('Demoted →');
                    return true;
                }
                if (altKey && key === 'ArrowLeft') {
                    commitNodes((prev) => promoteSubtree(prev, selectedId));
                    msg('Promoted ←');
                    return true;
                }
                if (key === 'd') {
                    if (cmdBuf === 'd') {
                        deleteSelected();
                        setCmdBuf('');
                        return true;
                    }
                    setCmdBuf('d');
                    msg('d-  (press d again to kill)');
                    cmdTimer.current = setTimeout(() => { setCmdBuf(''); msg(''); }, 1500);
                    return true;
                }
                return false;
            };

            // ── UI / view ─────────────────────────────────────────────────────────────
            const handleUIKeys = (): boolean => {
                if (key === 'M' && !altKey && !ctrlKey) {
                    setShowMd((v) => !v);
                    msg(showMd ? 'Markdown panel closed' : 'Markdown export panel open');
                    setCmdBuf('');
                    return true;
                }
                if (key === 'z' && !altKey && !ctrlKey && !shiftKey) {
                    undo();
                    setCmdBuf('');
                    return true;
                }
                if (key === 'Z' && !altKey && !ctrlKey) {
                    redo();
                    setCmdBuf('');
                    return true;
                }
                if (key === 'I' && !altKey && !ctrlKey) {
                    setShowMeta((v) => !v);
                    msg(showMeta ? 'Metadata annotations off' : 'Metadata annotations on');
                    setCmdBuf('');
                    return true;
                }
                if (key === 'T' && !altKey && !ctrlKey) {
                    setTabMode((prev) => {
                        const next = prev === 'none' ? 'tag' : prev === 'tag' ? 'heading' : 'none';
                        msg(next === 'none' ? 'Tabs: off' : `Tabs: by ${next}`);
                        if (next === 'none') {
                            setActiveTab(null);
                            setTabBarFocused(false);
                        } else {
                            setTabBarFocused(true);
                        }
                        return next;
                    });
                    setCmdBuf('');
                    return true;
                }
                if (key === '\\' && !ctrlKey && !altKey) {
                    e.preventDefault();
                    setShowFilter((v) => !v);
                    setCmdBuf('');
                    return true;
                }
                if ((key === '/' && !ctrlKey) || (key === 'k' && (e.metaKey || ctrlKey))) {
                    e.preventDefault();
                    setShowSearch(true);
                    setCmdBuf('');
                    return true;
                }
                if (key === '?') {
                    e.preventDefault();
                    setShowHelp((v) => !v);
                    setCmdBuf('');
                    return true;
                }
                if (key === 'Escape') {
                    setCmdBuf('');
                    if (tabMode !== 'none' && !tabBarFocused) {
                        setTabBarFocused(true);
                        msg('Tab bar focused — h/l to navigate');
                        return true;
                    }
                    if (tabBarFocused) {
                        setTabBarFocused(false);
                        msg('');
                        return true;
                    }
                    setShowHelp(false);
                    setShowSearch(false);
                    setShowFilter(false);
                    msg('');
                    return true;
                }
                return false;
            };

            if (handleNavKeys()) return;
            if (handleMutationKeys()) return;
            if (handleUIKeys()) return;

            if (key.length === 1) setCmdBuf('');
        },
        [
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
        ],
    );
}
