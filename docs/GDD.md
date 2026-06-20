# Earthly Journey — Game Design Document
> Status: living document, design confirmed in principle / implementation ongoing
> Language: English (this is a dev-facing document — see Language Convention in CLAUDE.md)

---

## 0. Core Vision

> Let the world have people living in it first. Worry about consciousness later.

The long-term direction of Earthly Journey: move from "a system that computes" to "a world where people genuinely live their lives." NPC complexity is layered in only as needed — first existence (location + schedule), then state (needs + emotion), then interaction (economy + relationships), and only then memory and personality depth. Each layer must be validated as a minimal playable version before the next is added.

"Existence layers" can be used as a design-thinking framework, but code and data always use game language (NPC, skill, affinity, memory), never abstract architecture terminology.

**World state may be numeric. Player understanding must be narrative.**
Internal state (action logs, dominance ratios, trends) is never shown directly to the player. A Narrator layer compresses history into qualitative perception. The Narrator compresses — it does not invent. If no real trend exists, it must not manufacture one (e.g. "growing more diligent" when nothing has actually changed).

---

## 0.2 Validated Principles

Principles confirmed through implementation and testing (2026-06),
kept here as ongoing design guardrails:

- **Need is a constraint, not a source of identity.** Physiological
  state may limit what is feasible; it must not be the primary driver
  of what an individual prefers to do.
- **The Narrator compresses history; it does not invent story.** If no
  real change has occurred, the system must say so, not manufacture
  a trend for dramatic effect.
- **Identity drift must remain bounded.** Behaviour can shift gradually
  over time, but a person should not become unrecognisable — drift is
  computed as a deviation from a stable baseline, not as accumulating
  mutation.
- **Internal state stays hidden from the player.** Raw numbers,
  percentages, and counts are implementation detail. What the player
  receives is always narrative.

---

## 0.1 Magic — Design Principles (Concept Stage, Not Implemented)

Not rules. Direction only. Currently **no implementation**.

1. Magic is not skill-release.
2. Magic comes from understanding and intervention, not equipping/consuming a resource.
3. An individual cannot carry unlimited change — capacity is a constraint, not a source of desire.
4. The world remembers sustained influence (bidirectional accumulation: shaping or destabilizing — the result is defined by the observer; the world itself simply "accepted a change").
5. Changing the world is not guaranteed to be beneficial.

### Mana — directional interpretation (not final design)

If a mana concept is kept, it leans toward "capacity to carry" rather than "mana reserve" — current/capacity describe how much world-interference an individual can still sustain, not how many more spells they can cast. Recovery (sitting quietly, meditating, etc.) is a side effect of behaviour, not the goal of behaviour — an individual does not "want to restore capacity," they simply "feel tired, so they sit down" — capacity recovery is just the result.

What limits magic is **understanding + capacity + the world's permission**, not running out of a number.

### Relationship to the Simulation Sandbox

The field / mana / influence / need mechanics in the Sandbox are early experiments and **do not represent the final implementation**. Whether the Sandbox's "need drives intent" paradigm is even compatible with the above principles is itself still an open question — the current implementation should not be assumed to be "an early draft awaiting fixes"; it may be "a direction awaiting re-evaluation."

---

## 1. Core Concept

A **text-based RPG** built as a **skill-combination sandbox MMO**.

All players coexist in a shared world. Through free exploration, combat, and crafting, players gradually discover and combine skills, carving out their own unique path. The world is shaped collectively by its players. The game never tells the player "you can do X" — **discovery is the reward.**

### Three Reference Inspirations

| Reference | Core design contribution |
|---|---|
| *An Old Man's VRMMO Activity Log* | Slow-paced living, non-combat skills with equal depth, the hidden value of "useless" skills |
| *Only Sense Online* | Free combination of skills (Senses), the pressure of limited slots, walking a path nobody else has |
| *Theory of Magic* | Skills surface naturally through exploratory action, items as unlock triggers, an event log that records discovery |

---

## 2. World Setting

- **World name**: Earthly
- **Setting**: A medieval-inspired sword-and-magic fantasy world
- **Genre**: Text RPG × Sandbox MMO
- **Interaction**: Menu/button-driven, narrated in text-RPG style

---

## 3. Character System

### 3.1 Starting Point
- All players enter the world with **no skills, no attribute bonuses**
- No forced tutorial — skill discovery happens purely through player exploration
- The same character persists in a shared world (MMO architecture)

