import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DataBlock } from "../../../components/DataBlock";
import { GridBg } from "../../../components/GridBg";
import { Hammer } from "../../../components/Hammer";
import { Header } from "../../../components/Header";
import { Hexagon } from "../../../components/Hexagon";
import { Link } from "../../../components/Link";
import { Node } from "../../../components/Node";
import { Ripple } from "../../../components/Ripple";
import { SaltPill } from "../../../components/SaltPill";
import { C, idColor } from "../../../lib/tokens";
import {
  BCRYPT,
  BCRYPT_LABEL,
  BCRYPT_SUB,
  BLOCK,
  DATABASE,
  DB_LABEL,
  FLOW_Y,
  FRONTEND,
  FRONTEND_LABEL,
  H,
  HACKER_R,
  HASH,
  HAMMER_ARM,
  HAMMER_HEAD,
  HACKER_LABEL,
  LABEL_SIZE,
  LOOP,
  N_USERS,
  PASSWORD,
  SALT,
  STROKE,
  SUB_SIZE,
  TITLE,
  W,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

/**
 * MÀU LÀ DANH TÍNH: mỗi người dùng một màu, sinh bằng công thức
 * (Resource/style_guide.md) — không nhặt tay. Ba trạm thì TRUNG TÍNH: chúng là
 * hạ tầng, và hạ tầng thì rỗng và không màu. Hacker là thứ cam duy nhất động
 * trên stage.
 */
const USER = Array.from({ length: N_USERS }, (_, i) => idColor(i, N_USERS));

const sfxFile = (e: Ev) => (e.kind === "arrive" ? `arrive-${(e.i ?? 0) + 1}.wav` : `${e.kind}.wav`);

const VOL: Record<Ev["kind"], number> = {
  emit: 0.7,
  arrive: 0.75,
  attach: 0.8,
  absorb: 1,
  install: 0.9,
  fail: 1,
  drop: 0.85,
};

export const PasswordHashingV2: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Đường ống chạy suốt frontend → database ngay từ frame 0. Khối bcrypt
          lát nữa CHEN VÀO giữa nó, chứ không đẻ ra đường mới. */}
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <Link
            x0={FRONTEND.x + FRONTEND.w}
            y0={FLOW_Y}
            x1={DATABASE.x}
            y1={FLOW_Y}
            live={s.flowLive}
            width={STROKE}
          />
        </svg>
      </AbsoluteFill>

      <Node
        x={FRONTEND.x}
        y={FRONTEND.y}
        w={FRONTEND.w}
        h={FRONTEND.h}
        label={FRONTEND_LABEL}
        labelSize={LABEL_SIZE}
        strokeWidth={STROKE}
        labelAtTop
        live={s.frontendLive}
      />

      {s.bcrypt > 0.001 ? (
        <Node
          x={BCRYPT.x}
          y={BCRYPT.y}
          w={BCRYPT.w}
          h={BCRYPT.h}
          label={BCRYPT_LABEL}
          sub={BCRYPT_SUB}
          labelSize={LABEL_SIZE}
          subSize={SUB_SIZE}
          strokeWidth={STROKE}
          labelAtTop
          live={s.bcryptLive}
          opacity={s.bcrypt}
          scale={0.94 + 0.06 * s.bcrypt}
        />
      ) : null}

      <Node
        x={DATABASE.x}
        y={DATABASE.y}
        w={DATABASE.w}
        h={DATABASE.h}
        label={DB_LABEL}
        labelSize={LABEL_SIZE}
        strokeWidth={STROKE}
        labelAtTop
        live={s.dbLive}
        alarm={s.dbAlarm}
      />

      {/* Đe: nét mảnh dưới chân bản ghi, để cú búa có chỗ dừng nhìn thấy được. */}
      {s.bcrypt > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 46,
            top: FLOW_Y + BLOCK.h / 2 + 8,
            width: 92,
            height: STROKE,
            backgroundColor: C.line,
            opacity: s.bcrypt,
          }}
        />
      ) : null}

      {s.recs.map((r) => (
        <DataBlock
          key={`rec-${r.i}`}
          x={r.x}
          y={r.y}
          w={BLOCK.w}
          h={BLOCK.h}
          color={USER[r.i]}
          text={r.hashed ? HASH[r.i] : PASSWORD[r.i]}
          chars={r.chars}
          opacity={r.opacity}
          scale={r.scale}
          rotate={r.rot}
        />
      ))}

      {s.salts.map((v) => (
        <SaltPill key={`salt-${v.i}`} x={v.x} y={v.y} value={SALT[v.i]} opacity={v.opacity} />
      ))}

      {s.hammer ? (
        <Hammer
          headX={HAMMER_HEAD.x}
          headY={HAMMER_HEAD.y}
          arm={HAMMER_ARM}
          swing={s.hammer.swing}
          opacity={s.hammer.opacity}
        />
      ) : null}

      {s.hacker ? (
        <Hexagon
          x={s.hacker.x}
          y={s.hacker.y}
          r={HACKER_R}
          label={HACKER_LABEL}
          impact={s.hacker.impact}
          opacity={s.hacker.opacity}
          rotate={s.hacker.rot}
        />
      ) : null}

      {/* Cú húc thủng — ring nở ra ở đúng chỗ đỉnh nhọn chạm đáy database. */}
      {s.dbRipple >= 0 ? (
        <Ripple
          x={850}
          y={DATABASE.y + DATABASE.h}
          t={s.dbRipple}
          color={C.brand}
          from={30}
          to={130}
          width={STROKE}
        />
      ) : null}

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
