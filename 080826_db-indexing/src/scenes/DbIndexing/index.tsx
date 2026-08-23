import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Hud } from "../../components/Hud";
import { Node } from "../../components/Node";
import { Strip } from "../../components/Strip";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import {
  CARD,
  FANOUT,
  HUD,
  INSERT_KEY,
  LEAF,
  LOOP,
  MID,
  N,
  N_LEAF,
  N_MID,
  PHYSICAL,
  QUERY,
  QUERY_CARD,
  ROOT,
  SORTED,
  STRIP,
  TITLE,
  cardX,
  leafX,
  midX,
} from "./constants";
import { EVENTS, INS_LEAF, PHYS_IDX, STATES, leafKeys, type Ev } from "./sim";

const TREE_COLOR = idColor(2, 4);
const VOL: Record<Ev["kind"], number> = { emit: 0.4, attach: 0.7, arrive: 0.65, fill: 0.7, fail: 0.85, drop: 0.7, slow: 0.7, travel: 0.3 };

/** Khoá phân hướng của nút giữa k: mốc để chọn nhánh. */
const midKeys = (k: number) => {
  const per = N / N_MID;
  const s = SORTED.slice(k * per, k * per + per);
  return [`≤${s[s.length - 1]}`];
};
const rootKeys = () => Array.from({ length: N_MID }, (_, k) => midKeys(k)[0]);

export const DbIndexing: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];
  const keys = [...PHYSICAL, INSERT_KEY];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* TRUY VẤN */}
      {s.query.present && s.query.opacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: QUERY_CARD.x - QUERY_CARD.w / 2,
            top: QUERY_CARD.y - QUERY_CARD.h / 2,
            width: QUERY_CARD.w,
            height: QUERY_CARD.h,
            transform: `scale(${0.9 + 0.1 * s.query.grow})`,
            transformOrigin: "center",
            opacity: s.query.opacity,
            borderRadius: 12,
            background: C.bgPanel,
            border: `2px solid ${C.lineLive}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 22, color: C.text }}>{QUERY}</span>
        </div>
      )}

      {/* ĐƯỜNG NỐI trong cây + hairline từ nút đang soi xuống các dòng ứng viên */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {s.root.on > 0.05 &&
          Array.from({ length: N_MID }).map((_, k) => (
            <line key={`rm${k}`} x1={ROOT.x} y1={ROOT.y + ROOT.h / 2} x2={midX(k)} y2={MID.y - MID.h / 2} stroke={s.mids[k].active > 0.3 ? TREE_COLOR : C.line} strokeWidth={s.mids[k].active > 0.3 ? 2.6 : 1.3} opacity={s.mids[k].on} />
          ))}
        {Array.from({ length: N_LEAF }).map((_, j) => {
          const k = Math.floor(j / FANOUT);
          const onPath = s.leaves[j].active > 0.3;
          return (
            <line key={`ml${j}`} x1={midX(k)} y1={MID.y + MID.h / 2} x2={leafX(j)} y2={LEAF.y - LEAF.h / 2} stroke={onPath ? TREE_COLOR : C.line} strokeWidth={onPath ? 2.6 : 1.3} opacity={s.leaves[j].on} />
          );
        })}

        {/* Lá NỐI CHUỖI theo thứ tự — vì vậy truy vấn khoảng cũng nhanh */}
        {s.leaves[N_LEAF - 1].on > 0.5 &&
          Array.from({ length: N_LEAF - 1 }).map((_, j) => (
            <line key={`ch${j}`} x1={leafX(j) + LEAF.w / 2} y1={LEAF.y} x2={leafX(j + 1) - LEAF.w / 2} y2={LEAF.y} stroke={C.line} strokeWidth={1.4} strokeDasharray="4 5" opacity={0.6 * s.leaves[j + 1].on} />
          ))}

        {/* Hairline: nút đang soi → các dòng còn là ứng viên */}
        {s.hop > 0 &&
          s.cards
            .filter((c) => !c.isNew && c.lit > 0.5)
            .map((c) => {
              const fromY = s.hop >= 3 ? LEAF.y + LEAF.h / 2 : s.hop === 2 ? MID.y + MID.h / 2 : ROOT.y + ROOT.h / 2;
              const fromX = s.hop >= 3 ? leafX(Math.floor(SORTED.indexOf(PHYSICAL[c.i]) / FANOUT)) : s.hop === 2 ? midX(Math.floor(SORTED.indexOf(PHYSICAL[c.i]) / (N / N_MID))) : ROOT.x;
              const strong = s.hop >= 4;
              return (
                <line
                  key={`hl${c.i}`}
                  x1={fromX}
                  y1={fromY}
                  x2={cardX(c.i)}
                  y2={STRIP.y - CARD.h / 2}
                  stroke={strong ? C.pass : TREE_COLOR}
                  strokeWidth={strong ? 3 : 1.4}
                  opacity={strong ? s.pointer.prog : 0.34}
                  style={strong ? { filter: `drop-shadow(${nodeGlow(C.pass, 0.7)})` } : undefined}
                />
              );
            })}
      </svg>

      {/* CÂY: root → 3 nút giữa → 9 lá */}
      {s.root.on > 0.01 && <Node x={ROOT.x} y={ROOT.y} w={ROOT.w} h={ROOT.h} keys={rootKeys()} on={s.root.on} active={s.root.active} accent={TREE_COLOR} />}
      {s.mids.map((m) => (m.on > 0.01 ? <Node key={m.k} x={midX(m.k)} y={MID.y} w={MID.w} h={MID.h} keys={midKeys(m.k)} on={m.on} active={m.active} accent={TREE_COLOR} /> : null))}
      {s.leaves.map((l) =>
        l.on > 0.01 ? (
          <Node
            key={l.j}
            x={leafX(l.j)}
            y={LEAF.y}
            w={LEAF.w}
            h={LEAF.h}
            keys={leafKeys(l.j)}
            on={l.on}
            active={l.active}
            accent={TREE_COLOR}
            isLeaf
            split={l.j === INS_LEAF ? l.split : 0}
            splitKeys={[
              [leafKeys(INS_LEAF)[0], leafKeys(INS_LEAF)[1]],
              [INSERT_KEY, leafKeys(INS_LEAF)[2]],
            ]}
          />
        ) : null,
      )}

      {/* Khoá mới bay vào cây */}
      {s.ins.present && s.ins.opacity > 0.01 && (
        <div style={{ position: "absolute", left: s.ins.x - 26, top: s.ins.y - 17, width: 52, height: 34, transform: `scale(${s.ins.scale})`, transformOrigin: "center", opacity: s.ins.opacity, borderRadius: 7, background: C.bgPanel, border: `2px solid ${C.pass}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: nodeGlow(C.pass, 0.6) }}>
          <span style={{ fontFamily: F.mono, fontSize: 15, color: C.pass }}>{INSERT_KEY}</span>
        </div>
      )}

      {/* BẢNG */}
      <Strip cards={s.cards} keys={keys} x={cardX} y={STRIP.y} w={CARD.w} h={CARD.h} targetIdx={PHYS_IDX} hit={Math.max(s.scan.found, s.pointer.prog)} />

      {/* CON SỐ: bao nhiêu lần phải đọc */}
      <Hud x={HUD.x} y={HUD.y} w={HUD.w} value={String(s.reads)} label={"reads\nrows or index nodes"} warn={s.reads > 8 ? 1 : 0} />

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        each level throws most of it away
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
