import React from "react";
import { MONO } from "../lib/fonts";
import { C, dim } from "../lib/tokens";
import { NODE_H, NODE_W, NODE_X } from "../scenes/WebSocket/constants";

type Props = {
  y: number;
  color: string;
  label: string;
  sub: string;
  /** 0 = rỗi, 1 = vừa có việc xảy ra. Đổi ĐỘ SÁNG, không đổi hue. */
  heat: number;
  /** Nhịp thở idle — không frame nào chết cứng. */
  breath: number;
  /** Bo góc: nhẹ và linh hoạt (16) hay nặng và nền tảng (4). */
  radius: number;
  children?: React.ReactNode;
};

export const EndpointNode: React.FC<Props> = ({
  y,
  color,
  label,
  sub,
  heat,
  breath,
  radius,
  children,
}) => {
  const live = Math.min(1, heat);
  const alpha = 0.35 + 0.65 * live;
  const scale = 1 + 0.006 * breath + 0.008 * live;

  return (
    <div
      style={{
        position: "absolute",
        left: NODE_X,
        top: y,
        width: NODE_W,
        height: NODE_H,
        // Card phải ĐỤC: connector chạy xuyên qua là lộ ra "mấy hình chồng lên nhau".
        background: C.bgPanel,
        border: `${1.5 + 1.5 * live}px solid ${dim(color, alpha)}`,
        borderRadius: radius,
        boxShadow: live > 0.02 ? `0 0 ${24 * live}px ${dim(color, 0.4 * live)}` : undefined,
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 32,
          letterSpacing: "0.08em",
          color: C.text,
          textShadow: live > 0.02 ? `0 0 20px ${dim(color, 0.45 * live)}` : undefined,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, color: C.textDim }}>{sub}</div>
      {children}
    </div>
  );
};
