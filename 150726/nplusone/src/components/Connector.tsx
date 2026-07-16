import { C } from "../lib/tokens";

/** Connector. Solid = sync. Sáng lên (không đổi màu) khi có dữ liệu đi qua. */
export const Connector: React.FC<{
  x: number;
  y0: number;
  y1: number;
  /** 0 = trơ, 1 = đang có dữ liệu chạy qua */
  live?: number;
  dashed?: boolean;
}> = ({ x, y0, y1, live = 0, dashed = false }) => (
  <svg
    width={40}
    height={y1 - y0}
    viewBox={`0 0 40 ${y1 - y0}`}
    style={{ position: "absolute", left: x - 20, top: y0 }}
  >
    <line
      x1={20}
      y1={0}
      x2={20}
      y2={y1 - y0}
      stroke={live > 0.02 ? C.lineLive : C.line}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "8 8" : undefined}
    />
  </svg>
);
