import { useRef, useEffect, useState, useMemo } from "react";
import { C } from "../App";
import { AREAS } from "../data/areas";

// Actions that require 老周 to be present at the forge.
const ZHOU_FORGE_ACTIONS = new Set(["与铁匠搭话", "靠近铁匠铺观摩锻造", "购买采矿镐（40G）"]);

export default function MainPanel({ narrative, messages, curActions, curRest, travel, stPct, onAction, onTravel, curArea, areaKey, zhouStatus }) {
  const [filter, setFilter] = useState("全部");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (filter === "本地") return m.type === "npc" || m.type === "player";
      if (filter === "系统") return m.type === "system" || m.type === "event";
      return true;
    });
  }, [messages, filter]);

  // ── Presence-gated action resolution ─────────────────
  const zhouAtForge = areaKey === "新叶镇·锻造铺" && zhouStatus?.location === "新叶镇·锻造铺";
  const zhouAtLin   = areaKey === "南边林地"       && zhouStatus?.location === "南边林地";

  let visibleActions = curActions;
  let zhouAbsenceMsg = null;

  if (areaKey === "新叶镇·锻造铺" && !zhouAtForge) {
    visibleActions = curActions.filter(a => !ZHOU_FORGE_ACTIONS.has(a));
    zhouAbsenceMsg = zhouStatus?.activity === "钓鱼"
      ? "炉火还温着，但老周不在——也许去钓鱼了。"
      : "锻造铺空着，老周似乎不在。";
  }

  if (zhouAtLin) {
    visibleActions = [...visibleActions, "看到老周在钓鱼"];
  }

  const blocked = stPct <= 10;
  const tabButtonStyle = active => ({
    flex: 1,
    padding: "4px 0",
    fontSize: 10,
    borderRadius: 3,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? C.accentDim : "transparent",
    color: active ? C.accent : C.textDim,
    cursor: "pointer",
  });
  const messageColor = type => {
    if (type === "system") return "#7a7890";
    if (type === "event") return "#c4c0b8";
    return "#d4d0c8";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* 叙事区 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", lineHeight: 2, fontSize: 14 }}>
        {narrative.map((p, i) => (
          <p key={i} style={{ margin: "0 0 10px", color: i === 0 ? C.textHi : C.text }}>{p}</p>
        ))}
      </div>

      {/* 行动 / 休息 / 前往 */}
      <div style={{ padding: "0 16px 10px 16px", marginTop: "14px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {zhouAbsenceMsg && (
            <div style={{ color: C.textDim, fontSize: 12, fontStyle: "italic", padding: "4px 2px" }}>
              {zhouAbsenceMsg}
            </div>
          )}
          {visibleActions.map(a => (
            <button key={a} onClick={() => onAction(a)}
              style={{
                width: "100%",
                padding: "5px 14px",
                borderRadius: 4,
                border: `1px solid ${blocked ? C.border : C.borderHi}`,
                background: "transparent",
                color: blocked ? C.textDim : C.text,
                cursor: blocked ? "not-allowed" : "pointer",
                fontSize: 13,
                textAlign: "left",
                opacity: blocked ? 0.45 : 1,
              }}
              onMouseEnter={e => { if (!blocked) e.currentTarget.style.borderColor = C.accent; }}
              onMouseLeave={e => { if (!blocked) e.currentTarget.style.borderColor = C.borderHi; }}>
              {a}
            </button>
          ))}

          {curRest.map(a => (
            <button key={a} onClick={() => onAction(a)}
              style={{
                width: "100%",
                padding: "5px 14px",
                borderRadius: 4,
                border: `1px solid ${C.green}`,
                background: "transparent",
                color: C.green,
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1a2e1f"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              ♦ {a}
            </button>
          ))}

          {travel.length > 0 && (curActions.length + curRest.length > 0) && (
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />
          )}

          {travel.map(key => {
            const destLabel = curArea?.breadcrumb?.[0] && AREAS[key]?.label?.startsWith(curArea.breadcrumb[0] + " · ")
              ? AREAS[key].label.slice((curArea.breadcrumb[0] + " · ").length)
              : AREAS[key]?.label || key;
            return (
              <button key={key} onClick={() => onTravel(key)}
                style={{
                  width: "100%",
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: `1px solid ${C.accent}`,
                  background: "#3d3666",
                  color: C.accent,
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#2f2a4a"}
                onMouseLeave={e => e.currentTarget.style.background = "#3d3666"}>
                ▶ {destLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 聊天面板 */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "7px 16px", height: 180, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {["全部", "本地", "系统"].map(label => (
            <button key={label} onClick={() => setFilter(label)} style={tabButtonStyle(filter === label)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, fontSize: 11, lineHeight: 1.6 }}>
          {filteredMessages.length === 0 ? (
            <div style={{ color: C.textDim }}>暂无消息。</div>
          ) : filteredMessages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 6, color: messageColor(msg.type) }}>
              {(msg.type === "npc" || msg.type === "player") ? (
                <>
                  <span style={{ color: msg.type === "npc" ? "#b89a4a" : "#7c6fcd" }}>[{msg.speaker}]</span>{" "}
                  <span>{msg.text}</span>
                </>
              ) : (
                <span>{msg.text}</span>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <input
          disabled
          placeholder="与附近的人说话……（即将开放）"
          style={{
            marginTop: 8,
            width: "100%",
            background: "#0e0e12",
            border: "1px solid #2a2a35",
            borderRadius: 4,
            padding: "5px 10px",
            color: "#6b6880",
            fontSize: 12,
            outline: "none",
            cursor: "not-allowed",
          }}
        />
      </div>
    </div>
  );
}
