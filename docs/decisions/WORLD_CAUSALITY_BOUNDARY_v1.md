# World Causality Boundary v1

Status: Frozen

## Scope
Defines the division of responsibility between Will and World Causality.
Applies to any Will Source (Player, NPC, future types) — not Player-specific
or NPC-specific. Upstream of Player-Character Agency Boundary.

## Established
1. Only a Will Source may originate a new world-changing action.
2. World causality may advance and resolve existing actions according to
   world rules.
3. World causality may never originate a new action on behalf of a Will
   Source.

## Design Intuition (Non-normative)
The world may continue consequences, but it never invents decisions.

## Review Heuristic
For any new system:
1. Does it originate a new world-changing action on its own?
   - No → passes.
   - Yes → go to 2.
2. Is the originator a recognized Will Source?
   - No → violates this Boundary.

## Confirmed Case
Player Entity Offline Continuity: Player Character remains in WorldState
after input disconnect. World Resolution continues normally (environment,
NPC/creature interaction, combat, injury, death — e.g. a player
disconnecting mid-combat with a wolf can result in character death and
becoming the wolf's food). No offline mode, no protection state, no AI
takeover, no special player exception.

## Reopen Condition
Only re-evaluate if/when the Repository introduces a new Entity Category
or new Will Source type. No current open question exists.

## Excluded (Deferred to Execution Layer)
No intermediate execution abstraction (Commitment, Action, Instance, Event,
Command) is named or implied by this Boundary. These remain open for the
Execution Layer to define, per Foundation-must-not-depend-on-implementation
discipline.
