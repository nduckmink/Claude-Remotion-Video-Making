import React from "react";
import { MONO } from "../lib/fonts";
import { C } from "../lib/tokens";
import { READOUT_HTTP, READOUT_WS } from "../scenes/WebSocket/constants";

/**
 * Số liệu sống TRONG node đã sinh ra nó — không ngồi cạnh connector để đẩy nó
 * lệch trục (scene_composition.md). `state flip` đúng lúc socket khoá.
 */
export const Readout: React.FC<{ t: number; color: string }> = ({ t, color }) => (
  <div style={{ position: "relative", height: 30, width: 300, marginTop: 4 }}>
    {[
      // Crossfade tại chỗ = hai dòng chữ đè nhau thành mớ không đọc được suốt
      // 12 frame. Tắt HẲN cái cũ rồi mới bật cái mới: không frame nào chồng.
      { text: READOUT_HTTP, o: Math.max(0, 1 - 2 * t), c: C.textDim },
      { text: READOUT_WS, o: Math.max(0, 2 * t - 1), c: color },
    ].map((s) => (
      <div
        key={s.text}
        style={{
          position: "absolute",
          inset: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: "0.06em",
          lineHeight: "30px",
          color: s.c,
          opacity: s.o,
        }}
      >
        {s.text}
      </div>
    ))}
  </div>
);
