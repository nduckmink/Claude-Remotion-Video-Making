import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EndpointNode } from "../../components/EndpointNode";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Packet } from "../../components/Packet";
import { Rail } from "../../components/Rail";
import { Readout } from "../../components/Readout";
import { Ripple } from "../../components/Ripple";
import { breathe } from "../../lib/anim";
import { C, idColor } from "../../lib/tokens";
import { BREATHE, CLIENT_Y, H, SERVER_Y, VOL, W } from "./constants";
import { EVENTS, STATES } from "./sim";

/** Hai danh tính, sinh ra bằng công thức — né nêm ±30° của cả brand lẫn pass. */
const CLIENT = idColor(0, 2);
const SERVER = idColor(1, 2);

export const WebSocketScene: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, STATES.length - 1)];
  const breath = breathe(frame, BREATHE);
  const laneColor = (dir: "down" | "up") => (dir === "down" ? CLIENT : SERVER);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <GridBg />

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {s.rails.map((r) => (
          <Rail
            key={r.key}
            rail={r}
            color={laneColor(r.dir)}
            busy={s.laneBusy[r.dir]}
            sweep={s.sweep}
          />
        ))}

        {s.ripples.map((r) => (
          <Ripple key={r.key} r={r} color={r.owner === "client" ? CLIENT : SERVER} />
        ))}

        {s.packets.map((p) => (
          <Packet key={p.key} p={p} color={laneColor(p.dir)} />
        ))}
      </svg>

      <EndpointNode
        y={CLIENT_Y}
        color={CLIENT}
        label="CLIENT"
        sub="browser"
        heat={s.clientHeat}
        breath={breath}
        radius={16}
      >
        <Readout t={s.readout} color={CLIENT} />
      </EndpointNode>

      <EndpointNode
        y={SERVER_Y}
        color={SERVER}
        label="SERVER"
        sub="wss://"
        heat={s.serverHeat}
        breath={-breath}
        radius={4}
      />

      <Header />

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.sfx}.wav`)} volume={VOL[e.vol]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
