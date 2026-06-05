# Earthly Journey

Earthly Journey is an agent-based simulation RPG where the world emerges from interactions between autonomous agents, including humans, animals, monsters, and the player.

The system is designed around emergent behavior, not scripted progression.

## Core Design Philosophy

### 1. Agent-Centric World

All entities in the world are agents:

- NPCs are agents
- Animals are agents
- Monsters are agents
- The player is an agent

There is no separate "game logic layer" controlling behavior. The world advances through interactions between agents.

### 2. World Emergence Model

```text
agent perception -> decision -> action -> world state mutation -> feedback loop
```

The world does not simulate agents as decorative actors.

Instead, the world is the result of agent interactions.

### 3. No Static Character Stats

Characters are defined entirely by their equipped skills:

- No attribute point allocation
- No hidden stat leveling
- All capabilities are derived from skills

### 4. Discovery-Driven Knowledge

Progression is based on discovery, not previewed optimization:

- Locked skills are completely invisible
- There is no skill tree UI
- Progression paths are not pre-revealed
- Abilities emerge through actions and consequences

### 5. Skills as Identity System

Skills are not upgrades. They are identity components:

- Equipping skills defines the character's role
- Different combinations create different build identities
- Hidden synergies emerge through experimentation

### 6. Constraint-Based Build System

Players can equip only a limited number of skills.

This creates:

- Meaningful trade-offs
- Specialization pressure
- Emergent character archetypes

### 7. Living World Principle

The world evolves continuously through agent interactions:

- Resource consumption and regeneration
- Movement and migration
- Economic exchanges
- Conflict and cooperation

No global story system is required for the world to change.

## Core System Definition

### Agent System

Agents are autonomous entities that can perceive the world, make decisions, perform actions, and mutate world state.

The player is part of the same conceptual system as every other entity. Player interaction should extend the agent model rather than sit outside it.

### Interaction Model

Gameplay is expressed as agent-to-agent and agent-to-world interactions.

Actions should produce consequences through shared rules, not through isolated scripted outcomes.

### Simulation Loop

The simulation loop is the foundation of world evolution:

1. Agents perceive available context
2. Agents evaluate possible actions
3. Actions mutate local or global world state
4. The UI reports consequences to the player
5. New state becomes the input for future decisions

## Current Implementation Status

### Phase 1: Core Systems

Active development.

Implemented:

- Three-panel UI architecture
- Area-based exploration system
- Action-driven gameplay loop
- Skill discovery and equip system
- Stamina system with thresholds
- Equipment slot system
- Unified event and message feed
- Basic town infrastructure

In progress:

- None

Planned:

- Turn-based combat system
- Skill evolution system
- Skill fusion system
- Save/load persistence layer

### Future Infrastructure

- Backend persistence layer
- Multiplayer world synchronization

## Tech Stack

- React with Create React App
- Inline CSS-in-JS
- GitHub version control

## Getting Started

```bash
git clone https://github.com/rilgemo/earthly_journey.git
cd earthly_journey
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Project Structure

```text
src/
|-- App.js          # Core simulation state and loop
|-- data/           # Game content definitions
|-- utils/          # World simulation utilities
`-- components/     # Pure UI rendering layer
```

## UI Principles

- Top bar: world context, breadcrumb, time, and economy
- Middle: interaction space and available actions
- Bottom: memory space and event log
- UI never contains game logic
- All logic lives in data modules, simulation utilities, or `App.js`

## Development Principles

- Prefer data-driven design over conditional logic
- Keep components presentation-only
- Make game behavior emerge from agent interaction rules
- Avoid hardcoded world assumptions
- Extend systems instead of special-casing behavior

## Future Vision

Earthly Journey aims to become a fully agent-driven living simulation world where:

- NPCs develop their own histories
- Ecosystems evolve without scripts
- Economic systems self-balance
- Player influence becomes part of a larger autonomous world

## Documentation Roadmap

As the project grows, the README should remain the entry point and the deeper design spec can move into dedicated documents:

```text
docs/
|-- vision.md        # Worldview and design philosophy
|-- simulation.md    # Agent system and world loop
`-- gameplay.md      # Player-facing mechanics
```

## License

Private project. All rights reserved.
