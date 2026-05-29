import { C, EQUIP_SLOTS } from "../App";

function Bar({ label, cur, max, fillColor, bgColor, rightLabel }) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: rightLabel ? fillColor : C.text, fontSize: 10 }}>{rightLabel || `${cur} / ${max}`}</span>
      </div>
      <div style={{ height: 5, background: bgColor || C.border, borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: fillColor, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, dimmed }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0", color: dimmed ? C.stWarn : value > 0 ? C.text : C.textDim }}>
      <span>{label}{dimmed ? " ▼" : ""}</span>
      <span>{value > 0 ? value : "—"}</span>
    </div>
  );
}

export default function LeftPanel({ baseStats, stamina, displayStats, debuffed, stPct, equipped, onUnequipGear, slots, skills, onUnequipSkillSlot }) {
  const stColor = (p) => p > 69 ? C.stFull : p > 29 ? C.stOk : p > 9 ? C.stWarn : C.stCrit;
  const stLabel = (p) => p > 69 ? "充沛" : p > 29 ? "疲惫" : p > 9 ? "警戒" : "极限";

  const panel = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px", marginBottom: 7 };
  const sec = { fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 5 };

  return (
    <div style={{ borderRight: `1px solid ${C.border}`, padding: 9, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* 状态 */}
      <div style={panel}>
        <div style={sec}>状 态</div>
        <Bar label="HP" cur={baseStats.HP.cur} max={baseStats.HP.max} fillColor={C.hpFill} bgColor={C.hp} />
        <Bar label="体力" cur={stamina} max={100} fillColor={stColor(stPct)} bgColor="#1a1a1a" rightLabel={stLabel(stPct)} />
        {debuffed && (
          <div style={{ fontSize: 10, color: C.stWarn, margin: "4px 0", padding: "2px 6px", border: `1px solid ${C.stWarn}`, borderRadius: 3, textAlign: "center" }}>
            {stPct <= 10 ? "极限 · 属性 ×0.5" : "警戒 · 属性 ×0.7"}
          </div>
        )}
        <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
        {["物攻", "防御", "魔攻", "魔防", "速度", "精神", "灵巧"].map(k => (
          <StatRow key={k} label={k} value={displayStats[k]} dimmed={debuffed && displayStats[k] > 0} />
        ))}
      </div>

      {/* 装备栏 */}
      <div style={{ ...panel, flex: 1 }}>
        <div style={sec}>装 备</div>
        {EQUIP_SLOTS.map(sl => {
          const item = equipped[sl.id];
          return (
            <div key={sl.id} onClick={() => item && onUnequipGear(sl.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, padding: "4px 6px", borderRadius: 4, border: `1px solid ${item ? C.borderHi : C.border}`, background: item ? "#1a1a22" : "transparent", cursor: item ? "pointer" : "default" }}>
              <span style={{ fontSize: 14 }}>{item ? item.icon : sl.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textDim }}>{sl.label}</div>
                {item
                  ? <div style={{ fontSize: 11, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  : <div style={{ fontSize: 11, color: C.border }}>— 空 —</div>}
              </div>
              {item && (
                <div style={{ fontSize: 10, color: C.green, textAlign: "right", lineHeight: 1.4 }}>
                  {Object.entries(item.stats || {}).map(([k, v]) => <div key={k}>{v > 0 ? `+${v}` : v}{k}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
