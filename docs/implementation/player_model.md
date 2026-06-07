# Player Model Implementation Mapping

This document maps the current player state to the future agent-compatible model.

## Current Player Function

The player is currently the only active decision source.

The UI provides action buttons, and the player chooses one directly.

## Future Player Function

The player should remain a special agent:

- Human-selected intent source
- Same validation layer as other agents
- Same execution layer as other agents
- Same trace output shape as other agents

## Mapping

| Current Player Field | Future Meaning |
| --- | --- |
| `hp` | Physical state |
| `stamina` | Physical state and action capacity |
| `gold` | Economic state |
| `currentArea` | Location |
| `skills` | Capability and structured learning |
| `equippedSkills` | Active identity/capability set |
| `inventory` | Carried resources |
| `equipped` | Equipment-derived modifiers |
| `discoveredActions` | Player knowledge / unlocked affordances |

## Implementation Rule

The player may choose an action manually, but the selected action should still pass through validation and execution.

Manual player choice should not bypass the future kernel shape.
