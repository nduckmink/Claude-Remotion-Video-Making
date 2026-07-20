import { C, F, nodeGlow } from "../lib/tokens";

/**
 * POPUP đồng ý (tiếng Anh). Điểm mấu chốt của OAuth: user THẤY RÕ app xin gì
 * rồi mới cấp. Nút Allow sáng xanh `pass` khi bấm.
 */
export const ConsentPopup: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  appName: string;
  scope: string;
  appear?: number;
  approve?: number;
  opacity?: number;
}> = ({ x, y, w, appName, scope, appear = 1, approve = 0, opacity = 1 }) => {
  const h = 232;
  const on = approve;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${0.9 + 0.1 * appear})`,
        transformOrigin: "center",
        opacity: opacity * appear,
        borderRadius: 16,
        background: C.bgPanel,
        border: `2px solid ${C.lineLive}`,
        boxSizing: "border-box",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.16em", color: C.textDim, textTransform: "uppercase" }}>authorize</div>
      <div style={{ fontFamily: F.title, fontSize: 25, color: C.text, lineHeight: 1.2 }}>
        <span style={{ color: C.brand }}>{appName}</span> wants to access:
      </div>
      <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "7px 15px", borderRadius: 10, border: `1.5px solid ${C.pass}` }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: C.pass, boxShadow: `0 0 8px ${C.pass}` }} />
        <span style={{ fontFamily: F.mono, fontSize: 21, color: C.text }}>{scope}</span>
      </div>
      <div
        style={{
          marginTop: "auto",
          textAlign: "center",
          padding: "11px 0",
          borderRadius: 10,
          fontFamily: F.mono,
          fontSize: 21,
          letterSpacing: "0.08em",
          color: on > 0.5 ? C.bg : C.pass,
          background: on > 0.02 ? C.pass : "transparent",
          border: `2px solid ${C.pass}`,
          boxShadow: on > 0.02 ? nodeGlow(C.pass, on) : "none",
        }}
      >
        {on > 0.5 ? "✓ ALLOWED" : "ALLOW"}
      </div>
    </div>
  );
};
