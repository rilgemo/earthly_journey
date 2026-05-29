import { useState } from "react";
import { C } from "../App";
import { SKILL_TYPE_COLOR } from "../data/skills";

export default function RightPanel({ skills, slots, gold, items, onEquipSkill, onUnequipSkillSlot }) {
  const [tab, setTab] = useState("技能");
  const [selected, setSelected] = useState(null);

  const equippedNames = slots.filter(Boolean);
  const unequipped = skills.filter(s => !slots.includes(s.name));

  const panel = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px", marginBottom: 7 };
  const sec = { fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 5 };
  const tabBtn = active => ({ flex: 1, padding: "3px 0", fontSize: 11, borderRadius: 4, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentDim : "transparent", color: active ? C.accent : C.textDim, cursor: "pointer" });

  const SkillRow = ({ sk, isEquipped }) => (
    <div onClick={() => setSelected(sk.name)}
      style={{ marginBottom: 4, padding: "6px 8px", borderRadius: 5, border: `1px solid ${isEquipped ? SKILL_TYPE_COLOR[sk.type] : C.border}`, background: isEquipped ? "#1a1a22" : C.panel, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1 }}>
        <span style={{ color: SKILL_TYPE_COLOR[sk.type], fontSize: 12 }}>【{sk.name}】</span>
        <span style={{ color: C.textDim, fontSize: 10, marginLeft: 4 }}>Lv.{sk.level}</span>
      </div>
      <div style={{ height: 3, width: 36, background: C.border, borderRadius: 1 }}>
        <div style={{ height: "100%", width: `${(sk.xp % 20) / 20 * 100}%`, background: SKILL_TYPE_COLOR[sk.type], borderRadius: 1 }} />
      </div>
    </div>
  );

  return (
    <div style={{ borderLeft: `1px solid ${C.border}`, padding: 9, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 7 }}>
        {["技能", "背包"].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(null); }} style={tabBtn(tab === t)}>{t}</button>
        ))}
      </div>

      {/* ── 技能面板 ── */}
      {tab === "技能" && (
        <div style={{ flex: 1 }}>
          {!selected && (
            <>
              {equippedNames.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={sec}>已装备</div>
                  {equippedNames.map(name => {
                    const sk = skills.find(s => s.name === name);
                    return sk ? <SkillRow key={name} sk={sk} isEquipped /> : null;
                  })}
                </div>
              )}
              {unequipped.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={sec}>未装备</div>
                  {unequipped.map(sk => <SkillRow key={sk.name} sk={sk} isEquipped={false} />)}
                </div>
              )}
              {skills.length === 0 && (
                <div style={{ color: C.textDim, fontSize: 12, padding: "8px 4px" }}>
                  尚未习得任何技能。<br />探索世界来发现技能。
                </div>
              )}
            </>
          )}

          {/* 技能详情 */}
          {selected && (() => {
            const sk = skills.find(s => s.name === selected);
            if (!sk) return null;
            const slotIdx = slots.indexOf(sk.name);
            const isEquipped = slotIdx !== -1;
            return (
              <div>
                <button onClick={() => setSelected(null)} style={{ fontSize: 11, color: C.textDim, background: "none", border: "none", cursor: "pointer", marginBottom: 6, padding: 0 }}>← 返回</button>
                <div style={panel}>
                  <div style={{ color: SKILL_TYPE_COLOR[sk.type], fontSize: 14, marginBottom: 2 }}>【{sk.name}】</div>
                  <div style={{ color: C.textDim, fontSize: 11, marginBottom: 6 }}>{sk.type} · Lv.{sk.level} · {sk.xp % 20}/20 XP</div>
                  <div style={{ color: C.text, fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>{sk.desc}</div>
                  <div style={{ ...sec, marginBottom: 4 }}>属性加成（每级）</div>
                  {Object.entries(sk.stats || {}).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: v > 0 ? C.green : C.red, padding: "1px 0" }}>
                      <span>{k}</span><span>{v > 0 ? `+${v}` : v} × Lv</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
                  {isEquipped ? (
                    <button onClick={() => { onUnequipSkillSlot(slotIdx); setSelected(null); }}
                      style={{ width: "100%", padding: "5px", borderRadius: 4, border: `1px solid ${C.red}`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 12 }}>
                      卸下技能
                    </button>
                  ) : (
                    <>
                      <div style={{ ...sec, marginBottom: 4 }}>装备到技能槽位</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {slots.map((s, i) => (
                          <button key={i} onClick={() => !s && onEquipSkill(sk.name, i)}
                            style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${s ? C.border : C.green}`, background: "transparent", color: s ? C.textDim : C.green, cursor: s ? "default" : "pointer", fontSize: 11, opacity: s ? 0.4 : 1 }}>
                            {s ? `${s.slice(0, 3)}…` : `空槽 ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 背包面板 ── */}
      {tab === "背包" && (
        <div style={panel}>
          <div style={sec}>背 包</div>
          <div style={{ fontSize: 12, color: C.gold, marginBottom: 7, padding: "4px 6px", border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", justifyContent: "space-between" }}>
            <span>金币</span><span>{gold} G</span>
          </div>
          {items.length === 0
            ? <div style={{ color: C.textDim, fontSize: 12 }}>空空如也。</div>
            : items.map(it => (
              <div key={it.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "5px 6px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text }}>{it.name}</span>
                <span style={{ color: C.gold }}>×{it.qty}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
