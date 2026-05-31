import { useRef, useEffect } from "react";
import { C } from "../App";
import { AREAS } from "../data/areas";

export default function MainPanel({ narrative, log, curActions, curRest, travel, stPct, onAction, onTravel, curArea }) {
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

      {/* 行动 / 休息 / 前往 */}
      <div style={{ padding: "0 16px 10px 16px", marginTop: "14px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {curActions.map(a => (
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
            const destLabel = AREAS[key]?.label || key;
            const prefix = curArea?.breadcrumb?.[0];
            const displayLabel = prefix && destLabel.startsWith(prefix + " · ")
              ? destLabel.slice((prefix + " · ").length)
              : destLabel;
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
                ▶ {displayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 事件日志 */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "7px 16px", maxHeight: 80, overflowY: "auto" }} ref={logRef}>
        <div style={{ ...sec, marginBottom: 3 }}>── 事件日志 ──</div>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 12, color: i === 0 ? C.log0 : C.log1, paddingLeft: 6, borderLeft: i === 0 ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: 1 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}
