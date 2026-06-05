# Earthly Journey

Earthly Journey is an agent-based simulation RPG where the world emerges from interactions between autonomous agents, including humans, animals, monsters, and the player.

The system is designed around emergent behavior, discovery-driven progression, and skills as identity rather than static character stats.

## Documentation

- Development rules and system constraints: [CLAUDE.md](CLAUDE.md)
- Current execution state and backlog: [TODO.md](TODO.md)
- Architecture index: [ARCHITECTURE.md](ARCHITECTURE.md)
- Detailed design references: [docs/](docs/)
- AI simulation operating spec: [AI/AGENTS.md](AI/AGENTS.md)
- Multi-agent cognitive runtime: [AI/MULTI_AGENT_RUNTIME.md](AI/MULTI_AGENT_RUNTIME.md)
- Emergence tuning control plane: [AI/EMERGENCE_TUNING.md](AI/EMERGENCE_TUNING.md)

## Core Experience

- Explore areas and discover actions through play
- Execute actions that change player state and world state
- Discover, equip, and grow skills
- Build identity through limited skill slots and hidden synergies
- Read all consequences through a unified event feed

## Current Phase

Phase 1 focuses on core systems:

- Area-based exploration
- Action-driven gameplay loop
- Skill discovery and equipment
- Stamina and threshold behavior
- Equipment slots
- Unified message feed
- Basic town infrastructure

Future systems such as combat, advanced NPC simulation, economy, persistence, and multiplayer are tracked separately in [TODO.md](TODO.md).

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

## License

Private project. All rights reserved.
