# 05 Skill System

## Core Rules

- Skills define all stats.
- Attack, defense, and other action attributes are derived from equipped skills.
- Skills do not define biological Capacity or Condition.
- There is no separate stat point system.
- Skill slots matter: players must choose which skills to equip.
- Undiscovered skills are invisible and must not render placeholders or hints.

## Derived Stats

Derived stats are computed, not stored.

- `maxStamina = 100 + sum(skill.stamina bonuses)`
- `maxStamina`, `attack`, and `defense` are recalculated on demand from equipped skills.

## Skill Schema

```ts
type StatKey = 'stamina' | 'attack' | 'defense' | 'speed' | 'spirit' | 'dexterity';

type Skill = {
  id: string;
  name: string;
  type: 'combat' | 'production' | 'gathering' | 'support' | 'hidden';
  desc: string;
  stats: Partial<Record<StatKey, number>>;
  xp: number;
  level: number;
};
```

## Skill Growth

Current implementation includes:

- Skill discovery
- Equip and unequip behavior
- XP gain
- Leveling

## Planned Skill Systems

- Skill evolution
- Skill fusion
- Hidden synergies
