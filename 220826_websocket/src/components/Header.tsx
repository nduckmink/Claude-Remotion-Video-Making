import React from "react";
import { INTER, MONO } from "../lib/fonts";
import { C } from "../lib/tokens";
import { HAIRLINE_Y, HANDLE, TITLE, W } from "../scenes/WebSocket/constants";

/**
 * Header 2 dòng — TĨNH TUYỆT ĐỐI suốt loop.
 * Cái tĩnh là thứ tách chữ ký kênh khỏi cơ chế đang chạy: cam nào nhúc nhích
 * thì cam đó là cơ chế, cam đứng yên ở đỉnh khung là tên kênh (style_guide.md).
 */
export const Header: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: 126,
        width: W,
        textAlign: "center",
        fontFamily: MONO,
        fontSize: 22,
        lineHeight: "28px",
        letterSpacing: "0.12em",
        color: C.textFaint,
      }}
    >
      {HANDLE}
    </div>

    <div
      style={{
        position: "absolute",
        top: 162,
        width: W,
        textAlign: "center",
        fontFamily: INTER,
        fontWeight: 700,
        fontSize: 76,
        lineHeight: "92px",
        letterSpacing: "-0.02em",
        color: C.brand,
      }}
    >
      {TITLE}
    </div>

    {/* Hairline tràn mép — tách title block khỏi bản vẽ. */}
    <div
      style={{
        position: "absolute",
        top: HAIRLINE_Y,
        left: 0,
        width: W,
        height: 1,
        background: C.line,
      }}
    />
  </>
);
