# 00 Overview

## Project Overview

- **Type:** Single-player browser-based text RPG built with React
- **Core Loop:** Area exploration -> action execution -> skill growth and discovery
- **World Name:** Earthly
- **Long-term Vision:** A sandbox living world with simulated agent ecology and exchange structures

## Stack

- **Framework:** React with Create React App
- **Styling:** Inline CSS-in-JS
- **UI Libraries:** None
- **Color System:** Use the `C` token object exported from `src/App.js`

## Current File Structure

```text
src/
|-- App.js                # Core state, game logic, layout shell
|-- data/
|   |-- areas.js          # Area definitions
|   |-- actions.js        # Action definitions
|   |-- skills.js         # Skill definitions, slot limits, XP rules
|   `-- config.js         # Constants (EPOCH_MS, TIME_MULTIPLIER)
|-- utils/
|   `-- worldTime.js      # getWorldTime() pure function
`-- components/
    |-- LeftPanel.jsx     # HP/Stamina bars, stats, status display
    |-- MainPanel.jsx     # Narrative pane, action buttons, message feed
    `-- RightPanel.jsx    # Skills, equipment, inventory display
```
