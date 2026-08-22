import React from "react";
import { easeOutCubic, lerp } from "../lib/anim";
import { C, dim } from "../lib/tokens";
import type { RippleState } from "../scenes/WebSocket/sim";

/** Vòng ring nở ra rồi tan — không gì đi xuyên qua hệ thống mà hệ thống trơ ra. */
export const Ripple: React.FC<{ r: RippleState; color: string }> = ({ r, color }) => {
  const e = easeOutCubic(r.t);
  return (
    <circle
      cx={r.x}
      cy={r.y}
      r={lerp(8, 96, e)}
      fill="none"
      stroke={dim(r.tone === "pass" ? C.pass : color, (1 - r.t) * 0.75)}
      strokeWidth={lerp(3.5, 1, r.t)}
    />
  );
};
