# World Generation Readiness Audit v1

## Authority

This audit follows `AGENTS.md` as the sole authority. It is read-only and does
not introduce runtime behavior, new layers, tick-order changes, or simulation
refactors.

## Executive Answer

Earthly can currently generate a short-horizon simulated world slice with
resource geography, agent actions, demand pressure, traces, activity clusters,
culture reports, civilization memory, and myth interpretation.

Earthly is not yet ready to generate a believable 500+ year pre-player world
history. The main blockers are population continuity, long-term agent turnover,
executed migration/settlement lifecycle mechanics, and bounded historical
storage across deep time.

Current answer:

```text
Can Earthly currently generate a world worth entering?

For a short prelude or local slice: partially yes.
For a 100-year history: not yet reliable.
For a 500-1000 year history: no, not with current causal systems.
```

## Readiness Score

Scores reflect long-horizon world generation readiness, not module existence.

| Category | Score | Status |
| --- | ---: | --- |
| Population Continuity | 2/10 | Critical blocker |
| Resource Sustainability | 6/10 | Promising but unproven long-term |
| Activity Cluster Stability | 5/10 | Detectable, mostly observational |
| Resource Exchange Viability | 4/10 | Trace-detectable, weakly structural |
| Cultural Differentiation | 5/10 | Detectable, diversity depends on inputs |
| Historical Accumulation | 6/10 | Good compression layer, bounded source traces |
| Player Entry Readiness | 4/10 | Strong traces, weak lived continuity |

Overall readiness:

```text
100 years: 4/10
500 years: 2/10
1000 years: 1/10
```

## Phase 1: Population Continuity

### Findings

- Agents can persist as objects across ticks.
- Scenario population is seeded once in `createPlayableWorldSlice`.
- `runScenario` counts deaths, but current execution does not provide a complete
  birth, aging, reproduction, replacement, or generational turnover system.
- Needs advance over time, but hunger/fatigue do not currently create a complete
  demographic lifecycle.
- There is no structural guarantee against static population, silent collapse,
  or non-historical immortality.

### Readiness

Population continuity is the strongest blocker for long-horizon generation.
A 500-year world requires either biological continuity or explicit replacement
assumptions. The current system has neither as causal runtime authority.

## Phase 2: Resource Sustainability

### Findings

- Resource geography exists as a deterministic map.
- Resource flow includes depletion, regeneration, diffusion, and clamping.
- Regeneration pulls depleted resources toward a baseline and is biased by
  environmental field context.
- Action yield produces depletion input for resource flow.

### Risks

- Sustainability is plausible at short horizons, but there is no long-horizon
  calibration evidence for 100-1000 year equilibrium.
- Baseline regeneration may prevent total depletion, but could also reduce
  historical scarcity if not tuned for deep time.
- Extraction pressure is tied to action yield, but agent survival does not yet
  depend strongly enough on resource outcomes to create full ecological history.

## Phase 3: Activity Cluster Stability

### Findings

- Settlement emergence is implemented as observational activity clustering.
- Clusters can be detected from repeated activity over a rolling window.
- Growth/evolution events can be derived from previous settlement snapshots.

### Risks

- Per `AGENTS.md`, settlements are observational constructs only.
- Settlements do not govern agent decisions, migration, safety, birth, resource
  access, construction, defense, or institutional continuity.
- Clusters can appear in traces, but their persistence depends on agents
  continuing to act in place, not on settlement-level causal mechanics.

### Readiness

Activity clusters can be recognized, but long-term settlement lifecycle quality
is not yet sufficient for 500+ year believable world generation.

## Phase 4: Resource Exchange Viability

### Findings

- Exchange events can be detected from trace relationships, trust, resource
  asymmetry, local proximity, and interaction context.
- Reciprocity state is tracked through the trace collector.
- Trade exists as a registered social action.

### Risks

- Exchange is primarily detected and summarized from traces.
- The current economy is closer to proto-economy observation than causal market
  persistence.
- There is no strong causal inventory, scarcity-driven production chain, price,
  logistics, or durable trade-route model.

### Readiness

Exchange can emerge episodically. Structurally sustainable long-horizon exchange
is not yet guaranteed.

## Phase 5: Cultural Differentiation

### Findings

