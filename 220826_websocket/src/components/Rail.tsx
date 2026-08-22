import React from "react";
import { lerp } from "../lib/anim";
import { C, dim } from "../lib/tokens";
import { CLIENT_BOTTOM, LANE, SERVER_TOP } from "../scenes/WebSocket/constants";
import type { RailState } from "../scenes/WebSocket/sim";

type Props = { rail: RailState; color: string; busy: boolean; sweep: number };

/**
 * Xung "pass" LAN dọc tuyến lúc khoá — lõi sáng + hai quầng mờ kéo ngược chiều
 * đi, nên nó đọc ra là MỘT xung có đuôi và có hướng, không phải một que xanh.
 */
const Sweep: React.FC<{ x: number; u: number }> = ({ x, u }) => {
  const y = lerp(CLIENT_BOTTOM, SERVER_TOP, u);
  const seg = (len: number) =>
    `M ${x} ${Math.max(CLIENT_BOTTOM, y - len)} L ${x} ${Math.min(SERVER_TOP, y + len * 0.35)}`;
  const fade = 1 - u * u;
  return (
    <>
      <path d={seg(150)} stroke={dim(C.pass, 0.16 * fade)} strokeWidth={18} fill="none" />
      <path d={seg(90)} stroke={dim(C.pass, 0.45 * fade)} strokeWidth={8} fill="none" />
      <path d={seg(34)} stroke={dim(C.pass, 0.95 * fade)} strokeWidth={4} strokeLinecap="round" fill="none" />
    </>
  );
};

/**
 * Một LÀN. Trục Nét làm việc ở đây: dashed = kết nối tạm, sống đúng một lượt;
 * solid + dày + glow = socket đã khoá, ở lại.
 * Toạ độ lấy từ LANE — cùng nguồn với sim, nên đường vẽ trùng khít đường bay.
 */
export const Rail: React.FC<Props> = ({ rail, color, busy, sweep }) => {
  if (rail.draw <= 0.002) return null;

  const { x, from, to } = LANE[rail.dir];
  const yEnd = lerp(from, to, rail.draw);
  const d = `M ${x} ${from} L ${x} ${yEnd}`;

  // Lúc rỗi thì tối — màu sáng thường trực là màu đã tụt xuống thành trang trí.
  const a = (0.35 + 0.65 * (busy ? 1 : 0)) * rail.alpha;
  const lock = rail.lock;

  return (
    <>
      {lock > 0.01 && (
        <path d={d} stroke={dim(color, 0.13 * lock * rail.alpha)} strokeWidth={12} fill="none" />
      )}

      <path
        d={d}
        stroke={dim(color, a * (1 - lock))}
        strokeWidth={1.5}
        strokeDasharray="9 11"
        fill="none"
      />

      <path d={d} stroke={dim(color, a * lock)} strokeWidth={1.5 + 1.5 * lock} fill="none" />

      {sweep >= 0 && <Sweep x={x} u={sweep} />}
    </>
  );
};
