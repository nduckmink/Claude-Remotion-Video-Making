import { C, F, nodeGlow } from "../lib/tokens";

/**
 * BẢNG — dải card nằm ngang, MỖI CARD LÀ MỘT DÒNG, theo đúng thứ tự chèn (xáo
 * trộn). Đây là chỗ dễ nói dối nhất: index KHÔNG sắp lại bảng, nên các dòng ứng
 * viên còn sáng sẽ nằm RẢI RÁC chứ không thành khối liền.
 *
 *   visited — con trỏ quét đã đi qua (nhịp full scan)
 *   lit     — còn nằm trong tập ứng viên; bị loại thì tối sập
 *   isNew   — dòng vừa được INSERT
 */
export const Strip: React.FC<{
  cards: { i: number; lit: number; visited: number; flash: number; opacity: number; isNew: boolean }[];
  keys: number[];
  x: (i: number) => number;
  y: number;
  w: number;
  h: number;
  targetIdx: number;
  hit?: number; // 0..1 đã tìm thấy
}> = ({ cards, keys, x, y, w, h, targetIdx, hit = 0 }) => (
  <>
    {cards.map((c) => {
      const isTarget = c.i === targetIdx;
      const on = c.lit > 0.5;
      const col = c.isNew ? C.pass : isTarget && hit > 0.3 ? C.pass : c.flash > 0.5 ? C.brand : on ? C.lineLive : C.line;
      const glow = c.flash > 0.5 ? nodeGlow(C.brand, 0.9) : (isTarget && hit > 0.3) || c.isNew ? nodeGlow(C.pass, 0.8) : "none";
      return (
        <div
          key={c.i}
          style={{
            position: "absolute",
            left: x(c.i) - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            opacity: c.opacity * (on ? 1 : 0.34),
            borderRadius: 5,
            background: c.visited > 0.5 ? "rgba(255,255,255,0.04)" : C.bgPanel,
            border: `${c.flash > 0.5 || c.isNew ? 2 : 1.4}px solid ${col}`,
            boxSizing: "border-box",
            boxShadow: glow === "none" ? undefined : glow,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 8,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 13, color: on ? C.text : C.textFaint, whiteSpace: "nowrap" }}>{keys[c.i] ?? ""}</span>
        </div>
      );
    })}
    {/* mép bàn */}
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={x(0) - w} y1={y + h / 2 + 12} x2={x(cards.length - 1) + w} y2={y + h / 2 + 12} stroke={C.line} strokeWidth={2} />
      <text x={x(0) - w / 2} y={y - h / 2 - 14} fontFamily={F.mono} fontSize={15} letterSpacing="0.16em" fill={C.textDim}>
        TABLE · INSERT ORDER
      </text>
    </svg>
  </>
);