- Culture emergence derives from repeated behavior, settlement correlation,
  typology composition, demand context, resources, and migration pressure.
- Culture remains downstream-only and non-causal, correctly respecting
  `AGENTS.md`.
- Regional differentiation is possible if traces diverge by location and
  resource context.

### Risks

- Culture cannot influence behavior, by design.
- If the causal layer does not create durable regional differences, culture
  reports may converge toward uniform action distributions.
- Current world generation has limited mechanisms for intergenerational
  cultural separation, cultural persistence under agent turnover, or divergent
  institutions.

### Readiness

Culture detection is architecturally sound. Cultural differentiation is possible
but not yet structurally strong enough for deep-history generation.

## Phase 6: Historical Accumulation

### Findings

- Civilization Memory compresses culture traces, settlement snapshots,
  behavioral history, demand history, resource evolution, migration logs, and
  causal reports.
- Civilization Myth derives symbolic interpretation from Civilization Memory.
- These layers are deterministic, downstream, and non-influential.

### Risks

- Source trace collection has bounded rolling windows in several places.
- Long-term history needs durable archival strategy across centuries.
- Memory compression can explain recurring structures only if upstream runtime
  creates enough stable structure over time.

### Readiness

The interpretive stack is ahead of the causal world generator. It can explain
history, but the runtime does not yet reliably produce century-scale historical
substance.

## Phase 7: Player Entry Readiness

Assuming player entry after 500+ years:

| Expected World Feature | Current Readiness |
| --- | --- |
| Recognizable regions | Partial: terrain/resource regions exist |
| Persistent activity clusters | Partial: detectable, observational |
| Historical traces | Partial: trace system exists, long horizon bounded |
| Cultural differences | Partial: derivable if trace divergence exists |
| Myths/narratives | Partial: generated from memory structures |
| Observable resource patterns | Good: resource geography and flow exist |
| Generational continuity | Missing |
| Population history | Missing |
| Political/institutional history | Missing |
| Settlement lifecycle causality | Weak |

The player could enter a world with generated reports. They would not yet enter
a world whose centuries of history were causally lived by generations of
agents.

## Phase 8: Missing World Generator Requirements

Critical missing categories:

- Population lifecycle assumptions: birth, death, aging, reproduction, or
  replacement.
- Long-horizon agent turnover while preserving historical continuity.
- Executed migration behavior, not only migration pressure observation.
- Durable settlement lifecycle mechanics beyond trace detection.
- Long-term historical archive strategy beyond bounded rolling windows.
- Strong resource-to-survival coupling.

Moderate risks:

- Exchange may remain episodic without durable production/logistics structure.
- Culture may converge if regions do not remain causally distinct.
- Myth and Civilization Memory may produce thin narratives if upstream traces
  are repetitive or short-lived.
- Stability controllers may prevent collapse but also flatten extreme historical
  events if overused for long horizons.

Strengths:

- Layer boundaries are well-defined and currently suitable for safe expansion.
- Resource geography, resource flow, demand, action yield, and field dynamics
  provide a real physical substrate.
- Trace, settlement, culture, civilization memory, and myth layers can already
  interpret emergent structures without influencing causality.
- Determinism and replay infrastructure are strong foundations for world
  pre-generation.

## Horizon Assessment

### 100 Years

Readiness: 4/10.

Earthly could produce a long trace and some recognizable regional/activity
patterns, but the lack of lifecycle and turnover systems would make the world
feel like an extended simulation slice rather than a lived century.

### 500 Years

Readiness: 2/10.

The historical interpretation layers could produce compressed artifacts, but
the causal substrate lacks generational continuity, durable settlement causality,
and population dynamics needed for believable deep history.

### 1000 Years

Readiness: 1/10.

Without population lifecycle, archival persistence, and stronger structural
change mechanisms, a 1000-year run would likely be mechanically repetitive or
demographically unrealistic.

## Final Conclusion

Earthly has the beginnings of a world generator kernel, especially in resource
geography, traceability, and downstream historical interpretation.

It does not yet have the minimum causal requirements for believable
long-horizon world generation before player entry.

The missing categories are not more observation layers. The gaps are causal
continuity systems: population lifecycle, migration execution, settlement
lifecycle, durable historical storage, and stronger resource-survival coupling.
