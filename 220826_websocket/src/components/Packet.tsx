import React from "react";
import { clamp, spring01 } from "../lib/anim";
import { MONO } from "../lib/fonts";
import { C, dim } from "../lib/tokens";
import { FPS } from "../scenes/WebSocket/constants";
import type { PacketState } from "../scenes/WebSocket/sim";

const PILL_TEXT: Record<string, string> = {
  upgrade: "UPGRADE",
  ok101: "101",
  close: "CLOSE",
};

/** mono 24px ≈ 14.4px/ký tự. Đo TỪ dài nhất, đừng đoán. */
const pillW = (t: string) => t.length * 14.4 + 36;

type Props = { p: PacketState; color: string };

/**
 * Gói mang màu của NGƯỜI GỬI — nên tràng gói lên không có gói xuống nào trước
 * nó đọc ra ngay là "server tự nói".
 */
export const Packet: React.FC<Props> = ({ p, color }) => {
  // Nhún ra khỏi node có đà, không bật tức thì.
  const s = clamp(spring01(p.age / FPS, { omega: 20, zeta: 0.5 }));
  if (s <= 0.002) return null;

  if (p.kind === "msg") {
    return (
      <>
        <ellipse cx={p.x} cy={p.y} rx={32 * s} ry={38 * s} fill={dim(color, 0.16)} />
        {/* Kéo dài theo trục bay = lean theo hướng đi. */}
        <ellipse cx={p.x} cy={p.y} rx={15 * s} ry={21 * s} fill={color} />
      </>
    );
  }

  const text = PILL_TEXT[p.kind];
  const tone = p.kind === "ok101" ? C.pass : color;
  const w = pillW(text);
  const h = 46;

  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${s}) translate(${-p.x} ${-p.y})`}>
      <rect
        x={p.x - w / 2}
        y={p.y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={C.bgPanel}
        stroke={tone}
        strokeWidth={2}
      />
      <rect
        x={p.x - w / 2}
        y={p.y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={dim(tone, 0.14)}
      />
      <text
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={MONO}
        fontSize={24}
        letterSpacing="0.1em"
        fill={tone}
      >
        {text}
      </text>
    </g>
  );
};
