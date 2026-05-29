import { useState, useEffect, useCallback, useRef } from "react";
import { AREAS } from "./data/areas";
import { ACTION_DATA } from "./data/actions";
import { SKILL_SLOTS } from "./data/skills";
import LeftPanel from "./components/LeftPanel";
import MainPanel from "./components/MainPanel";
import RightPanel from "./components/RightPanel";

// ── 颜色系统（exported for use in child components） ──
export const C = {
  bg: "#0e0e12", panel: "#141418", border: "#2a2a35", borderHi: "#44445a",
  text: "#d4d0c8", textDim: "#6b6880", textHi: "#e8e4dc",
  accent: "#7c6fcd", accentDim: "#3d3666",
  green: "#5a9e6f", red: "#9e5a5a", gold: "#b89a4a",
  log0: "#c4c0b8", log1: "#7a7890",
  hp: "#8b3a3a", hpFill: "#c05050",
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

export default function App() {
  const [area, setArea] = useState("新叶镇·广场");
  const [areaActions, setAreaActions] = useState(
    () => Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [k, [...v.actions]]))
  );
  const [narrative, setNarrative] = useState(AREAS["新叶镇·广场"].intro);
  const [log, setLog] = useState([
    "你睁开眼睛。",
    "空气中飘着泥土与柴烟的气息。你站在新叶镇的广场中央。",
    "没有人告诉你该做什么。从哪里开始，由你决定。",
  ]);
  const [skills, setSkills] = useState([]);
  const [slots, setSlots] = useState(() => Array(SKILL_SLOTS).fill(null));
  const [baseStats, setBaseStats] = useState({ HP: { cur: 20, max: 20 }, 物攻: 0, 防御: 0, 魔攻: 0, 魔防: 0, 速度: 0, 精神: 0, 灵巧: 0 });
  const [stamina, setStamina] = useState(ST_MAX);
  const [gold, setGold] = useState(50);
  const [items, setItems] = useState([]);
  const [equipped, setEquipped] = useState(() => Object.fromEntries(EQUIP_SLOTS.map(s => [s.id, null])));
  const [notif, setNotif] = useState(null);

  const skillsRef = useRef([]);
  useEffect(() => { skillsRef.current = skills; }, [skills]);

  // 自动体力恢复
  useEffect(() => {
    const t = setInterval(() => setStamina(s => Math.min(ST_MAX, s + 1)), 15000);
    return () => clearInterval(t);
  }, []);

  const pushLog = useCallback((...entries) => setLog(p => [...entries, ...p].slice(0, 80)), []);
  const showNotif = useCallback(msg => { setNotif(msg); setTimeout(() => setNotif(null), 2600); }, []);

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
    HP: baseStats.HP,
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
    const b = { HP: { cur: 20, max: 20 }, 物攻: 0, 防御: 0, 魔攻: 0, 魔防: 0, 速度: 0, 精神: 0, 灵巧: 0 };
    newSlots.forEach(name => {
      if (!name) return;
      const s = sk.find(x => x.name === name);
      if (!s) return;
      Object.entries(s.stats || {}).forEach(([k, v]) => {
        if (k === "HP") b.HP.max += v * s.level;
        else b[k] = (b[k] || 0) + v * s.level;
      });
    });
    setBaseStats(prev => { b.HP.cur = Math.min(prev.HP.cur + (b.HP.max - prev.HP.max), b.HP.max); return b; });
  }, []);

  // ── 体力 ─────────────────────────────────────────────
  const drainSt = useCallback(amt => {
    setStamina(s => {
      const next = Math.max(0, s - amt);
      const np = (next / ST_MAX) * 100, pp = (s / ST_MAX) * 100;
      if (pp > ST_WARN && np <= ST_WARN && np > ST_CRIT) pushLog("⚠ 你感到明显的疲惫，状态开始下滑……");
      if (np <= ST_CRIT && pp > ST_CRIT) pushLog("⚠ 你几乎精疲力竭！能力大打折扣，请尽快休息。");
      return next;
    });
  }, [pushLog]);

  const restoreSt = useCallback(type => {
    setStamina(s => type === "full" ? ST_MAX : type === "part" ? Math.min(ST_MAX, s + 50) : Math.min(ST_MAX, s + 15));
  }, []);

  // ── 技能解锁 ─────────────────────────────────────────
  const unlockSkill = useCallback(def => {
    setSkills(prev => {
      if (prev.find(s => s.name === def.name)) return prev;
      pushLog(`✦ 新技能已解锁：【${def.name}】（${def.type}）`);
      showNotif(`✦ 【${def.name}】已解锁！`);
      return [...prev, { ...def, xp: 0, level: 1 }];
    });
  }, [pushLog, showNotif]);

  // ── 执行行动 ─────────────────────────────────────────
  const doAction = useCallback(name => {
    const d = ACTION_DATA[name];
    if (!d) { pushLog(`【${name}】（尚未开发）`); return; }

    const isRest = d.stCost?.startsWith("rest") || d.stRestore;
    if (stPct <= ST_CRIT && !isRest) { pushLog("⚠ 你已精疲力竭，请先休息。"); return; }

    if (d.cost?.gold) {
      if (gold < d.cost.gold) { pushLog(`金币不足（需要 ${d.cost.gold} G）。`); return; }
      setGold(g => g - d.cost.gold);
    }

    setNarrative(d.narrative || []);
    if (d.log) pushLog(...d.log);

    // 体力处理
    if (d.stCost === "rest_full") restoreSt("full");
    else if (d.stCost === "rest_part") restoreSt("part");
    else if (d.stCost === "rest_tiny" || d.stRestore === "tiny") restoreSt("tiny");
    else drainSt(ST_COST[d.stCost] || 0);

    if (d.hpRestore) setBaseStats(b => ({ ...b, HP: { ...b.HP, cur: Math.min(b.HP.max, b.HP.cur + d.hpRestore) } }));

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
      pushLog(`✦ 「${item.name}」已装备到${EQUIP_SLOTS.find(s => s.id === slot)?.label}槽位。`);
    }
    if (d.skillXp) setSkills(prev => prev.map(s => {
      if (s.name !== d.skillXp.name) return s;
      const xp = s.xp + d.skillXp.xp, lv = Math.floor(xp / 20) + 1;
      if (lv > s.level) pushLog(`✦ 【${s.name}】升级！Lv.${s.level} → Lv.${lv}`);
      return { ...s, xp, level: lv };
    }));
  }, [stPct, gold, pushLog, restoreSt, drainSt, unlockSkill]);

  // ── 移动区域 ─────────────────────────────────────────
  const travelTo = useCallback(key => {
    if (!AREAS[key]) return;
    setArea(key);
    setNarrative(AREAS[key].intro);
    pushLog(`── 前往「${AREAS[key].label}」`);
    drainSt(ST_COST.low);
  }, [pushLog, drainSt]);

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
    pushLog(`将【${skillName}】装备到技能槽位 ${slotIdx + 1}。`);
  }, [recalc, pushLog]);

  const unequipSkillSlot = useCallback(i => {
    setSlots(prev => {
      const name = prev[i]; if (!name) return prev;
      const next = [...prev]; next[i] = null;
      recalc(next);
      pushLog(`从技能槽位 ${i + 1} 卸下【${name}】。`);
      return next;
    });
  }, [recalc, pushLog]);

  const unequipGear = useCallback(slotId => {
    setEquipped(prev => {
      const item = prev[slotId]; if (!item) return prev;
      pushLog(`卸下装备：${item.name}。`);
      return { ...prev, [slotId]: null };
    });
  }, [pushLog]);

  // ── 行动分类 ─────────────────────────────────────────
  const allCurActions = areaActions[area] || [];
  const curActions = allCurActions.filter(a => !ACTION_DATA[a]?.stCost?.startsWith("rest") && !ACTION_DATA[a]?.stRestore);
  const curRest = allCurActions.filter(a => ACTION_DATA[a]?.stCost?.startsWith("rest") || ACTION_DATA[a]?.stRestore);
  const travel = AREAS[area]?.travel || [];
  const curArea = AREAS[area];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Noto Serif SC', serif", fontSize: 13, display: "flex", flexDirection: "column" }}>
      {notif && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: C.accentDim, border: `1px solid ${C.accent}`, color: C.accent, padding: "7px 20px", borderRadius: 6, zIndex: 999, fontSize: 13, pointerEvents: "none" }}>
          {notif}
        </div>
      )}

      {/* 顶栏 */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 14px", display: "flex", alignItems: "center", gap: 12, background: C.panel, flexShrink: 0 }}>
        <span style={{ color: C.accent, fontWeight: "bold", fontSize: 15, letterSpacing: 3 }}>天　赋</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>Phase 1 · 测试版</span>
        <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 11 }}>📍 {curArea?.label}</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>🕐 清晨</span>
        <span style={{ color: C.textDim, fontSize: 11 }}>☀ 晴</span>
        <span style={{ color: C.gold, fontSize: 11 }}>💰 {gold} G</span>
      </div>

      {/* 三栏 */}
      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 220px", flex: 1, minHeight: 0 }}>
        <LeftPanel
          baseStats={baseStats}
          stamina={stamina}
          displayStats={displayStats}
          debuffed={debuffed}
          stPct={stPct}
          equipped={equipped}
          onUnequipGear={unequipGear}
          slots={slots}
          skills={skills}
          onUnequipSkillSlot={unequipSkillSlot}
        />
        <MainPanel
          narrative={narrative}
          log={log}
          curActions={curActions}
          curRest={curRest}
          travel={travel}
          stPct={stPct}
          onAction={doAction}
          onTravel={travelTo}
        />
        <RightPanel
          skills={skills}
          slots={slots}
          gold={gold}
          items={items}
          onEquipSkill={equipSkill}
          onUnequipSkillSlot={unequipSkillSlot}
        />
      </div>
    </div>
  );
}
