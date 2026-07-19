import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Link } from "../../components/Link";
import { Lock } from "../../components/Lock";
import { Node } from "../../components/Node";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import {
  CLIENT,
  CLIENT_LABEL,
  ERR_TEXT,
  UPDATE,
  GATEWAY,
  GATEWAY_LABEL,
  H,
  LABEL_SIZE,
  LOOP,
  SERVICES,
  STROKE,
  SUB_SIZE,
  SVC,
  TITLE,
  W,
  svcBox,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

/**
 * MÀU LÀ DANH TÍNH: mỗi service một màu sinh bằng công thức. Client + gateway
 * là HẠ TẦNG nên trung tính. Packet luôn trắng — tương phản do số đường/số ổ
 * khoá gánh, không do màu.
 */
const SVC_COLOR = SERVICES.map((_, i) => idColor(i, SERVICES.length));

const sfxFile = (e: Ev) => `${e.kind}.wav`;
const VOL: Record<Ev["kind"], number> = {
  emit: 0.6,
  absorb: 0.7,
  arrive: 0.8,
  fail: 1,
  drop: 0.9,
  install: 0.9,
  attach: 0.8,
};

export const ApiGateway: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Mọi kết nối ở cùng một lớp svg, dưới lớp node (node che đầu đường). */}
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {s.links.map((l, k) =>
            l.opacity > 0.001 ? (
              <Link
                key={`lk-${k}`}
                x0={l.x0}
                y0={l.y0}
                x1={l.x1}
                y1={l.y1}
                live={l.live}
                broken={l.broken}
                draw={l.draw}
                opacity={l.opacity}
                width={STROKE}
              />
            ) : null,
          )}
        </svg>
      </AbsoluteFill>

      {/* Packet — trắng, tròn. */}
      {s.packets.map((p, k) =>
        p.opacity > 0.01 ? (
          <div
            key={`pk-${k}`}
            style={{
              position: "absolute",
              left: p.x - 13,
              top: p.y - 13,
              width: 26,
              height: 26,
              borderRadius: 999,
              backgroundColor: p.color,
              boxShadow: `0 0 16px ${p.color}77`,
              opacity: p.opacity,
            }}
          />
        ) : null,
      )}

      <Node
        x={CLIENT.x}
        y={CLIENT.y}
        w={CLIENT.w}
        h={CLIENT.h}
        label={CLIENT_LABEL}
        labelSize={LABEL_SIZE}
        strokeWidth={STROKE}
        live={s.clientLive}
      />

      {s.gateway > 0.001 ? (
        <Node
          x={GATEWAY.x}
          y={GATEWAY.y}
          w={GATEWAY.w}
          h={GATEWAY.h}
          label={GATEWAY_LABEL}
          labelSize={LABEL_SIZE}
          strokeWidth={STROKE}
          opacity={s.gateway}
          scale={0.94 + 0.06 * s.gateway}
          live={s.gatewayLive}
        />
      ) : null}

      {/* Gateway NUỐT update → loé xanh (pass). "Chỉ sửa MỘT chỗ." */}
      {s.gwUpdateFlash > 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: GATEWAY.x,
            top: GATEWAY.y,
            width: GATEWAY.w,
            height: GATEWAY.h,
            borderRadius: 16,
            border: `${STROKE}px solid ${C.pass}`,
            boxShadow: nodeGlow(C.pass, s.gwUpdateFlash),
            opacity: s.gwUpdateFlash,
          }}
        />
      ) : null}

      {/* Khối UPDATE bay vào từ trái — XANH LÁ (thay đổi hợp lệ, sắp áp dụng). */}
      {s.updates.map((u, k) => (
        <div
          key={`upd-${k}`}
          style={{
            position: "absolute",
            left: u.x - UPDATE.w / 2,
            top: u.y - UPDATE.h / 2,
            width: UPDATE.w,
            height: UPDATE.h,
            borderRadius: 8,
            backgroundColor: C.pass,
            boxShadow: nodeGlow(C.pass, 0.5),
            opacity: u.opacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 17,
            color: C.bg,
            whiteSpace: "nowrap",
          }}
        >
          {u.label}
        </div>
      ))}

      {/* 404 bay lên tan dần — chỉ act 1. Client thấy lỗi; act 2 không bao giờ. */}
      {s.errors.map((e, k) => (
        <div
          key={`err-${k}`}
          style={{
            position: "absolute",
            left: e.x - 120,
            top: e.y - 16,
            width: 240,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 22,
            letterSpacing: "0.04em",
            color: C.brand,
            opacity: e.opacity,
            textShadow: `0 0 16px ${C.brand}88`,
          }}
        >
          {ERR_TEXT}
        </div>
      ))}

      {/* Services tán ra. Rung (dx) + port đổi + loé nhận/rớt. */}
      {SERVICES.map((def, i) => {
        const box = svcBox(i);
        const st = s.svcs[i];
        return (
          <Node
            key={`svc-${i}`}
            x={box.x}
            y={box.y}
            w={SVC.w}
            h={SVC.h}
            label={def.label}
            sub={st.port}
            labelSize={LABEL_SIZE}
            subSize={SUB_SIZE}
            strokeWidth={STROKE}
            tint={SVC_COLOR[i]}
            dx={st.dx}
            live={st.recv}
            flash={st.recv}
            alarm={st.fail}
          />
        );
      })}

      {/* Ổ khoá auth. Act 1: 3 cái (lặp lại). Act 2: 1 cái ở cửa gateway. */}
      {s.locks.map((lk, k) =>
        lk.opacity > 0.02 ? (
          <Lock key={`lock-${k}`} x={lk.x} y={lk.y} state={lk.state} pulse={lk.pulse} opacity={lk.opacity} scale={lk.scale} />
        ) : null,
      )}

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
