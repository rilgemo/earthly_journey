# 06 World Simulation

## World Time System

- **Formula:** In-game minutes = real minutes x 4
- **Scale:** 15 real minutes = 1 in-game hour
- **Scale:** 6 real hours = 1 in-game day
- **Scale:** 1 real day = 4 in-game days
- **Storage:** Do not store clock in localStorage
- **Derivation:** Always derive time from `Date.now()` and `EPOCH_MS` in `src/data/config.js`
- **Refresh:** Every 15 real seconds, equal to 1 in-game minute

## World Time Object

The `worldTime` object is derived and never stored.

```ts
{
  totalMinutes: number;
  day: number;
  hour: number;
  minute: number;
  timeOfDay: number;
  isDay: boolean;
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'midnight';
  label: string;
}
```

## Day and Night

- Day: `06:00-17:59`
- Night: `18:00-05:59`

## Current Simulation Scope

Current implementation includes world time display and time-derived behavior.

Full autonomous world simulation, NPC ecology, and economy simulation are future systems.
