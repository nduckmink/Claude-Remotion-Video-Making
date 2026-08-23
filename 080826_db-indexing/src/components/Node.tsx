import { C, F, nodeGlow } from "../lib/tokens";

/**
 * MỘT NÚT của B+ tree. Nút trong chỉ chứa KHOÁ + hướng đi; chỉ LÁ mới trỏ về
 * dòng thật. Nút đang được đi qua thì sáng; đã đi qua rồi thì mờ bớt — cả đường
 * đi hiện ra thành một vệt.
 *
 * `split` — lá bị tách làm đôi khi chèn thêm khoá vào một lá đã đầy.
 */
export const Node: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  keys: (number | string)[];
  on?: number; // 0..1 đã dựng xong
  active?: number; // 0..1 đang đi qua
  accent: string;
  isLeaf?: boolean;
  split?: number;
  splitKeys?: [(number | string)[], (number | string)[]];
}> = ({ x, y, w, h, keys, on = 1, active = 0, accent, isLeaf = false, split = 0, splitKeys }) => {
  const hot = active > 0.5;
  const col = hot ? accent : active > 0.1 ? accent : C.line;
  const fs = isLeaf ? 14 : 15;

  const face = (kk: (number | string)[], bw: number, dx: number, tint: string) => (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 + dx,
        top: y - h / 2,
        width: bw,
        height: h,
        opacity: on,
        borderRadius: 8,
        background: C.bgPanel,
        border: `${hot ? 2.4 : 1.6}px solid ${tint}`,
        boxSizing: "border-box",
        boxShadow: hot ? nodeGlow(accent, active) : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
      }}
    >
      {kk.map((k, i) => (
        <span key={i} style={{ fontFamily: F.mono, fontSize: fs, color: hot ? C.text : C.textDim, whiteSpace: "nowrap" }}>
          {k}
        </span>
      ))}
    </div>
  );

  if (split > 0.02 && splitKeys) {
    const bw = w / 2 - 5 + 4 * (1 - split);
    return (
      <>
        {face(splitKeys[0], bw, -6 * split, split > 0.5 ? C.brand : col)}
        {face(splitKeys[1], bw, w / 2 + 5 + 6 * split, split > 0.5 ? C.brand : col)}
      </>
    );
  }
  return face(keys, w, 0, col);
};
