# Action Schema Registry

This document defines the canonical registry of executable action schemas.
It is the single source of truth for all action keys that may be referenced by AI intent, the execution contract layer, and the simulation runtime.

## Purpose

- Prevent generative drift by locking AI to known action keys.
- Ensure execution mapping is consistent with simulation semantics.
- Provide a canonical reference for action validation and schema mapping.
- Enable Copilot and AI to verify action definitions before use.

## Scope

The registry covers all runtime actions that can be executed through `tickManager()`.
It does not define UI-only labels or purely narrative content.

## Registry Rules

- Every executable action key must be listed here.
- AI may propose intents only for registered keys.
- New action keys must be added to this registry before implementation.
- Execution Contract Layer must validate action keys against this registry.
- `/src/data/actions.js` must align with registry entries.

## Canonical Action Schema

```ts
type ActionSchema = {
  key: string;
  label: string;
  narrative: string;
  stCost: 'vlow' | 'low' | 'mid' | 'high' | 'rest_tiny' | 'rest_part' | 'rest_full';
  requirements?: {
    skill?: { id: string; level?: number };
    item?: { id: string; qty?: number };
    gold?: number;
    hpAbove?: number;
    staminaAbove?: number;
    timePeriod?: string[];
    area?: string[];
  };
  cooldownSeconds?: number;
  log?: string;
  npcReply?: { speaker: string; text: string };
  unlockSkill?: Skill;
  giveItem?: { id: string; name: string; qty: number };
  equipDrop?: { slot: string; item: EquipmentItem };
  addActions?: Record<string, string[]>;
  removeActions?: string[];
  skillXp?: { id: string; xp: number };
  cost?: { gold: number };
  hpRestore?: number;
  stRestore?: 'tiny' | 'small' | 'medium' | 'large';
};
```

## Registry Format

Each entry should include:

- `key`: canonical action identifier
- `label`: player-facing name
- `narrative`: description for engine and documentation
- `stCost`: stamina cost category
- `requirements`: preconditions for execution
- `cooldownSeconds`: optional spam control
- `effects`: runtime effects the action may produce

## Action Space v1

Core survival:

- `forage`
- `rest`
- `move`

Economic and craft:

- `farm`
- `gather_water`
- `hunt`
- `chop_wood`
- `mine`
- `forge`
- `craft_item`

Magic and arcane:

- `cast_magic`
- `channel_arcane`
- `study_arcane`
- `meditate`

Social:

- `communicate`
- `share_information`
- `trade` (registered legacy action key for repeated exchange patterns)
- `teach`

Combat:

- `attack`
- `defend`
- `flee`

Action semantics and field coupling hints are defined in:

```text
src/simulation/actions/actionProfiles.js
```

Profiles may define additive field perturbation signatures. They may not mutate fields or execute outside `tickManager()`.

## Example Entries

```md
- key: forage
  label: Forage
  narrative: Search the nearby area for edible plants and small resources.
  stCost: low
  requirements:
    area: ["forest", "meadow"]
  cooldownSeconds: 300

- key: rest
  label: Rest at Camp
  narrative: Spend time recovering health and stamina.
  stCost: rest_full
  requirements:
    area: ["camp"]
  cooldownSeconds: 900

- key: share_information
  label: Share Information
  narrative: Communicate one remembered event to a nearby agent.
  stCost: vlow
  requirements:
    nearbyAgent: true
    memory: true
```

## Validation Contract

To avoid drift, the execution contract must verify:

- the action key exists in this registry
- the action schema matches registry requirements
- the action can be executed in the current DF context
- the runtime mapping is explicit and documented

## Related Documentation

- `docs/07_action_system.md` — action schema behavior and resolver rules
- `AI/EXECUTION_MODEL.md` — execution contract and validation checklist
- `/src/data/actions.js` — concrete action definitions
