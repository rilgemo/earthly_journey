import { useRef, useEffect } from "react";
import { C } from "../App";
import { ACTION_DATA } from "../data/actions";
import { AREAS } from "../data/areas";

export default function MainPanel({ narrative, log, curActions, curRest, travel, stPct, onAction, onTravel }) {
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 0; }, [log]);

  const sec = { fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 5 };
  const blocked = stPct <= 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* 叙事区 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", lineHeight: 2, fontSize: 14 }}>
        {narrative.map((p, i) => (
          <p key={i} style={{ margin: "0 0 10px", color: i === 0 ? C.textHi : C.text }}>{p}</p>
        ))}
      </div>

      {/* 事件日志 */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "7px 16px", maxHeight: 108, overflowY: "auto" }} ref={logRef}>
        <div style={{ ...sec, marginBottom: 3 }}>── 事件日志 ──</div>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 12, color: i === 0 ? C.log0 : C.log1, paddingLeft: 6, borderLeft: i === 0 ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: 1 }}>{l}</div>
        ))}
      </div>

      {/* 行动 / 休息 / 前往 */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 16px", flexShrink: 0 }}>
        {curActions.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ ...sec, marginBottom: 5 }}>── 行 动 ──</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {curActions.map(a => (
                <button key={a} onClick={() => onAction(a)}
                  style={{ padding: "5px 13px", borderRadius: 4, border: `1px solid ${blocked ? C.border : C.borderHi}`, background: "transparent", color: blocked ? C.textDim : C.text, cursor: blocked ? "not-allowed" : "pointer", fontSize: 13, opacity: blocked ? 0.45 : 1 }}
                  onMouseEnter={e => { if (!blocked) e.currentTarget.style.borderColor = C.accent; }}
                  onMouseLeave={e => { if (!blocked) e.currentTarget.style.borderColor = C.borderHi; }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {curRest.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ ...sec, marginBottom: 5 }}>── 休 息 ──</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {curRest.map(a => (
                <button key={a} onClick={() => onAction(a)}
                  style={{ padding: "5px 13px", borderRadius: 4, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a2e1f"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  ♦ {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {travel.length > 0 && (
          <div>
            <div style={{ ...sec, marginBottom: 5 }}>── 前 往 ──</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {travel.map(key => (
                <button key={key} onClick={() => onTravel(key)}
                  style={{ padding: "5px 13px", borderRadius: 4, border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  ▶ {AREAS[key]?.label || key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
