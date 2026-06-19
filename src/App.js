import { useState, useEffect, useCallback, useRef } from "react";
import { AREAS } from "./data/areas";
import { ACTION_DATA } from "./data/actions";
import { AGENTS, getAgentStatus, tickAgentSkillXp, pushActionLog, describeIdentityNarrative } from "./data/npcs";
import { onTick, checkTick } from "./utils/tickSystem";
import { SKILL_SLOTS } from "./data/skills";
import { getWorldTime } from "./utils/worldTime";
import LeftPanel from "./components/LeftPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";
import SimulationInspector from "./inspector/SimulationInspector";
import { useSimulationStream } from "./inspector/hooks/useSimulationStream";
import { createInspectorSimulationStream } from "./simulation/inspectorStream";

// Dev toggle: simulation sandbox inspector is not part of the player game.
// Set to true locally to inspect tick/agent traces during mechanics research.
const SHOW_SIMULATION_INSPECTOR = false;

// ── 颜色系统（exported for use in child components） ──
export const C = {
  bg: "#0e0e12", panel: "#141418", border: "#2a2a35", borderHi: "#44445a",
  text: "#d4d0c8", textDim: "#6b6880", textHi: "#e8e4dc",
  accent: "#7c6fcd", accentDim: "#3d3666",
  green: "#5a9e6f", red: "#9e5a5a", gold: "#b89a4a",
  log0: "#c4c0b8", log1: "#7a7890",
  stFull: "#4a9e6f", stOk: "#8a9e3a", stWarn: "#c07830", stCrit: "#c03030",
};

export const EQUIP_SLOTS = [
  { id: "head",  label: "头部", icon: "🪖" },
  { id: "body",  label: "身体", icon: "🥋" },
  { id: "hands", label: "手部", icon: "🧤" },
  { id: "feet",  label: "脚部", icon: "👢" },
  { id: "main",  label: "主手", icon: "⚔️" },
  { id: "off",   label: "副手", icon: "🛡️" },
  { id: "acc1",  label: "饰品", icon: "💍" },
  { id: "acc2",  label: "饰品", icon: "📿" },
];

const ST_MAX = 100;
const ST_WARN = 30;
const ST_CRIT = 10;
const ST_COST = { high: 18, mid: 10, low: 5, vlow: 2 };
const INITIAL_BASE_STATS = Object.freeze({ 物攻: 0, 防御: 0, 魔攻: 0, 魔防: 0, 速度: 0, 精神: 0, 灵巧: 0 });
const inspectorSimulator = createInspectorSimulationStream();

function normalizeBaseStats(candidate = {}) {
  return Object.fromEntries(Object.keys(INITIAL_BASE_STATS).map(key => [
    key,
    typeof candidate[key] === "number" ? candidate[key] : INITIAL_BASE_STATS[key]
  ]));
}

