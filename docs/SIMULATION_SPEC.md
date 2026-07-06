# Earthly — SIMULATION_SPEC v0.1.1
> 最后更新：2026-06-23
> 文档性质：运行时规则层 / Executable World Contract
> 关联文档：GDD v0.5.1（设计意图）/ MILESTONES.md（验证合约）
 
```
Scope:       Physical Consistency Layer Only (Phase 1)
Determinism: Required
Mutation:    Forbidden outside World_Execute
```
 
---
 
## 0. Core Principle
 
系统中所有状态变化必须满足：
 
```
STATE(t+1) = World_Execute(STATE(t), INPUT(t))
```
 
- `INPUT(t)` = Agent inputs + environmental triggers
- `World_Execute` = 唯一合法执行函数
- No hidden side effects allowed
---
 
## 1. System State Model
 
### 1.1 WorldState
 
```
WorldState {
    agents:      Map<AgentID, AgentState>
    commitments: Set<Commitment>
    focus_map:   Map<AgentID, FocusState>
    trace_log:   List<TraceEvent>
}
```
 
### 1.2 AgentState
 
```
AgentState {
    id:            AgentID
    position:      Vector2
    posture_state: PostureState
    intent_buffer: Optional<Intent>
}
```
 
### 1.3 PostureState
 
```
PostureState = STANDING | MOVING | OBSERVING | INTERACTING
```
 
设计原则：
- 语义-物理混合类型，不是物理仿真
- 只服务于 Commitment `origin_state_snapshot` 的一致性
- 不记录 velocity / balance / skeletal data
- Phase 1 不进入连续状态空间

> 见 M.O.B 1 决策记录：OBSERVING/INTERACTING 的存在定义的是合法状态空间，
> 不代表 Phase 1 已启用由 Commitment 驱动的 posture_state 状态迁移。
> 该迁移规则（如需要）应作为独立的 Phase 2+ Transition Rule 提案单独冻结。

### 1.4 FocusState
 
```
FocusState {
    active_domain: enum { LOCOMOTION, MANIPULATION, ATTENTION }
    active_type:   enum { APPROACH, OBSERVE, HOLD, IDLE }
}
```
 
注：`focus_cost_accumulator` 从 WorldState 中移除。
Focus 切换的 cost delta 只记录在 Identity Trace（`FOCUS_CHANGED` event），不存入 WorldState，不影响任何 Condition。Phase 2 再决定是否让 cost 影响执行层。
 
### 1.5 Commitment
 
Commitment 是唯一合法的执行产物（executable artifact）。
 
```
Commitment {
    id:                     CommitmentID
    agent_id:               AgentID
    domain:                 enum { LOCOMOTION, MANIPULATION, ATTENTION }
    type:                   enum { APPROACH, OBSERVE, HOLD, IDLE }
    origin_state_snapshot:  AgentState          // immutable deep copy
    required_conditions:    Set<Condition>
    status:                 enum { ACTIVE, BROKEN, COMPLETED, OVERRIDDEN }
}
```
 
语义：
- `domain` = 资源轴（哪个 Domain 被占用）
- `type` = 行为动词（执行什么）
- 同一 Domain 内同时只能有一个 ACTIVE Commitment
- 不同 Domain 的 Commitment 可以并存
示例：
 
| 行为 | domain | type |
|------|--------|------|
| 向 NPC 移动 | LOCOMOTION | APPROACH |
| 观察 NPC | ATTENTION | OBSERVE |
| 原地保持 | LOCOMOTION | IDLE |
 
---
 
## 2. Execution Pipeline（World_Execute）
 
每个 tick 严格按顺序执行：
 
```
World_Execute():
    1. Resolve Agent Inputs
    2. Apply Focus Transition Rules
    3. Generate / Update Commitments
    4. Validate Commitments (World Validation)
    5. Resolve Broken Events
    6. Emit Trace Events
    7. Commit New WorldState
```
 
Step 4 不修改任何 Execution Layer 状态（read-only projection）。
Step 6 只记录 raw event，不做 semantic labeling。
 
---
 
## 3. Intent Buffer 生命周期
 
Intent 是边沿触发信号（edge-trigger signal），不是持久状态。
 
```
On INPUT(t):
    agent.intent_buffer ← input
 
During World_Execute Step 1:
    if intent_buffer exists:
        pass to Step 3 (Commitment generation)
        immediately clear intent_buffer
```
 
规则：
- intent_buffer 只在接收它的同一个 `World_Execute` 周期内有效
- 消费后立即清空，不跨 tick 保留
- 不存在 multi-tick pending intent
- 不存在 implicit queue semantics
语义分层：
 
```
Intent     = 边沿触发信号（transient transport layer）
Commitment = 持久执行产物（persistent execution artifact）
```
 
---
 
## 4. Focus Transition Rules
 
### 4.1 Focus 是状态变更，不是建议
 
```
On FocusChange(agent, new_domain, new_type):
    old_focus = focus_map[agent]
    focus_map[agent] = { active_domain: new_domain, active_type: new_type }
    emit FOCUS_CHANGED event (携带 cost_delta，记录于 Trace，不存入 WorldState)
```
 
### 4.2 Focus 只覆盖同 Domain 的 Commitment
 
```
IF new_commitment.domain == existing_commitment.domain:
    mark existing_commitment.status = OVERRIDDEN
 
// 不同 Domain 的 Commitment 不互相覆盖
```
 
效果：
- Player 可以同时持有 `LOCOMOTION: APPROACH` 和 `ATTENTION: OBSERVE`
- 切换 ATTENTION 不影响 LOCOMOTION Commitment
- 同一 Domain 内只能有一个 ACTIVE Commitment
---
 
## 5. Commitment Generation Rules
 
