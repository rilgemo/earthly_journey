# 03 Decision System

## Current Status

No autonomous agent decision system is implemented yet.

Current gameplay decisions are player-driven through visible actions, action requirements, stamina thresholds, and discovered action availability.

## Current Action Selection Model

Available actions are determined by:

- The player's current area
- The area's `actions`
- The player's `discoveredActions`
- Action `requirements`
- Current multidimensional biological condition and stamina
- World time period
- Cooldowns, when defined

## Future Direction

A future AI decision system may evaluate agent context, score possible actions, and select behavior based on needs, memory, skills, and world state.

This document is intentionally a placeholder until that system is explicitly designed.