### 3.2 Skill Slots

Players have a limited number of skill slots. Equipped skills determine the character's attributes and growth direction.

**Slot unlock progression (test mode):**

Currently all 10 slots are open from the start, for testing purposes. The progression below is the intended design for the live version:

| Slot | Unlock condition | Design intent |
|---|---|---|
| Slot 1 | First interaction with any NPC or object after entering the world | Make the player feel "discovery" from their very first step |
| Slot 2 | First skill reaches Lv.2 | Encourage focused practice on one skill |
| Slot 3 | Player holds 2 skills from different categories | Push the player to try different directions |
| Slot 4–6 | TBD | — |
| Slot 7–9 | TBD | — |
| Slot 10 | A deeply hidden condition (reachable by very few players) | A reward for true explorers |

**Soft cap: 10 slots** (a future means of exceeding this may exist, TBD)

**Rules:**
- Unequipped skills produce no attribute effects and gain no XP
- Skills can be re-equipped freely while in a safe zone (town)
- Skill fusion requires the relevant skills to be **equipped simultaneously**

---

## 4. Skill System

### 4.1 Design Philosophy: "Discovery Is the Reward"

Players can only ever see content they have already unlocked. Undiscovered skills are entirely invisible — no "locked" hints of any kind.

```
❌ Wrong: showing "??? Mystery Skill (requires: Swordsmanship Lv.5)"
✅ Right: once the condition is met, the event log suddenly shows "New skill unlocked"
```

The one exception: a skill may show a vague hint just before it evolves. For example:
> "You sense your understanding of [Swordsmanship] is about to break through some kind of threshold…"

### 4.2 Three Layers of Discovery

**Layer 1: World exploration discovery**
- Entering a region or triggering a specific encounter unlocks a related skill
- Example: after venturing deep into a mine, the log shows "Your sense for minerals has sharpened — [Ore Identification] unlocked"

**Layer 2: Action-chain discovery**
- Repeating an action enough times unlocks derived actions or skills
- Players only ever see currently-unlocked actions, never the full list
- Example: enough repetitions of "Gather Herbs" unlocks "Judge Herb Quality"

**Layer 3: Item/environment-triggered discovery**
- Holding or using a specific item unlocks a corresponding skill
- Some skills only trigger in specific locations (developer-hidden content)
- Example: picking up a worn blacksmithing manual unlocks [Basic Forging]

### 4.3 Skill Unlock Paths

```
Base skill (unlocked via exploration / action / item)
    │
    ├── Evolution: single skill reaches a level threshold → upgraded skill
    │         e.g. [Gathering Lv.5] → [Precise Gathering]
    │
    ├── Fusion: multiple skills simultaneously meet conditions → entirely new skill
    │         e.g. [Cooking Lv.3] + [Poisonous Herb Knowledge Lv.2] → [Poison Compounding]
    │         (Fusion skills require the source skills to be equipped simultaneously)
    │
    └── Hidden unlock: specific behaviour/location/item combination
                  No system hint to the player — found purely through exploration
```

### 4.4 Skill Categories (initial)

| Category | Example skills |
|---|---|
| Combat | Swordsmanship, Shield Use, Parry, Backstab, Magic |
| Production | Forging, Cooking, Alchemy, Tailoring |
| Gathering | Herb Gathering, Mining, Woodcutting, Fishing |
| Support | Appraisal, Negotiation, Perception, Healing, Meditation |
| Hidden | ??? |

---

## 5. Stamina System

### 5.1 Core Concept

Stamina is a resource independent from HP, representing the character's energy state. All actions consume stamina, requiring periodic rest. Stamina does not affect life or death, but heavily affects efficiency and success rates.

### 5.2 Stamina State Tiers

| State | Stamina range | Effect |
|---|---|---|
| **Full** | 70%–100% | All attributes perform normally |
| **Tired** | 30%–69% | No notable effect |
| **Warning** | 10%–29% | All attributes' effective value ×0.7 |
| **Critical** | 0%–9% | All attributes' effective value ×0.5, some actions unavailable |

### 5.3 Action Stamina Cost (relative, no exact numbers shown)

| Action type | Cost level |
|---|---|
| Combat | High |
| Gathering / crafting (forging, etc.) | Medium |
| Exploration / movement | Low |
| Conversation / reading | Very low |
| Resting | Restores |

### 5.4 Rest Methods