### 5.1 触发条件
 
```
IF agent.intent_buffer != null:
    CREATE Commitment
```
 
仅此一条触发规则。无 Intent 则无新 Commitment。
 
### 5.2 确定性绑定
 
```
Commitment.origin_state_snapshot = deep_copy(agent.state)
```
 
- snapshot 在创建时固定，此后不可变（Invariant 11.4）
- 不允许运行时重新计算
---
 
## 6. World Validation System
 
这是 success / failure 的唯一权威。
 
### 6.1 验证规则
 
```
FOR each Commitment WHERE status == ACTIVE:
    FOR each condition IN required_conditions:
        IF condition(WorldState, AgentState) == false:
            mark Commitment.status = BROKEN
            emit BROKEN_EVENT
```
 
### 6.2 Condition 格式
 
```
Condition := function(WorldState, AgentState) → boolean
```
 
必须满足：
- **pure**：无副作用
- **stateless**：不依赖外部可变状态
- **deterministic**：相同输入永远产生相同输出
### 6.3 Broken Event 格式
 
```
BROKEN_EVENT {
    commitment_id:  CommitmentID
    failure_reason: ConditionID    // 具体是哪个 condition 不满足，不为 null
    timestamp:      Tick
}
```
 
无聚合，无推断，无 silent drop。
 
---
 
## 7. Identity Trace System
 
### 7.1 规则
 
Trace 是严格的 append-only raw event log。
 
```
TraceEvent {
    agent_id:   AgentID
    event_type: TraceEventType
    timestamp:  Tick
    payload:    EventPayload     // 只含 event 本身的原始数据
}
```
 
允许的 event types：
 
```
COMMITMENT_CREATED   { commitment_id, domain, type, origin_posture }
COMMITMENT_BROKEN    { commitment_id, failure_reason }
COMMITMENT_COMPLETED { commitment_id }
COMMITMENT_OVERRIDDEN{ commitment_id, new_commitment_id }
FOCUS_CHANGED        { old_domain, old_type, new_domain, new_type, cost_delta }
POSITION_UPDATED     { old_position, new_position }
```
 
### 7.2 禁止项
 
```
❌ NO level / stats / attribute delta
❌ NO semantic interpretation
❌ NO derived identity labels
❌ NO inference or aggregation
```
 
所有 semantic interpretation 由人在 REVIEW 阶段完成。
 
---
 
## 8. NPC Execution Model（Phase 1）
 
NPC 与 Player 使用完全相同的执行管道。
 
```
NPC_INPUT(t) = DeterministicStateMapping(WorldState)
```
 
约束：
- 无随机性
- 无学习 / 适应
- 无超出当前 WorldState 的记忆影响
- 无目标持久化
- 代码层不出现 `if actor_type == "npc"` 类型分支
```
NPC = function(WorldState) → Intent
```
 
---
 
## 9. IPS（Idle Presence State）
 
Agent 处于 IPS 当且仅当：
 
```
agent.intent_buffer == null (in current tick)
AND no ACTIVE Commitment exists for this agent
```
 
状态表：
 
| 状态 | 条件 |
|------|------|
| Active | Commitment exists |
| Transition | intent_buffer present |
| IPS | neither exists |
 
IPS 规则：
- 不生成新 Commitment
- World 继续正常执行
- 现有 Commitment（若有）继续被 validate
---
 
## 10. Unattended Presence Rule
 
```
IF no input received:
    system continues execution normally
```
 
- 无 freeze，无 pause，无 soft-stop
- Agent 缺席不改变 World 执行逻辑
- Commitment 持续接受 World Validation
---
 
## 11. Tick Model
 
```
TICK:
    1. snapshot current WorldState
    2. execute World_Execute pipeline (Section 2)
    3. validate all Invariants (Section 12)
    4. commit new WorldState
```
 
Phase 1 使用 per-resolution-step validation（不做 event-driven selective validation，不做 async agent execution）。
 
---
 
## 12. Invariants（硬约束）
 
以下四条不得被任何实现违反：
 
### 12.1 Execution Uniformity
 
```
∀ agent A, B:
World_Execute treats A ≡ B structurally
(no branching by actor identity type)
```
 
### 12.2 No Hidden Mutation
 
```
No function may modify WorldState outside World_Execute
```
 
### 12.3 Deterministic Replay
 
```
Same initial WorldState + same INPUT sequence
→ identical TraceEvent sequence
```
 
### 12.4 Commitment Immutability
 
```
Commitment.origin_state_snapshot is immutable after creation
```
 
---
 
## 13. Failure Semantics
 
System failure 永远是显式的，不允许 silent failure。
 
```
Failure := violation of Invariant OR unresolvable Condition
```
 
每次 failure 必须产生：
- `BROKEN_EVENT`（携带 `failure_reason`）
- 对应 `TraceEvent`
- 不允许 silent drop
---
 
## 14. Phase 1 Boundary Lock
 
Phase 1 明确禁止：
 
```
❌ stochastic behavior
❌ adaptive AI
❌ memory persistence beyond current WorldState
❌ semantic identity inference
❌ experience modeling
❌ physics simulation (velocity / balance / skeletal)
❌ focus_cost affecting WorldState
```
 
---
 
## 15. External Observability Contract
 
外部系统只能观察：
 
```
✔ WorldState snapshot
✔ Commitment state
✔ TraceEvent log
✔ BROKEN_EVENT stream
```
 
Nothing else exists.
 
---
 
## Closing Note
 
This spec defines:
> a deterministic, fully traceable, single-loop simulation kernel with explicit commitment lifecycle semantics and strict domain-separated execution.
 
It intentionally does NOT define:
- "meaning"
- "experience"
- "narrative continuity"
Those are Phase 2+ layers.
 