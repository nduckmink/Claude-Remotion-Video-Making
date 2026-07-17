import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CheckoutUI } from "../../components/CheckoutUI";
import { Cursor } from "../../components/Cursor";
import { DataBlock } from "../../components/DataBlock";
import { Ticket } from "../../components/Ticket";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Link } from "../../components/Link";
import { Node } from "../../components/Node";
import { Ripple } from "../../components/Ripple";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import {
  AMOUNT,
  BALANCE_AT,
  BUTTON,
  CHARGE,
  KEY_STORE,
  MSG,
  STUB_W,
  H,
  IDEM_KEY,
  KEY_SHORT,
  STUB_EMPTY,
  STUB_RACK_W,
  LABEL_SIZE,
  LOOP,
  ORDER,
  REQ_FROM,
  REQ_TO,
  RES_FROM,
  RES_TO,
  SERVER,
  SERVER_LABEL,
  STROKE,
  TITLE,
  UI,
  W,
  ledger,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

/**
 * MÀU LÀ DANH TÍNH. Ở đây chỉ có MỘT danh tính — một đơn hàng — nên chỉ một
 * màu. Bốn request là CÙNG một ý định; tô chúng bốn màu là nói dối rằng chúng
 * khác nhau, mà "chúng giống hệt nhau" mới đúng là vấn đề.
 */
const ORDER_COLOR = idColor(0, 1);

const sfxFile = (e: Ev) => `${e.kind}.wav`;

const VOL: Record<Ev["kind"], number> = {
  click: 0.85,
  emit: 0.6,
  absorb: 0.7,
  arrive: 0.8,
  attach: 0.85,
  fail: 1,
  drop: 0.9,
};

export const IdempotencyKey: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Mạch VÒNG: hỏi đi xuống làn trái, đáp đi lên làn phải. */}
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <Link
            x0={REQ_FROM.x}
            y0={REQ_FROM.y}
            x1={REQ_TO.x}
            y1={SERVER.y}
            live={s.reqLive}
            width={STROKE}
          />
          <Link
            x0={RES_FROM.x}
            y0={SERVER.y}
            x1={RES_TO.x}
            y1={RES_TO.y}
            live={s.resLive}
            width={STROKE}
          />
        </svg>
      </AbsoluteFill>

      <CheckoutUI
        x={UI.x}
        y={UI.y}
        w={UI.w}
        h={UI.h}
        order={ORDER}
        amount={AMOUNT}
        idemKey={s.keyOn > 0.5 ? IDEM_KEY : null}
        button={BUTTON}
        press={s.press}
        spinning={s.spinning}
        spinRot={s.spinRot}
        strokeWidth={STROKE}
      />

      <Node
        x={SERVER.x}
        y={SERVER.y}
        w={SERVER.w}
        h={SERVER.h}
        label={SERVER_LABEL}
        labelSize={LABEL_SIZE}
        strokeWidth={STROKE}
        labelAtTop
        live={s.working || s.looking}
      />

      {/* KHO KEY — chỉ act 2 mới có. Không key thì chẳng có gì để nhớ, và đó
          chính là lý do act 1 hỏng. Rỗng = pill ĐỨT NÉT ("tiềm năng"); ghi rồi
          = pill liền nét. Khớp = loé trắng, và đó là cú kiểm nhìn thấy được. */}
      {s.keyOn > 0.5 && s.panel > 0.01 ? (
        <div
          style={{
            position: "absolute",
            opacity: s.panel,
            left: KEY_STORE.x - STUB_RACK_W / 2,
            top: KEY_STORE.y - 19,
            width: STUB_RACK_W,
            height: 38,
            borderRadius: 999,
            border: `2px ${s.keyStored > 0.5 ? "solid" : "dashed"} ${
              s.keyMatch > 0.02 ? C.data : s.keyStored > 0.5 ? C.lineLive : C.line
            }`,
            backgroundColor: C.bgPanel,
            boxShadow: s.keyMatch > 0.02 ? nodeGlow(C.data, s.keyMatch) : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 17,
            whiteSpace: "nowrap",
            color: s.keyStored > 0.5 ? C.text : C.textFaint,
          }}
        >
          {s.keyStored > 0.5 ? null : STUB_EMPTY}
          {s.keyStored > 0.5 ? (
            <Ticket
              x={STUB_RACK_W / 2}
              y={19}
              w={STUB_W}
              h={30}
              color={C.pass}
              text={KEY_SHORT}
              stub={null}
              glow={s.keyMatch * 0.9}
            />
          ) : null}
        </div>
      ) : null}

      {/* SỐ DƯ — tiêu điểm. Sổ cái chỉ là bằng chứng; đây mới là vết thương. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: BALANCE_AT.y - 60,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: "0.1em",
          color: C.textDim,
          textTransform: "uppercase",
          opacity: s.panel,
        }}
      >
        balance
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: BALANCE_AT.y - 30,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 54,
          color: s.balanceFlash > 0.02 && s.balanceDup ? C.brand : C.text,
          textShadow:
            s.balanceFlash > 0.02
              ? `0 0 24px ${(s.balanceDup ? C.brand : C.data) + "88"}`
              : undefined,
          transform: `scale(${1 + 0.06 * s.balanceFlash})`,
          opacity: s.panel,
        }}
      >
        ${s.balance}.00
      </div>

      {/* Sổ cái: chip NHỎ, là ghi chép chứ không phải tiêu điểm. Chip đầu hợp
          lệ; từ chip thứ HAI trở đi là tiền bị trừ oan → CAM. */}
      {s.charges.map((c) => (
        <DataBlock
          key={`chg-${c.p}`}
          x={ledger(c.p).x}
          y={ledger(c.p).y}
          w={CHARGE.w}
          h={CHARGE.h}
          color={c.dup ? C.brand : ORDER_COLOR}
          text="-$50"
          opacity={c.opacity}
          glow={c.flash * (c.dup ? 1 : 0.6)}
        />
      ))}

      {/* VÉ. Không cuống = không key: chẳng có gì để đối chiếu, nên lần nào
          tới cũng bị tính là mới. Có cuống thì cuống CHÍNH LÀ key. */}
      {s.reqs.map((m) => (
        <Ticket
          key={`req-${m.i}`}
          x={m.x}
          y={m.y}
          w={m.withKey ? MSG.w : MSG.w - STUB_W - 4}
          h={MSG.h}
          color={ORDER_COLOR}
          text="pay $50"
          stub={m.withKey ? { text: KEY_SHORT, kind: m.stubKind } : null}
          stubW={STUB_W}
          torn={m.torn}
          opacity={m.opacity}
        />
      ))}

      {s.resps.map((m) => (
        <DataBlock
          key={`res-${m.i}`}
          x={m.x}
          y={m.y}
          w={MSG.w}
          h={MSG.h}
          color={C.data}
          text="ok · $50"
          opacity={m.opacity}
          glow={0.4}
        />
      ))}

      {s.srvRipple >= 0 ? (
        <Ripple
          x={REQ_TO.x}
          y={SERVER.y}
          t={s.srvRipple}
          color={s.working ? ORDER_COLOR : C.lineLive}
          from={24}
          to={90}
          width={STROKE}
        />
      ) : null}

      {s.cursor ? (
        <Cursor x={s.cursor.x} y={s.cursor.y} press={s.press} opacity={s.cursor.opacity} />
      ) : null}

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
