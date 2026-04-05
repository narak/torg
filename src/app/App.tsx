import React from 'react';
import '../styles/fonts.css';
import { useOrgState } from '../hooks/useOrgState';
import { OrgNodeRow } from '../components/OrgNodeRow';
import { MarkdownPanel } from '../components/MarkdownPanel';
import { HelpOverlay } from '../components/HelpOverlay';
import { SearchOverlay } from '../components/SearchOverlay';
import { Topbar } from '../components/Topbar';
import { FilterBar } from '../components/FilterBar';
import { TabBar } from '../components/TabBar';
import { Modeline } from '../components/Modeline';
import { C } from '../theme';

export default function App() {
    const state = useOrgState();
    const {
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
        showHelp,
        showMd,
        showMeta,
        showSearch,
        searchQuery,
        shiftHeld,
        cmdBuf,
        message,
        copied,
        showFilter,
        filter,
        matchIds,
        tabMode,
        activeTab,
        tabList,
        tabBarFocused,
        filterBarFocused,
        filterFocusIdx,
        wordWrap,
        driveStatus,
        driveLastSynced,
        driveFileUrl,
        driveConfigured,
        setTabMode,
        setActiveTab,
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
        setShowFilter,
        setFilter,
        confirmEdit,
        cancelEdit,
        openTagEdit,
        confirmTagEdit,
        cancelTagEdit,
        toggleCollapse,
        copyMarkdown,
    } = state;

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{
                fontSize: '14px',
                backgroundColor: C.bg,
                color: C.fg,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                outline: 'none',
                overflow: 'hidden',
                lineHeight: '1.55',
            }}
        >
            <Topbar
                selNode={selNode}
                selIdx={selIdx}
                visibleCount={visible.length}
                stats={stats}
                driveStatus={driveStatus}
                driveLastSynced={driveLastSynced}
                driveFileUrl={driveFileUrl}
                driveConfigured={driveConfigured}
            />

            {tabMode !== 'none' && (
                <TabBar
                    tabMode={tabMode}
                    tabList={tabList}
                    activeTab={activeTab}
                    nodes={nodes}
                    focused={tabBarFocused}
                    onTabSelect={setActiveTab}
                    onClose={() => setTabMode('none')}
                />
            )}

            {showFilter && (
                <FilterBar
                    filter={filter}
                    allTags={allTags}
                    matchCount={matchIds.size}
                    totalCount={nodes.length}
                    onFilterChange={setFilter}
                    onClose={() => setShowFilter(false)}
                    focused={filterBarFocused}
                    focusIdx={filterFocusIdx}
                />
            )}

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Org buffer */}
                <div
                    style={{ flex: 1, overflowY: 'auto', padding: '4px 0', minWidth: 0 }}
                    onClick={() => {
                        if (!window.getSelection()?.toString()) containerRef.current?.focus();
                    }}
                >
                    {visible.map((node, idx) => (
                        <OrgNodeRow
                            key={node.id}
                            node={node}
                            nodes={nodes}
                            isSel={node.id === selectedId}
                            isEdit={node.id === editingId}
                            editValue={editValue}
                            guideInfo={guideData[idx]}
                            selectedRef={node.id === selectedId ? selectedRef : undefined}
                            editRef={editRef}
                            editingId={editingId}
                            onSelect={() => {
                                if (!window.getSelection()?.toString()) {
                                    setSelectedId(node.id);
                                    containerRef.current?.focus();
                                }
                            }}
                            onDoubleClick={() => {}}
                            onEditChange={setEditValue}
                            onConfirmEdit={confirmEdit}
                            onCancelEdit={cancelEdit}
                            onToggleCollapse={() => toggleCollapse(node.id)}
                            onOpenTagEdit={() => {
                                setSelectedId(node.id);
                                openTagEdit(node.id);
                            }}
                            showMeta={showMeta}
                            shiftHeld={shiftHeld}
                            isMatch={matchIds.size > 0 ? matchIds.has(node.id) : null}
                            wordWrap={wordWrap}
                        />
                    ))}
                    <div style={{ height: '40px' }} />
                </div>

                {/* Markdown panel */}
                {showMd && (
                    <MarkdownPanel
                        markdownText={markdownText}
                        copied={copied}
                        onCopy={copyMarkdown}
                        onClose={() => setShowMd(false)}
                    />
                )}
            </div>

            {!wordWrap && selNode && selNode.title && (
                <div
                    style={{
                        backgroundColor: C.bgAlt,
                        borderTop: `1px solid ${C.border}`,
                        padding: '2px 14px',
                        fontSize: '12px',
                        color: C.dimBright,
                    }}
                >
                    {selNode.title}
                </div>
            )}

            <Modeline
                message={message}
                cmdBuf={cmdBuf}
                tagsEditId={tagsEditId}
                tagsEditValue={tagsEditValue}
                allTags={allTags}
                tagsRef={tagsRef}
                onTagsChange={setTagsEditValue}
                onConfirmTagEdit={confirmTagEdit}
                onCancelTagEdit={cancelTagEdit}
            />

            {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
            {showSearch && (
                <SearchOverlay
                    nodes={nodes}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onSelect={(id) => {
                        setSelectedId(id);
                        containerRef.current?.focus();
                    }}
                    onClose={() => {
                        setShowSearch(false);
                        containerRef.current?.focus();
                    }}
                />
            )}
        </div>
    );
}
