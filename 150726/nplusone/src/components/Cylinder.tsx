import { C, F } from "../lib/tokens";

/**
 * Database / storage / origin. Khối góc cạnh RỖNG, phải là thứ "nặng" nhất khung.
 *
 * Như mọi khung khác: nó SÁNG LÊN khi đang xử lý, không đổi màu.
 * Accent để dành cho packet — thứ thật sự đang xảy ra.
 */
export const Cylinder: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  /** 0 = rỗi, 1 = đang xử lý */
  live?: number;
  /** nhịp thở idle — scene không bao giờ chết đứng */
  scale?: number;
}> = ({ x, y, w, h, label, sub, live = 0, scale = 1 }) => {
  const ry = 30;
  const sw = 2;
  const inset = sw / 2;
  const rx = w / 2 - inset;
  const stroke = live > 0.02 ? C.lineLive : C.line;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        scale,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={`M ${inset} ${ry} L ${inset} ${h - ry} A ${rx} ${ry} 0 0 0 ${w - inset} ${h - ry} L ${w - inset} ${ry}`}
          fill={C.bgPanel}
          stroke={stroke}
          strokeWidth={sw}
        />
        <ellipse
          cx={w / 2}
          cy={ry}
          rx={rx}
          ry={ry}
          fill={C.bg}
          stroke={stroke}
          strokeWidth={sw}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingTop: ry,
        }}
      >
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 34,
            letterSpacing: "0.14em",
            color: C.text,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        {sub ? (
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textDim }}>
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
};
