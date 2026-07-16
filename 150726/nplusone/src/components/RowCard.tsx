import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Một record trong list. Ô author trống = lý do khiến một query nữa phải bắn đi.
 *
 * Luật đèn rọi ở đây: author ĐÃ ĐIỀN là **trắng**, không phải accent —
 * nó là *trạng thái*, không phải *đang xảy ra*. Chỉ row đang chờ query
 * của chính nó mới được mặc accent, và nhả ra ngay khi xong.
 */
export const RowCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
  /** null = chưa fetch → hiện "···" */
  author: string | null;
  /** 0 = idle/done, 1 = row này đang chờ query của chính nó */
  waiting?: number;
  opacity?: number;
}> = ({ x, y, w, h, index, author, waiting = 0, opacity = 1 }) => {
  const hot = waiting > 0.02;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 10,
        border: `1.5px solid ${hot ? C.accent : C.line}`,
        backgroundColor: C.bgPanel,
        boxShadow: hot ? nodeGlow(C.accent, waiting * 0.5) : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 22,
        paddingRight: 22,
        opacity,
      }}
    >
      <span style={{ fontFamily: F.mono, fontSize: 22, color: C.textDim }}>
        {`post ${String(index + 1).padStart(2, "0")}`}
      </span>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 22,
          color: author ? C.text : C.textFaint,
          letterSpacing: author ? "0" : "0.3em",
        }}
      >
        {author ?? "···"}
      </span>
    </div>
  );
};
