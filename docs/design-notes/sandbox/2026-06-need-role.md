# Need 的角色：驱动力还是结果？

## 背景
Earthly 倾向："状态是结果，不是目的。"（design principle, not yet in GDD）

## 观察问题
intentPipeline 的 needScore：
- 是否直接推动 action 选择？
- 是否只是改变候选行为的可行性？

## 待验证
读取：evaluateNeeds, intentPipeline, resolution logic
观察：needScore 占比；高 need 是否直接导致行为改变

## 暂不决定
- 不删除 needSystem
- 不重写 tickManager
- 不调整权重

## 退出条件
能回答：Need → Intent → Action，还是 Intent → Action → State

---
This is an observation lens for future sandbox investigation,
not a design decision. Do not reference this file from GDD.md.
