# Earthly — MILESTONES.md
> 最后更新：2026-06-23
> 文档性质：执行层 / 个人工作锚点（solo dev）
> 关联文档：GDD v0.5.1 / SIMULATION_SPEC（待建）
 
---
 
## 文档结构说明
 
```
SIMULATION_SPEC    → What is executed（运行时真相）
MILESTONES         → What is verified（验证合约）
REVIEW             → What is interpreted（人工解读层）
```
 
本文档只定义"验证什么"，不定义"规则是什么"。
 
---
 
## Phase 1 — Execution Consistency Layer
 
### 目标陈述
 
```
验证所有 Agent 状态转换由同一执行循环产生，
不存在 actor-specific 规则分支。
```
 
这是一个执行等价不变量（execution equivalence invariant）验证，不是 ontology 声明。
Phase 1 pass 意味着："在最简场景下，规则对所有 Agent 一致成立"。
 
---
 
### 三层执行结构（边界约束）
 
```
Execution Layer   → Focus / Commitment
Evaluation Layer  → World Validation
Observation Layer → Identity Trace
```
 
**硬约束：**
- Evaluation Layer 是 read-only projection，不 mutate Execution state
- Identity Trace 是 append-only event stream，不携带 semantic label
- 所有 semantic interpretation 由人在 REVIEW 阶段完成，系统不做任何标记
---
 
### Scope — First Contact Loop
 
**场景定义：**
 
```
Actors:
  Player    — rule-based agent（外部 Intent 来源）
  NPC       — rule-based agent（确定性规则实例）
              structural neutrality：deterministic，但无 actor-specific hardcode
              不为 Phase 2 stochastic extension 做预先接口准备
 
Interaction:
  approach
  observe
  （明确排除任何 conflict）
 
System（全部启用）:
  Focus System        — 注意力分配有代价
  Commitment System   — 行为生成与持续
  World Validation    — per-resolution-step，对所有 Agent 一致执行
  Identity Trace      — append-only raw event log，不做 semantic labeling
```
 
**场景流程：**
 
```
[0] Spawn
    Player 和 NPC 同时存在于 world
 
[1] Passive phase
    双方执行 low-intent behavior
 
[2] Interaction trigger
    approach 或 observe
 
[3] Focus shift
    Player 进行 Focus 决策
 
[4] Commitment creation
    Player 侧和 NPC 侧各自生成 Commitment
 
[5] World Validation step
    对所有 Commitment 执行同一 validation 函数
 
[6] Identity Trace entry
    raw event 写入 log（type + timestamp + agent_id，无 semantic label）
 
[7] New equilibrium
    进入新状态，等待下一个 Intent
```
 
---
 
### Non-Goals（明确排除）
 
```
❌ combat / damage / HP 消耗
❌ conflict resolution
❌ NPC autonomous goal generation
❌ NPC memory-driven policy change
❌ stochastic behavior / adaptive policy
❌ tactical AI / behavior tree
❌ death / revival
❌ multiplayer / shared server
❌ economy / trading
❌ experience correctness 作为 pass/fail 条件
❌ World Execution Invariant 的 formal definition（属于 SIMULATION_SPEC）
```
 
---
 
### NPC 定义（Phase 1 锁定）
 
```
NPC = deterministic rule-based agent instance
 
Properties:
  - 与 Player 共享同一套规则引擎和执行函数
  - 无自主意图生成
  - 无记忆驱动的策略变化
  - 完整参与 Focus / Commitment / World Validation
  - 行为差异只来自输入状态差异，不来自 actor-specific branch
 
Structural neutrality:
  代码层不出现 if actor == "player" 类型分支
  但不为 Phase 2 预先准备扩展接口
```
 
---
 
### Minimum Observable Behaviors（M.O.B）
 
验证时必须能"看到"这四件事。如果看不到，Phase 1 未通过。
 
**M.O.B 1 — Focus shift produces measurable state delta**
Focus 切换产生可测量的系统状态变化。
可测量表现：Commitment 创建/覆盖时，存在一条可追溯的 FOCUS_CHANGED 事件，
其 old_domain/new_domain（跨 domain 场景）或 old_type/new_type（同 domain
override 场景）与新 Commitment 的 domain/type 因果一致。

NOTE: This rule assumes Intent sequences without duplicate (domain, type)
resubmission for the same agent. See LAYER 3 Pending — "Repeated
Identical Intent" for the known edge case where old_type == new_type
on a same-domain re-issue.
 
**M.O.B 2 — Commitment persists under zero Intent input**
在无 Intent 输入期间，Commitment 仍然存在并被 World 持续 validate。
可测量表现：IPS 状态下，Commitment 的 validation 循环计数继续递增。
 
**M.O.B 3 — Broken event carries traceable cause**
每一次 Broken 发生时携带具体 requirement 标识。
可测量表现：Broken event 包含 `cause: <requirement_id>` 字段，不为 null。
 
**M.O.B 4 — Identity Trace records behavior sequence without value mutation**
Trace log 记录行为序列，不包含属性数值变化。
可测量表现：Trace 中每条 entry 只有 `event_type / agent_id / timestamp`，无 `delta_value` 字段。
 
---
 
### Success Criteria
 
#### Automated Gate（必须通过，hard fail）
 