| Method | Condition | Restoration |
|---|---|---|
| **Inn** (paid) | In town, costs gold | Full restore |
| **Campsite** (free) | Safe outdoor area | Partial restore |
| **Time passage** (automatic) | Anywhere, slow continuous restoration over time | Very small continuous restore |

### 5.5 UI Presentation

- Stamina is shown as a **progress bar**, no exact number displayed
- Bar colour shifts with state: green → yellow → orange → red
- Entering Warning/Critical state triggers a hint in the event log

---

## 6. Attribute System

### 6.1 Core Concept: "Skills Are the Source of Attributes"

> The character has no independent attribute-point allocation system. All attributes are determined entirely by **currently equipped skills** and their **proficiency**.

- Changing equipped skills = changing the character's role
- Higher skill proficiency = larger attribute contribution
- Every skill contributes to multiple attributes, with a primary and secondary focus

### 6.2 Base Attributes

| Attribute | Description |
|---|---|
| **HP** | Survivability, affects combat endurance |
| **ATK** | Physical attack |
| **DEF** | Reduces physical damage taken |
| **MATK** | Magic attack |
| **MDEF** | Reduces magic damage taken |
| **SPD** | Speed/agility, turn order and evasion related |
| **MIND** | Mental fortitude, resistance to status effects, magic-related cap |
| **DEX** | Dexterity, crafting success rate, backstab accuracy, etc. |

*Attribute names are placeholders, pending final world-setting confirmation.*

### 6.3 Skill-to-Attribute Mapping (examples)

| Skill | Primary bonus | Secondary bonus |
|---|---|---|
| [Shield Use] | DEF ↑↑↑, HP ↑↑ | SPD ↓ (slight) |
| [Swordsmanship] | ATK ↑↑↑ | HP ↑, SPD ↑ |
| [Herb Knowledge] | HP ↑ | MIND ↑ |
| [Alchemy] | MATK ↑ | DEX ↑, MIND ↑ |
| [Light Step] | SPD ↑↑↑ | DEX ↑ |
| [Meditation] | MIND ↑↑↑ | MDEF ↑ |
| [Mining] | ATK ↑ (minor) | HP ↑ (minor) |

> Skills can carry **negative bonuses** (e.g. Shield Use lowering SPD), to reflect the inherent trade-offs of each skill.

### 6.4 Proficiency Bonus Multiplier

| Skill level | Attribute bonus multiplier |
|---|---|
| Lv.1 | ×1.0 |
| Lv.5 | ×1.8 |
| Lv.10 | ×3.2 |
| Lv.20 | ×6.0 |

Evolved high-tier skills have a steeper bonus curve.

### 6.5 Hidden Synergy Effects

Certain skill combinations, when equipped simultaneously, trigger additional hidden bonuses. Players cannot see these from the UI — they must be discovered through play or shared between players.

| Skill combo | Hidden effect |
|---|---|
| [Swordsmanship] + [Light Step] | SPD +15% extra, unlocks "Sword Dance" combat action |
| [Herb Knowledge] + [Alchemy] | DEX +10%, chance to produce enhanced potions when brewing |
| [Shield Use] + [Meditation] | MDEF +20% extra ("Meditative Guard") |

*The above are examples — actual content is designed and hidden by the developer.*

---

## 7. UI Design

### 7.1 Overall Layout

Combines Degrees of Lewdity (three-panel structure) with Theory of Magic (dark tone, high information density).

```
┌──────────────┬─────────────────────────┬─────────────┐
│ Left panel   │  Main narrative area     │ Right panel │
│              │                          │             │
│ 【Status】   │  Scene narrative text    │【Skills/Bag】│
│ HP ██████    │  (dark bg, light text)   │             │
│              │                          │             │
│ Stamina ███  │  ── Action buttons ────  │  Equipped   │
│              │  [ Action ]              │  skills     │
│ 【Attrs】    │  [ Action ]              │             │
│ ATK  12      │  [ Rest ]                │  Inventory  │
│ DEF   8      │  [ ▶ Travel ]            │             │
│ ...          │                          │             │
│ Equipment    │  ── Message feed ────    │             │
│ slots        │  [filtered, scrolling]   │             │
└──────────────┴─────────────────────────┴─────────────┘
```

### 7.2 Design Principles

