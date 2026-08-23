import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { SqlCard } from "../../components/SqlCard";
import { Table } from "../../components/Table";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import { BLOBS, CUSTOMERS, HEAD_H, LOOP, ORDERS, RESULT, ROW_H, SQL, SQL_LINES, TITLE } from "./constants";
import { EVENTS, GROUPS, STATES, ordRowY, resRowY, tableH, type Ev } from "./sim";

const CUST_COLOR = idColor(0, 4);
const ORD_COLOR = idColor(2, 4);
const SQL_COLOR = idColor(1, 4);
const GROUP_COLORS = [idColor(0, 3), idColor(1, 3), idColor(2, 3)];
const VOL: Record<Ev["kind"], number> = { emit: 0.45, attach: 0.7, arrive: 0.6, fill: 0.6, fail: 0.9, drop: 0.7, slow: 0.7, travel: 0.3 };

/** Cột `id` của customers và cột `customer_id` của orders — chỗ khoá nối nhau. */
const custIdX = CUSTOMERS.x - CUSTOMERS.w / 2 + CUSTOMERS.cols[0].w / 2;
const ordFkX = ORDERS.x - ORDERS.w / 2 + ORDERS.cols[0].w + ORDERS.cols[1].w / 2;
const custBot = CUSTOMERS.y + tableH(CUSTOMERS.rows.length) / 2;
const ordTop = ORDERS.y - tableH(ORDERS.rows.length) / 2;

export const Sql: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* KHOÁ nối hai bảng: customer_id trỏ về id */}
      {s.link.on > 0.01 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: s.link.on }}>
          <path
            d={`M ${custIdX} ${custBot} C ${custIdX} ${custBot + 52}, ${ordFkX} ${ordTop - 52}, ${ordFkX} ${ordTop}`}
            fill="none"
            stroke={s.link.pulse > 0.1 ? C.pass : C.lineLive}
            strokeWidth={s.link.pulse > 0.1 ? 3.4 : 2}
            strokeDasharray="7 6"
            style={{ filter: s.link.pulse > 0.1 ? `drop-shadow(${nodeGlow(C.pass, s.link.pulse)})` : undefined }}
          />
          <circle cx={ordFkX} cy={ordTop} r={5} fill={s.link.pulse > 0.1 ? C.pass : C.lineLive} />
        </svg>
      )}

      {/* Bảng customers */}
      {s.cust.on > 0.01 && (
        <Table
          x={CUSTOMERS.x}
          y={CUSTOMERS.y}
          w={CUSTOMERS.w}
          name={CUSTOMERS.name}
          cols={CUSTOMERS.cols}
          rows={CUSTOMERS.rows}
          rowH={ROW_H}
          headH={HEAD_H}
          states={s.cust.rows}
          accent={CUST_COLOR}
          on={s.cust.on}
        />
      )}

      {/* Bảng orders */}
      {s.ord.on > 0.01 && (
        <Table
          x={ORDERS.x}
          y={ORDERS.y}
          w={ORDERS.w}
          name={ORDERS.name}
          cols={ORDERS.cols}
          rows={ORDERS.rows}
          rowH={ROW_H}
          headH={HEAD_H}
          states={s.ord.rows}
          groupColors={GROUP_COLORS}
          accent={ORD_COLOR}
          on={s.ord.on}
          grow={s.ord.on}
        />
      )}

      {/* Bản ghi thô rơi vào — cái sai kiểu bị hắt ra */}
      {s.blobs.map((b) => (
        <div
          key={b.i}
          style={{
            position: "absolute",
            left: b.x - 118,
            top: b.y - 21,
            width: 236,
            height: 42,
            transform: `scale(${b.scale})`,
            transformOrigin: "center",
            opacity: b.opacity,
            borderRadius: 21,
            background: C.bgPanel,
            border: `2px solid ${b.reject > 0.1 ? C.brand : C.lineLive}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: b.reject > 0.1 ? nodeGlow(C.brand, b.reject) : "none",
          }}
        >
          {b.reject > 0.1 && (
            <svg width={15} height={15} viewBox="-8 -8 16 16" style={{ flex: "none" }}>
              <line x1={-5} y1={-5} x2={5} y2={5} stroke={C.brand} strokeWidth={2.6} strokeLinecap="round" />
              <line x1={5} y1={-5} x2={-5} y2={5} stroke={C.brand} strokeWidth={2.6} strokeLinecap="round" />
            </svg>
          )}
          {BLOBS[b.i].cells.map((c, k) => (
            <span key={k} style={{ fontFamily: F.mono, fontSize: 16, color: b.reject > 0.1 ? C.brand : C.text, whiteSpace: "nowrap" }}>
              {c}
            </span>
          ))}
        </div>
      ))}

      {/* Câu SQL */}
      {s.sql.on > 0.01 && <SqlCard x={SQL.x} y={SQL.y} w={SQL.w} lines={SQL_LINES} active={s.sql.active} accent={SQL_COLOR} on={s.sql.on} />}

      {/* Vệt: mỗi nhóm dòng gom lại thành ĐÚNG MỘT dòng kết quả */}
      {s.phase >= 3 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {GROUPS.map((g, gi) =>
            g.rows.map((ri) => (
              <line
                key={`${gi}-${ri}`}
                x1={ORDERS.x + ORDERS.w / 2 - 10}
                y1={ordRowY(ri)}
                x2={RESULT.x + RESULT.w / 2 - 10}
                y2={resRowY(gi)}
                stroke={GROUP_COLORS[gi]}
                strokeWidth={1.6}
                opacity={0.4 * s.result.rows[gi].on}
              />
            )),
          )}
        </svg>
      )}

      {/* KẾT QUẢ — cũng là một bảng */}
      {s.result.on > 0.01 && (
        <Table
          x={RESULT.x}
          y={RESULT.y}
          w={RESULT.w}
          name={RESULT.name}
          cols={RESULT.cols}
          rows={GROUPS.map((g) => [g.name, String(g.sum)])}
          rowH={ROW_H}
          headH={HEAD_H}
          states={s.result.rows.map((r, i) => ({ on: r.on, dim: 0, group: i, flash: 0 }))}
          groupColors={GROUP_COLORS}
          accent={C.pass}
          on={s.result.on}
          grow={s.result.rows[0].grow}
        />
      )}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        tables in · table out · say what, not how
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