```
✔ Player 和 NPC 通过同一 validation 函数，无 actor-specific branch
✔ Commitment Broken event 携带 cause（requirement_id），不为 null
✔ Focus 切换产生可测量的 body state delta（记录在 Commitment 初始状态）
✔ IPS 状态下无新 Commitment 生成，现有 Commitment validation 继续运行
✔ Unattended Presence 状态下无保护，Commitment 正常接受 World Validation
✔ Identity Trace 只包含 raw event，无 semantic label，无 delta_value
✔ Deterministic replay：相同输入序列产生相同 Trace 输出
```
 
#### Human Review（诊断用，不影响 pass/fail）
 
```
观察：Focus 切换时是否"感觉到代价"（非数字，是状态起点不同）
观察：Commitment 持续时是否"感觉到身体还在做某件事"
观察：Broken 发生时是否"感觉到世界在响应"，而不是"系统在惩罚"
观察：Identity Trace 是否让你"看到自己做了什么"，而不是"看到自己变强了"
 
Human Review 结果记录在 REVIEW 文档中，不作为 Phase 1 gate 条件。
```
 
---
 
### Failure Modes（调试定位用）
 
| 现象 | 可能原因 | 检查点 |
|------|---------|--------|
| NPC Commitment 和 Player Commitment 通过不同逻辑 | actor-specific branch 存在 | 检查 validation 函数是否有 if actor_type 分支 |
| IPS 下 Commitment 消失 | 系统在 Intent 缺失时主动清除了 Commitment | 检查是否有 timeout cleanup 逻辑 |
| Focus 切换后 Commitment 初始 body state 与切换前相同 | Commitment 生成时未读取当前 body state | 检查 Commitment 创建时是否注入当前物理状态 |
| Broken event 无 cause 字段 | requirement 是 hardcode 条件而非声明式 | 检查 Broken event 生成路径 |
| Identity Trace 包含 delta_value | Trace 混入了 attribute calculation | 检查 Trace writer 是否过滤了非 event 字段 |
| Deterministic replay 失败 | 存在隐式随机或时序依赖 | 检查是否有 timestamp-dependent logic 进入 execution path |
| NPC 出现类"自主决策"感 | NPC intent 生成引入了 heuristic 或条件分支 | 检查 NPC intent 是否来自 deterministic state mapping |
 
---
 
### Tick Model（Phase 1）
 
```
模型：per-resolution-step validation
 
每个 resolution step：
  1. 执行 Player tick（接收外部 Intent，生成或维持 Commitment）
  2. 执行 NPC tick（同一函数，不同输入状态，生成或维持 Commitment）
  3. World Validation：对所有 active Commitment 执行同一 validation 函数
  4. Broadcast Broken events（携带 cause）
  5. Append Identity Trace entries（raw event only）
 
约束：
  - Step 3 不修改任何 Execution Layer 状态
  - Step 5 不做 semantic labeling
```
 
不做 event-driven selective validation，不做 async agent execution。
Phase 1 优先验证一致性，性能优化推迟到 Phase 2 之后。
 
---
 
### First Play Script（集成测试步骤）
 
```
Step 1
  Spawn Player + NPC
  验证：两者都出现在同一 World instance
  验证：World Validation loop 已启动
 
Step 2（零输入观察）
  不输入任何 Intent
  验证：双方 passive Commitment 存在
  验证：World Validation 循环计数递增
 
Step 3（Focus 触发）
  Player 执行 approach
  验证：Locomotion Commitment 写入，携带当前 body state
  验证：NPC 侧无强制触发
  验证：World Validation 对两者执行同一函数
 
Step 4（Focus 切换）
  Player 从 approach 切换到 observe
  验证：旧 Commitment 标记为 Overridden
  验证：新 Commitment 的初始 body state ≠ 标准起点（证明 state delta 存在）
 
Step 5（IPS 验证）
  停止所有 Player 输入
  验证：无新 Commitment 生成
  验证：现有 Commitment 持续存在
  验证：World Validation 继续运行，计数递增
 
Step 6（Broken 验证）
  制造 requirement 不满足条件
  验证：Broken event 触发
  验证：event 携带 cause: <requirement_id>
  验证：Identity Trace 写入对应 entry
 
Step 7（Trace 检查）
  读取 Identity Trace
  验证：所有 entry 只含 event_type / agent_id / timestamp
  验证：无 delta_value 字段
  验证：相同输入序列的 Trace 与上次运行一致（deterministic replay）
```
 
---
 
### Phase 1 通过条件
 
满足以下全部条件后，Phase 1 完成：
 
```
✔ Automated Gate 全部通过
✔ First Play Script 全部 Step 验证通过
✔ Failure Modes 中无未解决根因
✔ Human Review 完成并记录（不作为 gate，但必须完成）
```
 
通过后进入：Phase 1 REVIEW → Phase 2 规划
 
---
 
### 下一阶段（Phase 2 预告，不在本文档展开）
 
```
Phase 2 — Behavioral Divergence Layer
目标：同一规则 → 不同行为轨迹
引入：memory influence / bias weighting / stable preference drift
前提：Phase 1 全部通过
```
 
---
 
### 文档关系
 
```
GDD v0.5.1          → 设计意图（为什么这样做）
MILESTONES.md       → 验证合约（Phase 1 在验证什么）
SIMULATION_SPEC.md  → 运行时规则（规则的精确定义）[Phase 1 通过后建立]
REVIEW.md           → 人工解读记录 [Phase 1 通过后建立]
```
 