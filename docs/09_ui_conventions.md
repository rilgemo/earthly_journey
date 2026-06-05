# 09 UI Conventions

## Layout

- 3-column grid with widths `190px | 1fr | 220px`
- Top bar includes breadcrumb, world time, and gold
- Colors always reference the `C` token from `src/App.js`
- Do not hardcode color values

## MainPanel Flow

Top to bottom:

1. Narrative text: scrollable area for current action or area description
2. Action buttons: vertical stack, no section labels
3. Message feed: fixed at bottom, auto-scroll to newest entry

## Button Styles

- Action: transparent background, `C.border` border, `C.text` text
- Rest: transparent background, `C.green` border, prefixed with a diamond symbol
- Travel: `C.accentDim` background, `C.accent` border, prefixed with a right-arrow symbol

A divider separates Action/Rest buttons from Travel buttons.

## Rendering Rules

- UI never contains game logic.
- Components are presentation-only.
- Components must not contain game content.
- Components render data only.
- Undiscovered actions and locked skills must not render placeholders or hints.
- All system, NPC, and player events appear in the unified message feed.