- **Language**: UI fully in Chinese (display content)
- **Style**: dark background + light text, no flashy animation
- **Action buttons**: dynamically generated, only currently-unlocked actions shown
- **Message feed**: a single unified scrolling stream — all discoveries, unlocks, and narrative beats appear here, with filter toggles (All / Local / System)
- **Left panel**: character attributes and equipment slots always visible, no page-switching needed
- **Centre panel flow** (top to bottom): narrative text → action buttons (no gap/divider — reads as one continuous flow) → message feed (compact, fixed height)
- **Action button styling**: 行动 (Action) — outline; 休息 (Rest) — green outline, ♦ prefix; 前往 (Travel) — filled purple block, ▶ prefix, with the current location's top-level prefix stripped from the destination label
- **Breadcrumb navigation** in the top bar (e.g. 新叶镇 / 铁砧锻造铺)

### 7.3 Skill Slot Display (test phase)

- Test phase opens all 10 slots directly, no unlock restrictions
- The live version will unlock slots progressively (see Section 3.2)

---

## 8. Combat System

- Presented in text-narrative style
- Player selects actions via menu
- Equipped skills determine available combat options
- Status effects fall into two categories:
  - Physical (poison, paralysis, sleep, stun) — resisted more easily with high DEF
  - Mental (curse, confusion, charm) — resisted more easily with high MIND

---

## 9. NPC Ecology System

### 9.1 Initial Population (Newleaf Town, 21 total)

**Production core**

| NPC | Count | Role |
|---|---|---|
| Blacksmith | ×1 | Weapon/tool production |
| Leatherworker | ×1 | Armour production |
| Apothecary | ×1 | Potion production |
| Farmer | ×2 | Food raw materials |
| Cook | ×1 | Inn food processing |
| Miner | ×2 | Raw material gathering |
| Woodcutter/Carpenter | ×2 | Timber gathering and processing |

**Service core**

| NPC | Count | Role |
|---|---|---|
| Innkeeper | ×1 | Lodging / dining / ingredient purchasing |
| Merchant (general store) | ×1 | Goods circulation |
| Mayor | ×1 | Governance / event trigger point |
| Hired adventurer / town guard | ×2 | Combat NPCs / town security |

**Transient population**

| NPC | Count | Role |
|---|---|---|
| Traveller | ×2 | Random arrival/departure, brings external goods and information |

**Family structure**

