import React from "react";
import { INTER } from "../lib/fonts";
import { C } from "../lib/tokens";
import { GHOST, H, W } from "../scenes/WebSocket/constants";

/**
 * Nền toả tròn: MỘT gradient nâng tâm VÀ tối mép. Tâm ở 48% vì stage bắt đầu
 * từ y=310 — tâm hình học của khung nằm thấp hơn tâm bản vẽ.
 */
export const GridBg: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 78% 52% at 50% 48%, ${C.bgLift} 0%, ${C.bg} 72%)`,
      }}
    />

    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="dots" width={90} height={90} patternUnits="userSpaceOnUse">
          <circle cx={45} cy={45} r={1.5} fill={C.gridDim} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#dots)" />
    </svg>

    {/* Chữ chìm mang tên khái niệm — chủ đề, không phải trang trí. */}
    <div
      style={{
        position: "absolute",
        top: 680,
        width: W,
        textAlign: "center",
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: 500,
        lineHeight: "500px",
        letterSpacing: "-0.04em",
        color: C.ghost,
      }}
    >
      {GHOST}
    </div>
  </>
);