export default function App() {
  const [area, setArea] = useState("新叶镇·广场");
  const [areaActions, setAreaActions] = useState(
    () => Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [k, [...v.actions]]))
  );
  const [narrative, setNarrative] = useState(AREAS["新叶镇·广场"].intro);
  const [messages, setMessages] = useState([
    { id: 0, type: "event", text: "你睁开眼睛。" },
    { id: 1, type: "event", text: "空气中飘着泥土与柴烟的气息。你站在新叶镇的广场中央。" },
    { id: 2, type: "event", text: "没有人告诉你该做什么。从哪里开始，由你决定。" },
  ]);
  const messageIdRef = useRef(3);
  const saveKey = "earthly_save";
  const initialSaveRef = useRef(true);
  const lastSavedJsonRef = useRef(null);
  const [skills, setSkills] = useState([]);
  const [slots, setSlots] = useState(() => Array(SKILL_SLOTS).fill(null));
  const [baseStats, setBaseStats] = useState(() => normalizeBaseStats());
  const [stamina, setStamina] = useState(ST_MAX);
  const [gold, setGold] = useState(50);
  const [items, setItems] = useState([]);
  const [equipped, setEquipped] = useState(() => Object.fromEntries(EQUIP_SLOTS.map(s => [s.id, null])));
  const [notif, setNotif] = useState(null);
  const [worldTime, setWorldTime] = useState(() => getWorldTime());
  const [agents, setAgents] = useState(AGENTS);
  const inspector = useSimulationStream(inspectorSimulator);

  const pushMessage = useCallback((type, text, speaker) => {
    setMessages(p => [...p, { id: messageIdRef.current++, type, speaker, text }].slice(-80));
  }, []);

  // Each real-world tick (15s) = 1 in-game minute = 1/60 of an ingame hour.
  // checkTick fires registered handlers once per ingame hour boundary.
  useEffect(() => {
    const timer = setInterval(() => {
      const wt = getWorldTime();
      setWorldTime(wt);
      checkTick(wt, pushMessage);
    }, 15000);
    return () => clearInterval(timer);
  }, [pushMessage]);

  const skillsRef = useRef([]);
  useEffect(() => { skillsRef.current = skills; }, [skills]);

  // Register lao_zhou XP settlement and action log: once per ingame hour.
  useEffect(() => {
    onTick((worldTime, ticksElapsed, pushMsg) => {
      const status = getAgentStatus("lao_zhou", worldTime.timeOfDay);
      const activity = status?.activity ?? "闲逛";
      const tick = worldTime.day * 24 + worldTime.hour;
      const minutesElapsed = ticksElapsed * 60;
      setAgents(prev => {
        const before = prev.lao_zhou;
        const afterXp = tickAgentSkillXp(before, activity, minutesElapsed);
        afterXp.skills.forEach(sk => {
          const prevLevel = before.skills.find(s => s.name === sk.name)?.level ?? 1;
          if (sk.level > prevLevel) {
            pushMsg("system", `老周的${sk.name}更熟练了（Lv.${sk.level}）。`);
          }
        });
        const afterLog = pushActionLog(afterXp, tick, activity);
        return { ...prev, lao_zhou: afterLog };
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 自动体力恢复
  useEffect(() => {
    const t = setInterval(() => setStamina(s => Math.min(ST_MAX, s + 1)), 15000);
    return () => clearInterval(t);
  }, []);


  const showNotif = useCallback(msg => { setNotif(msg); setTimeout(() => setNotif(null), 2600); }, []);

  // ── Load saved state on start ─────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1) return;
      if (data.area) setArea(data.area);
      if (data.areaActions) setAreaActions(data.areaActions);
      if (data.skills) setSkills(data.skills);
      if (data.slots) setSlots(data.slots);
      if (data.baseStats) setBaseStats(normalizeBaseStats(data.baseStats));
      if (typeof data.stamina === "number") setStamina(data.stamina);
      if (typeof data.gold === "number") setGold(data.gold);
      if (Array.isArray(data.items)) setItems(data.items);
      if (data.equipped) setEquipped(data.equipped);
      if (Array.isArray(data.messages)) {
        const loaded = data.messages.slice(-50);
        const maxId = loaded.reduce((max, msg) => Math.max(max, msg.id ?? 0), messageIdRef.current);
        messageIdRef.current = maxId + 1;
        setMessages([...loaded, { id: messageIdRef.current++, type: "system", text: "已读取上次的存档。" }]);
      } else {
        pushMessage("system", "已读取上次的存档。");
      }
      lastSavedJsonRef.current = raw;
    } catch (err) {
      console.warn("读取存档失败", err);
    }
  }, [pushMessage]);

  // ── Auto-save state changes ─────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const saveData = {
        version: 1,
        area,
        areaActions,
        skills,
        slots,
        baseStats,
        stamina,
        gold,
        items,
        equipped,
        messages: messages.slice(-50),
      };
      const currentJson = JSON.stringify(saveData);
      if (currentJson === lastSavedJsonRef.current) {
        initialSaveRef.current = false;
        return;
      }
      localStorage.setItem(saveKey, currentJson);
      lastSavedJsonRef.current = currentJson;
      if (!initialSaveRef.current) pushMessage("system", "进度已自动保存。");
      initialSaveRef.current = false;
    }, 120000);
    return () => clearTimeout(timer);
  }, [area, areaActions, skills, slots, baseStats, stamina, gold, items, equipped, messages, pushMessage]);

  // ── 派生状态 ─────────────────────────────────────────
  const stPct = (stamina / ST_MAX) * 100;
  const stMult = stPct <= ST_CRIT ? 0.5 : stPct <= ST_WARN ? 0.7 : 1;
  const debuffed = stMult < 1;

  const equipBonus = Object.values(equipped).reduce((acc, item) => {
    if (!item) return acc;
    Object.entries(item.stats || {}).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
    return acc;
  }, {});

  const displayStats = {
    物攻: Math.floor((baseStats.物攻 + (equipBonus.物攻 || 0)) * stMult),
    防御: Math.floor((baseStats.防御 + (equipBonus.防御 || 0)) * stMult),
    魔攻: Math.floor((baseStats.魔攻 + (equipBonus.魔攻 || 0)) * stMult),
    魔防: Math.floor((baseStats.魔防 + (equipBonus.魔防 || 0)) * stMult),
    速度: Math.floor((baseStats.速度 + (equipBonus.速度 || 0)) * stMult),
    精神: Math.floor((baseStats.精神 + (equipBonus.精神 || 0)) * stMult),
    灵巧: Math.floor((baseStats.灵巧 + (equipBonus.灵巧 || 0)) * stMult),
  };

  // ── 技能属性重算 ──────────────────────────────────────
  const recalc = useCallback((newSlots) => {
    const sk = skillsRef.current;
    const b = normalizeBaseStats();
    newSlots.forEach(name => {
      if (!name) return;
      const s = sk.find(x => x.name === name);
      if (!s) return;
      Object.entries(s.stats || {}).forEach(([k, v]) => {
        b[k] = (b[k] || 0) + v * s.level;
      });
    });
    setBaseStats(b);
  }, []);

  // ── 体力 ─────────────────────────────────────────────
  const drainSt = useCallback(amt => {
    setStamina(s => {
      const next = Math.max(0, s - amt);
      const np = (next / ST_MAX) * 100, pp = (s / ST_MAX) * 100;
      if (pp > ST_WARN && np <= ST_WARN && np > ST_CRIT) pushMessage("system", "⚠ 你感到明显的疲惫，状态开始下滑……");
      if (np <= ST_CRIT && pp > ST_CRIT) pushMessage("system", "⚠ 你几乎精疲力竭！能力大打折扣，请尽快休息。");
      return next;
    });
  }, [pushMessage]);

  const restoreSt = useCallback(type => {
    setStamina(s => type === "full" ? ST_MAX : type === "part" ? Math.min(ST_MAX, s + 50) : Math.min(ST_MAX, s + 15));
  }, []);

  // ── 技能解锁 ─────────────────────────────────────────
  const unlockSkill = useCallback(def => {
    setSkills(prev => {
      if (prev.find(s => s.name === def.name)) return prev;
      pushMessage("system", `✦ 新技能已解锁：【${def.name}】（${def.type}）`);
      showNotif(`✦ 【${def.name}】已解锁！`);
      return [...prev, { ...def, xp: 0, level: 1 }];
    });
  }, [pushMessage, showNotif]);

  // ── 执行行动 ─────────────────────────────────────────
  const doAction = useCallback(name => {
    const d = ACTION_DATA[name];
    if (!d) { pushMessage("system", `【${name}】（尚未开发）`); return; }

    const isRest = d.stCost?.startsWith("rest") || d.stRestore;
    if (stPct <= ST_CRIT && !isRest) { pushMessage("system", "⚠ 你已精疲力竭，请先休息。"); return; }

    if (d.cost?.gold) {
      if (gold < d.cost.gold) { pushMessage("system", `金币不足（需要 ${d.cost.gold} G）。`); return; }
      setGold(g => g - d.cost.gold);
    }

    setNarrative(d.narrative || []);
    if (d.log) d.log.forEach(logText => pushMessage("event", logText));
    if (d.npcReply) pushMessage("npc", d.npcReply.text, d.npcReply.speaker);

    // 体力处理
    if (d.stCost === "rest_full") restoreSt("full");
    else if (d.stCost === "rest_part") restoreSt("part");
    else if (d.stCost === "rest_tiny" || d.stRestore === "tiny") restoreSt("tiny");
    else drainSt(ST_COST[d.stCost] || 0);


    // 行动列表更新
    setAreaActions(prev => {
      const next = Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, [...v]]));
      (d.removeActions || []).forEach(r => { Object.keys(next).forEach(k => { next[k] = next[k].filter(x => x !== r); }); });
      if (d.addActions) Object.entries(d.addActions).forEach(([k, acts]) => {
        if (!next[k]) next[k] = [];
        acts.forEach(x => { if (!next[k].includes(x)) next[k].push(x); });
      });
      return next;
    });

    if (d.unlockSkill) unlockSkill(d.unlockSkill);
    if (d.giveItem) setItems(prev => {
      const ex = prev.find(i => i.name === d.giveItem.name);
      return ex ? prev.map(i => i.name === d.giveItem.name ? { ...i, qty: i.qty + d.giveItem.qty } : i) : [...prev, { ...d.giveItem }];
    });
    if (d.equipDrop) {
      const { slot, item } = d.equipDrop;
      setEquipped(prev => ({ ...prev, [slot]: item }));
      pushMessage("system", `✦ 「${item.name}」已装备到${EQUIP_SLOTS.find(s => s.id === slot)?.label}槽位。`);
    }
    if (d.skillXp) setSkills(prev => prev.map(s => {
      if (s.name !== d.skillXp.name) return s;
      const xp = s.xp + d.skillXp.xp, lv = Math.floor(xp / 20) + 1;
      if (lv > s.level) pushMessage("system", `✦ 【${s.name}】升级！Lv.${s.level} → Lv.${lv}`);
      return { ...s, xp, level: lv };
    }));
  }, [stPct, gold, pushMessage, restoreSt, drainSt, unlockSkill]);

  // ── 观察老周钓鱼（注入实时技能等级到叙事） ──────────────
  const observeZhouFishing = useCallback(() => {
    doAction("看到老周在钓鱼");
    const fishingSkill = agents.lao_zhou.skills.find(s => s.name === "钓鱼");
    const level = fishingSkill?.level ?? 1;
    setNarrative([
      `老周蹲在溪边，鱼线垂在水里，看起来一点也不着急。（钓鱼 Lv.${level}）`,
      "「钓鱼比打铁省心。」他说，眼睛没离开水面。",
    ]);
  }, [agents.lao_zhou, doAction]);

  // ── 观察老周近期状态（从 actionLog 生成动态叙事） ────────
  const observeZhouIdentity = useCallback(() => {
    doAction("观察老周最近的状态");
    const log = agents.lao_zhou.actionLog || [];
    setNarrative(describeIdentityNarrative(log));
  }, [agents.lao_zhou, doAction]);

  // ── 移动区域 ─────────────────────────────────────────
  const travelTo = useCallback(key => {
    if (!AREAS[key]) return;
    setArea(key);
    setNarrative(AREAS[key].intro);
    pushMessage("event", `── 前往「${AREAS[key].label}」`);
    AREAS[key].localChat?.forEach(chat => pushMessage("npc", chat.text, chat.speaker));
    drainSt(ST_COST.low);
  }, [pushMessage, drainSt]);

  // ── 技能装备 ─────────────────────────────────────────
  const equipSkill = useCallback((skillName, slotIdx) => {
    setSlots(prev => {
      const next = [...prev];
      const already = next.indexOf(skillName);
      if (already !== -1) next[already] = null;
      next[slotIdx] = skillName;
      recalc(next);
      return next;
    });
    pushMessage("system", `将【${skillName}】装备到技能槽位 ${slotIdx + 1}。`);
  }, [recalc, pushMessage]);

  const unequipSkillSlot = useCallback(i => {
    setSlots(prev => {
      const name = prev[i]; if (!name) return prev;
      const next = [...prev]; next[i] = null;
      recalc(next);
      return next;
    });
    const slotName = slots[i];
    if (slotName) pushMessage("system", `从技能槽位 ${i + 1} 卸下【${slotName}】。`);
  }, [recalc, pushMessage, slots]);

  const unequipGear = useCallback(slotId => {
    setEquipped(prev => {
      const item = prev[slotId]; if (!item) return prev;
      pushMessage("system", `卸下装备：${item.name}。`);
      return { ...prev, [slotId]: null };
    });
  }, [pushMessage]);

  // ── 行动分类 ─────────────────────────────────────────
  const allCurActions = areaActions[area] || [];
  const curActions = allCurActions.filter(a => !ACTION_DATA[a]?.stCost?.startsWith("rest") && !ACTION_DATA[a]?.stRestore);
  const curRest = allCurActions.filter(a => ACTION_DATA[a]?.stCost?.startsWith("rest") || ACTION_DATA[a]?.stRestore);
  const travel = AREAS[area]?.travel || [];
  const curArea = AREAS[area];

  const zhouStatus = getAgentStatus("lao_zhou", worldTime.timeOfDay);
  const laoZhou = agents.lao_zhou;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Noto Serif SC', serif", fontSize: 13, display: "flex", flexDirection: "column" }}>
      {notif && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent, padding: "7px 20px", borderRadius: 6, zIndex: 999, fontSize: 13, pointerEvents: "none" }}>
          {notif}
        </div>
      )}

      {/* 顶栏 */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 14px", display: "flex", alignItems: "center", gap: 12, background: C.panel, flexShrink: 0 }}>
        <span style={{ color: C.accent, fontWeight: "bold", fontSize: 15, letterSpacing: 3 }}>Earthly</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>Phase 1 · 测试版</span>
        <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 11 }}>
          {(curArea?.breadcrumb || [curArea?.label])
            .map((seg, i, arr) => (
              <span key={i}>
                <span style={{ color: i === arr.length - 1 ? C.text : C.textDim }}>{seg}</span>
                {i < arr.length - 1 && <span style={{ margin: "0 5px", color: C.border }}>/</span>}
              </span>
            ))}
        </span>
        <span style={{ color: C.textDim, fontSize: 11 }}>{worldTime.label}</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>{worldTime.isDay ? '☀' : '🌙'}</span>
        <span style={{ color: C.gold, fontSize: 11 }}>💰 {gold} G</span>
        <button onClick={() => {
          if (window.confirm("确定要重置游戏吗？所有进度将会清除。")) {
            localStorage.removeItem(saveKey);
            window.location.reload();
          }
        }}
          style={{ fontSize: 11, color: "#6b6880", border: "1px solid #2a2a35", background: "transparent", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
          重置
        </button>
      </div>

      {/* 三栏 */}
      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 220px", flex: 1, minHeight: 0 }}>
        <LeftPanel
          stamina={stamina}
          displayStats={displayStats}
          debuffed={debuffed}
          stPct={stPct}
          equipped={equipped}
          onUnequipGear={unequipGear}
          slots={slots}
          skills={skills}
          onUnequipSkillSlot={unequipSkillSlot}
          worldTime={worldTime}
        />
        <MainPanel
          narrative={narrative}
          messages={messages}
          pushMessage={pushMessage}
          curActions={curActions}
          curRest={curRest}
          travel={travel}
          stPct={stPct}
          onAction={doAction}
          onTravel={travelTo}
          curArea={curArea}
          areaKey={area}
          zhouStatus={zhouStatus}
          laoZhou={laoZhou}
          onZhouFishing={observeZhouFishing}
          onZhouIdentity={observeZhouIdentity}
          worldTime={worldTime}
        />
        <RightPanel
          skills={skills}
          slots={slots}
          gold={gold}
          items={items}
          onEquipSkill={equipSkill}
          onUnequipSkillSlot={unequipSkillSlot}
          equipped={equipped}
          onUnequipGear={unequipGear}
          worldTime={worldTime}
        />
      </div>
      {SHOW_SIMULATION_INSPECTOR && <SimulationInspector world={inspector.world} trace={inspector.trace} replay={inspector.replay} />}
    </div>
  );
}