| Unit | Composition |
|---|---|
| Married couples | ×2 (Blacksmith + spouse, Farmer couple) |
| Children | ×2 (inherit a tendency toward their parents' skills) |

### 9.2 NPC Attribute System

NPCs inherit all the same attributes as the player:
- Life: HP, stamina, hunger, sleep
- Combat attributes: ATK, DEF, MATK, MDEF, SPD, MIND, DEX
- Skill slots: same system as the player
- Economy: personal gold account, inventory, property
- Social: family relations, interpersonal relationships, reputation
- Need stack: hunger > sleep > work > social (priority-ordered)
- Lifecycle: birth date, life expectancy

### 9.3 NPC Skill Rules

- **Primary skill**: inherited at birth (a blacksmith's child has a tendency toward forging)
- **Growth**: unlocked and levelled naturally through daily actions, same mechanic as the player
- **Childhood exposure**: children build base XP by being around their parents' work
- **Death**: skills are lost, not inheritable

### 9.4 Economy System

**Core principle: conservation of gold**
- Gold is never created or destroyed out of nothing
- Initial economy: the minimum amount needed to sustain a viable closed loop
- External gold is introduced later via the travelling merchant

**Minimum economic loop**
```
Farmer → ingredients → Cook/Inn → dining income
Miner → ore → Blacksmith → weapons/tools → Merchant → sale
Gatherer → herbs → Apothecary → potions → Merchant → sale
Everyone → consumes at the Inn → innkeeper's income cycle
```

**Death and inheritance**
- Property passes to family
- With no family, it is managed by the mayor

**Economic institutions after player involvement**

| Institution | Role |
|---|---|
| Adventurers' Guild | Quest posting, reward management, player economy interface |
| Crafters' Guild | Trading of player-made goods, quality certification |
| Travelling Merchant | Periodic visits, imports external goods, buys up the town's surplus, connects to other towns |

**Town economy protection mechanism**
- The travelling merchant periodically removes surplus goods and brings in outside gold
- Prevents player gold extraction from collapsing the town's internal economy
- Future expansion: East Town (current) → South/West/North towns → Central City

### 9.5 NPC Autonomous Behaviour Layers

| Layer | Content | Dev phase |
|---|---|---|
| Layer 1 | Schedule-based behaviour (fixed routine) | Phase 2 |
| Layer 2 | State-driven behaviour (needs/emotion affect decisions) | Phase 2.5 |
| Layer 3 | NPC-to-NPC economic interaction (real resource flow) | Phase 3 |
| Layer 4 | Emergent behaviour (population growth, factions, new facilities) | Phase 4 |

### 9.6 Ecology Growth Timeline

```
Day 1–10    Establishment: NPCs run on schedule, economy starts circulating
Day 10–30   Growth: children mature, surpluses/shortages emerge (20–25 pop)
Day 30–100  Differentiation: occupational differentiation, wealth gap, travellers may settle (25–40 pop)
Day 100+    Emergence: new facilities appear, factions form, external threats (40–60 pop cap)
```

### 9.7 MMO Notes

- Phase 1: single-player observation of how one player affects the ecology
- Phase 3+: server-side simulation, client only renders

---

## 10. World Time System

### Time Scale
- Formula: ingame minutes = real minutes × 4
- 15 real minutes = 1 ingame hour
- 1 real hour = 4 ingame hours
- 6 real hours = 1 ingame day
- 1 real day = 4 ingame days

### Clock Storage
- Stored as "total ingame minutes since epoch"
- Epoch = a fixed real-world timestamp (game launch date)
- Never written to localStorage — always computed live from Date.now()

### Day/Night Determination
- Ingame 06:00–17:59 → Day
- Ingame 18:00–05:59 → Night

### Key Rules
- The clock keeps running continuously; it does not pause when the player is offline
- Ingame date advances +4 per real day
- Logging in at the same real-world time always shows the same ingame time-of-day

---

## 11. Agent Evolution Draft (Design Draft, Not an Implementation Commitment)

> The goal is not "can the agent act?" but "can the agent keep becoming itself?"

### Current state: L1 Goal Agent

Pipeline: `Perception → Need → Intent → Action → Memory`

Already has: world perception, action selection, persistent memory, resource interaction, reproduction/lineage, environmental feedback.

Limitations: behaviour converges too easily, weak long-term continuity, identity not stable, actions explain optimization rather than a life being lived.

---

### L1 → L2: From Agent to Character (Persistent Character)

**Core shift: state no longer directly drives action — state shapes interpretation**

```
Current: Need → Intent → Action
Target:  Experience → Interpretation → Identity → Commitment → Action
```

**Module direction:**

| Module | Current | Direction | Change |
|---|---|---|---|
| perceive() | Raw world observation | Perceived world | Add interpretation context — output "this place feels unstable" instead of arcane=0.6 |
| needSystem | Primary decision driver | State and constraint | Demote: need does not generate intent, becomes a post-action settlement result |
| intentPipeline | Score competition | Candidate generation | Refactor: produces "possible futures," not a final choice |
| **meaningLayer** | Does not exist | New | Asks "which fits who I am" rather than "which scores highest" |
| memorySystem | Event accumulation | Episodic memory | Expand: event → interpretation → retained meaning |
| identityLock | Identity protection | Self-continuity | Promote: belief / habit / preference / fear / attachment |
| knowledgeSystem | Knowledge accumulation | World understanding | Expand: knowledge affects available interpretations |
| lineage | Biological continuity | Inherited tendencies | Expand later: children inherit stories/environment/customs, not just genes |

**meaningLayer (new module):**
- Input: candidate intents, memory, identity, commitments
- Output: selected action + projected future effect
- Question: not "which scores highest" but "which fits who I am becoming"

---

### L2 → L3: From Character to Subject (Subjective Agent)

The agent forms its own model of reality:

```
World → Interpretation → Self Model → Meaning → Decision → Memory Rewrite
```

**Success criterion:**
> A player returns after 30 days away and says "this still feels like 老周" — not "this NPC just rolled a different score."

---

### Validation Order

1. Explain decisions
2. Observe repeated behaviour
3. Detect identity continuity
4. Introduce commitment
5. Evaluate subject emergence

---

## 12. Pending Items

- [ ] Skill slot unlock conditions for slots 4–9
- [ ] Initial scene content for the starting town
- [ ] Full list of the first batch of base skills
- [ ] Whether MP/mana exists as an independent attribute
- [ ] Whether to keep negative skill bonuses (currently leaning toward keeping them)
- [ ] Whether hidden synergy effects belong in the Phase 1 development scope
