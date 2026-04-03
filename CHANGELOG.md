# Changelog

## Unreleased (Since Last Commit)

### Features
- **Tab Bar Component**: Added new `TabBar` component for switching between filtered views
- **Tab Mode**: Implemented tab mode cycling with three states: `none`, `by tag`, and `by heading`
  - Press `T` to cycle through tab modes
  - When enabled, shows a tab bar below the topbar
  - Navigate tabs with `h`/`l` (left/right arrow keys) when tab bar is focused
  - Press `Enter` to toggle focus between tab bar and item list
- **Tab Filtering**: Added `applyTabFilter` function to filter nodes by tag or heading
  - Supports inheriting ancestor tags automatically
  - Maintains tree context by including parent nodes
- **Tab State Management**: New state properties in `useOrgState` hook
  - `tabMode`: Current tab mode ('none' | 'tag' | 'heading')
  - `activeTab`: Currently selected tab
  - `tabList`: List of available tabs
  - `tabBarFocused`: Whether tab bar has keyboard focus

### User Interface
- Updated help overlay to include new tab-related keybindings
  - `T / Shift+t`: Cycle tab mode
  - `Enter`: Focus tab bar (when tabs visible)
  - `h / ← or l / →`: Previous/next tab (when tab bar focused)
  - `j / k or Esc`: Return focus to item list
- Tab bar displays mode indicator and tab labels with visual feedback
- Tab bar focuses on selected tab with blue outline when active
- Selection text no longer triggers container focus (prevent accidental selection loss)
- Double-click behavior removed from OrgNodeRow

### Code Quality
- **Formatting**: Applied consistent code formatting across all components
  - Standardized indentation to 4 spaces
  - Consistent spacing around imports and function parameters
  - Improved readability of JSX and object literals
- **Code Style**: Added `.prettierrc` configuration file
  - Single quotes for strings
  - Semicolons enabled
  - 100-character print width
  - Tab width: 4 spaces
  - Trailing commas: all

### Modifications by File

#### New Files
- `src/components/TabBar.tsx` - Tab bar UI component
- `.prettierrc` - Prettier configuration for consistent code formatting

#### Modified Components
- `src/app/App.tsx` - Integrated TabBar component, improved formatting
- `src/components/FilterBar.tsx` - Code formatting improvements
- `src/components/HelpOverlay.tsx` - Updated help text with tab keybindings
- `src/components/MarkdownPanel.tsx` - Code formatting improvements
- `src/components/Modeline.tsx` - Code formatting improvements
- `src/components/OrgNodeRow.tsx` - Improved selection/focus handling, formatting
- `src/components/SearchOverlay.tsx` - Code formatting improvements
- `src/components/Topbar.tsx` - Code formatting improvements

#### Modified Core Files
- `src/hooks/useOrgState.ts` - Added tab state management and keyboard handlers
- `src/lib/tree.ts` - Added `applyTabFilter` function for tab-based filtering
- `src/lib/mutations.ts` - Code formatting improvements
- `src/lib/markdown.ts` - Code formatting improvements
- `src/data.ts` - Code formatting improvements (improved readability of initial data)
- `src/main.tsx` - Fixed import formatting
- `src/theme.ts` - Code formatting improvements
- `src/types.ts` - Code formatting improvements

### Keyboard Shortcuts Added
- `T`: Cycle tab mode (off → by tag → by heading)
- `Enter`: Toggle tab bar focus when tabs are visible
- `h` / `←` or `l` / `→`: Navigate between tabs (when tab bar focused)
- `j` / `k` or `Esc`: Return focus to item list (from tab bar)

### Technical Details
- Tab filtering respects collapsed state and filter settings
- Active tab selection is maintained across node updates
- Tab bar navigation disabled when Escape key is pressed
- Tab bar appearance updates based on focus state
- Base inheritance system for tags in heading mode uses ancestor tag lookups
