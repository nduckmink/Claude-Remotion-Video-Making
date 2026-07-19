import {
  A1,
  A2,
  AXIS,
  ERR_RISE,
  SVC,
  UPDATES,
  UPDATE_ABSORB,
  UPDATE_FLY,
  UPDATE_FROM,
  LOCK_GROW,
  BLINK,
  BREAK_IN,
  CHANGED,
  CLIENT_C,
  DRAW_DUR,
  FAIL_FLASH,
  FANOUT_STAGGER,
  GATEWAY_C,
  GATEWAY,
  GW_IN,
  GW_IN_DUR,
  INTRO,
  LOCK_CHECK,
  LOOP,
  N_SVC,
  PORT_FLIP,
  RECV_FLASH,
  RESET,
  RESET_DUR,
  RIPPLE_DUR,
  SERVICES,
  SHAKE_AMP,
  SHAKE_DUR,
  SVC_C,
  WORK,
  at,
  directFrames,
  lockDirect,
  lockStem,
  spokeFrames,
  stemFrames,
  type Pt,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * Không import lib/motion.ts — nó kéo Easing của remotion vào, mà verify chạy Node.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export type EvKind = "emit" | "absorb" | "arrive" | "fail" | "drop" | "install" | "attach";
export type Ev = { f: number; kind: EvKind; i?: number };

export type Packet = { x: number; y: number; kind: "req" | "res"; color: string; opacity: number };
export type LinkState = {
  x0: number; y0: number; x1: number; y1: number;
  live: number; broken: number; draw: number; opacity: number;
  /** true nếu đây là đường PHÍA CLIENT (client là một đầu). Verify dùng. */
  clientSide: boolean;
};
export type LockState = { x: number; y: number; state: number; pulse: number; opacity: number; scale: number };
export type SvcState = { i: number; dx: number; port: string; portFlash: number; recv: number; fail: number; live: number };

export type State = {
  gateway: number; // 0→1 độ hiện
  gatewayLive: number;
  svcs: SvcState[];
  links: LinkState[];
  locks: LockState[];
  packets: Packet[];
  errors: { x: number; y: number; opacity: number }[];
  updates: { x: number; y: number; label: string; opacity: number }[];
  gwUpdateFlash: number;
  clientLive: number;
  /** chỉ verify: có đường PHÍA CLIENT nào đang đứt ở frame này không */
  clientLinkBroken: boolean;
  lockCount: number;
};

// ─── Flight: một packet bay trên một đoạn, từ frame start ──────────────
type Flight = {
  from: Pt; to: Pt; s: number; d: number;
  kind: "req" | "res"; svc: number; dies: boolean;
  act: 1 | 2;
};
const flights: Flight[] = [];
const events: Ev[] = [];

const REQ_COL = "#E8EBF0";
const svcColor = (_i: number) => "#E8EBF0"; // packet luôn trắng — màu để cho node

/** Một chu kỳ request TRỰC TIẾP (act 1): client → mỗi service → về. */
const fireDirect = (tf: number, failIdx: number | null) => {
  for (let i = 0; i < N_SVC; i++) {
    const s0 = tf + i * FANOUT_STAGGER;
    const d = directFrames[i];
    const dies = failIdx === i;
    flights.push({ from: CLIENT_C, to: SVC_C[i], s: s0, d, kind: "req", svc: i, dies, act: 1 });
    events.push({ f: s0, kind: "emit", i });
    events.push({ f: s0 + d, kind: dies ? "fail" : "absorb", i });
    if (!dies) {
      flights.push({ from: SVC_C[i], to: CLIENT_C, s: s0 + d + WORK, d, kind: "res", svc: i, dies: false, act: 1 });
      events.push({ f: s0 + d + WORK + d, kind: "arrive", i });
    }
  }
};

/** Một chu kỳ qua GATEWAY (act 2): client → gw → mỗi service → gw → về. */
const fireGateway = (tf: number) => {
  flights.push({ from: CLIENT_C, to: GATEWAY_C, s: tf, d: stemFrames, kind: "req", svc: -1, dies: false, act: 2 });
  events.push({ f: tf, kind: "emit", i: -1 });
  const hit = tf + stemFrames;
  events.push({ f: hit, kind: "attach" }); // ổ khoá DUY NHẤT kiểm ở đây
  let backMax = hit;
  for (let i = 0; i < N_SVC; i++) {
    const s0 = hit + WORK + i * FANOUT_STAGGER;
    const d = spokeFrames[i];
    flights.push({ from: GATEWAY_C, to: SVC_C[i], s: s0, d, kind: "req", svc: i, dies: false, act: 2 });
    events.push({ f: s0 + d, kind: "absorb", i });
    flights.push({ from: SVC_C[i], to: GATEWAY_C, s: s0 + d + WORK, d, kind: "res", svc: i, dies: false, act: 2 });
    backMax = Math.max(backMax, s0 + d + WORK + d);
  }
  flights.push({ from: GATEWAY_C, to: CLIENT_C, s: backMax, d: stemFrames, kind: "res", svc: -1, dies: false, act: 2 });
  events.push({ f: backMax + stemFrames, kind: "arrive", i: -1 });
};

fireDirect(A1.fire, null);
fireDirect(A1.refire, CHANGED); // sau khi đứt: B rớt
fireGateway(A2.fire); // act 2 chỉ MỘT fire — cú thay đổi tự chứng minh

events.push({ f: A1.change, kind: "drop", i: CHANGED });
events.push({ f: A1.change + 4, kind: "fail" }); // 404
events.push({ f: A1.refire + directFrames[CHANGED], kind: "fail" }); // 404 lần nữa
events.push({ f: GW_IN, kind: "install" });
events.push({ f: A2.change, kind: "drop", i: CHANGED });
UPDATES.forEach((u, i) => {
  const absorbAt = A2.updateStart + i * A2.updateGap + UPDATE_FLY;
  events.push({ f: absorbAt, kind: u.heals ? "attach" : "absorb", i: CHANGED });
});
events.sort((a, b) => a.f - b.f);
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    const inA1 = f < A1.reset;
    const resetT = ramp(f, RESET, RESET_DUR);

    // Gateway: hiện ở act 2, tan trong cửa sổ reset.
    const gateway = inA1 ? 0 : ramp(f, GW_IN, GW_IN_DUR) * (1 - resetT);

    // Envelope hiển thị của TỪNG act. Hai act có số phần tử khác nhau (3 đường
    // vs 4, 3 khoá vs 1), nên hai đầu loop phải cùng về RỖNG: act 1 vẽ vào lúc
    // mở màn (f=0 → opacity 0), act 2 tan trong cửa sổ reset (f=640 → 0). Ở
    // biên, cả hai chỉ còn client + service tĩnh — khớp nhau.
    const a1v = inA1 ? ramp(f, A1.start, INTRO) * (1 - ramp(f, A1.reset - INTRO, INTRO)) : 0;

    // ── Services ──
    const svcs: SvcState[] = SERVICES.map((def, i) => {
      const changeAt = inA1 ? A1.change : A2.change;
      const isChanged = i === CHANGED;
      const shakeP = isChanged ? ramp(f, changeAt, SHAKE_DUR) : 1;
      const dx =
        isChanged && f >= changeAt && f < changeAt + SHAKE_DUR
          ? SHAKE_AMP * Math.sin(shakeP * Math.PI * 4) * (1 - shakeP)
          : 0;
      // Port đổi số ngay sau cú rung, giữ tới hết act. Gate về :8080 trước biên
      // act (A1.reset) và biên loop (RESET) — nếu không thì f=640 hiện :9090
      // còn f=0 hiện :8080, vỡ seam. Đây là "kịch bản mới", port trở lại gốc.
      const flipAt = changeAt + 4;
      const actEnd = inA1 ? A1.reset : RESET;
      const showNew = isChanged && f >= flipAt && f < actEnd;
      return {
        i,
        dx,
        port: showNew ? def.portNew : def.port,
        portFlash: isChanged ? clamp01(1 - (f - flipAt) / PORT_FLIP) : 0,
        recv: 0,
        fail: 0,
        live: 0,
      };
    });

    // ── Packets từ flights ──
    const packets: Packet[] = [];
    for (const fl of flights) {
      if (fl.act !== (inA1 ? 1 : 2)) continue;
      if (f < fl.s || f >= fl.s + fl.d) continue;
      const p = at(fl.from, fl.to, easeInOut((f - fl.s) / fl.d));
      packets.push({ x: p.x, y: p.y, kind: fl.kind, color: fl.kind === "res" ? svcColor(fl.svc) : REQ_COL, opacity: 1 });
      if (fl.svc >= 0) svcs[fl.svc].live = 1;
    }
    // recv / fail flash: quét flights vừa cập bến quanh frame này
    for (const fl of flights) {
      if (fl.act !== (inA1 ? 1 : 2) || fl.kind !== "req" || fl.svc < 0) continue;
      const arr = fl.s + fl.d;
      if (fl.dies) {
        if (f >= arr && f < arr + FAIL_FLASH) svcs[fl.svc].fail = 1 - (f - arr) / FAIL_FLASH;
      } else {
        if (f >= arr && f < arr + RECV_FLASH) svcs[fl.svc].recv = 1 - (f - arr) / RECV_FLASH;
      }
    }

    // ── Links ──
    const links: LinkState[] = [];
    const brokeWindow = (breakAt: number, healAt: number) =>
      ramp(f, breakAt, BREAK_IN) * (1 - ramp(f, healAt, 6));
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((2 * Math.PI * f) / BLINK));

    if (inA1) {
      // 3 đường TRỰC TIẾP client→service. Đường tới CHANGED đứt từ A1.change và
      // GIỮ NGUYÊN ĐỨT tới hết act — client KẸT, không tự nối lại được.
      for (let i = 0; i < N_SVC; i++) {
        const isCh = i === CHANGED;
        const brk = isCh ? ramp(f, A1.change, BREAK_IN) * blink : 0;
        const draw = 1;
        links.push({
          x0: CLIENT_C.x, y0: CLIENT_C.y, x1: SVC_C[i].x, y1: SVC_C[i].y,
          live: svcs[i].live, broken: brk, draw,
          opacity: a1v, clientSide: true,
        });
      }
    } else {
      // 1 đường client→gateway (KHÔNG bao giờ đứt) + 3 spoke gateway→service.
      // Spoke tới CHANGED đứt từ A2.change, lành khi khối UPDATE đầu (đổi địa
      // chỉ) được gateway nuốt — KHÔNG tự nối. Client stem không bao giờ đứt.
      const healAt = A2.updateStart + UPDATE_FLY;
      links.push({
        x0: CLIENT_C.x, y0: CLIENT_C.y, x1: GATEWAY_C.x, y1: GATEWAY_C.y,
        live: packets.some((p) => Math.abs(p.x - AXIS) < 90 && p.y < GATEWAY_C.y) ? 1 : 0,
        broken: 0, draw: gateway, opacity: gateway, clientSide: true,
      });
      for (let i = 0; i < N_SVC; i++) {
        const isCh = i === CHANGED;
        const brk = isCh ? brokeWindow(A2.change, healAt) * blink : 0;
        const draw = isCh && f >= A2.change && f < healAt ? 0 : isCh && f >= healAt ? ramp(f, healAt, DRAW_DUR) : gateway;
        links.push({
          x0: GATEWAY_C.x, y0: GATEWAY_C.y, x1: SVC_C[i].x, y1: SVC_C[i].y,
          live: svcs[i].live, broken: brk, draw,
          opacity: gateway, clientSide: false,
        });
      }
    }

    // ── Locks: AUTH. Act 1 = 3 ổ (lặp lại); act 2 = 1 ổ ở cửa gateway. ──
    const locks: LockState[] = [];
    const lockCheck = (checkAt: number) => (f >= checkAt && f < checkAt + LOCK_CHECK ? 1 : 0);
    if (inA1) {
      for (let i = 0; i < N_SVC; i++) {
        const p = lockDirect(i);
        const isCh = i === CHANGED;
        const down = isCh ? ramp(f, A1.change, BREAK_IN) : 0;
        // Kết nối đứt thì chưa tới được ổ khoá → ổ tối đi (không phải chặn: down).
        const passT = A1.fire + i * FANOUT_STAGGER + Math.round(directFrames[i] * 0.52);
        const rpassT = A1.refire + i * FANOUT_STAGGER + Math.round(directFrames[i] * 0.52);
        locks.push({
          x: p.x, y: p.y,
          state: down > 0.5 ? -1 : 2,
          pulse: Math.max(lockCheck(passT), isCh ? 0 : lockCheck(rpassT)),
          opacity: a1v * (1 - down * 0.7),
          scale: 1,
        });
      }
    } else {
      const passT = A2.fire + stemFrames;
      // Ổ khoá TO DẦN mỗi lần một update AUTH (role, quyền) chạm gateway —
      // cảm giác "được tăng cường". Update địa chỉ KHÔNG tính: nó là routing,
      // không phải auth. Đây là mặt ĐỘNG của auth, bù cho mặt tĩnh (đếm khoá).
      let authAbsorbed = 0;
      let growPop = 0;
      UPDATES.forEach((u, i) => {
        if (!u.strengthens) return;
        const absorbAt = A2.updateStart + i * A2.updateGap + UPDATE_FLY;
        if (f >= absorbAt) authAbsorbed++;
        if (f >= absorbAt && f < absorbAt + 10) growPop = Math.max(growPop, 1 - (f - absorbAt) / 10);
      });
      locks.push({
        x: lockStem.x, y: lockStem.y, state: 2,
        pulse: Math.max(lockCheck(passT), growPop),
        opacity: gateway,
        scale: 1 + LOCK_GROW * authAbsorbed,
      });
    }

    const clientLinkBroken = links.some((l) => l.clientSide && l.broken > 0.4);

    // ── 404 bay lên tan dần — CHỈ act 1. Act 2 client không bao giờ thấy. ──
    const errors: { x: number; y: number; opacity: number }[] = [];
    if (inA1) {
      for (const errAt of [A1.change + 4, A1.refire + directFrames[CHANGED]]) {
        const t = ramp(f, errAt, ERR_RISE);
        if (t > 0.001 && t < 1) {
          errors.push({
            x: SVC_C[CHANGED].x,
            y: SVC_C[CHANGED].y - SVC.h / 2 - 22 - 48 * t, // trồi lên từ trên service
            opacity: 1 - t * t, // mờ dần, nhanh về cuối
          });
        }
      }
    }

    // ── Khối UPDATE bay vào gateway — CHỈ act 2. "Chỉ sửa MỘT chỗ." ──
    const updates: { x: number; y: number; label: string; opacity: number }[] = [];
    let gwUpdateFlash = 0;
    if (!inA1) {
      UPDATES.forEach((u, i) => {
        const s0 = A2.updateStart + i * A2.updateGap;
        const arr = s0 + UPDATE_FLY;
        if (f >= s0 && f < arr) {
          // Bay tới MÉP TRÁI gateway (không phải tâm), rồi tan hẳn khi chạm —
          // chui vào chứ không đậu che nhãn GATEWAY.
          const target = { x: GATEWAY.x + 6, y: GATEWAY_C.y };
          const t = (f - s0) / UPDATE_FLY;
          const q = at(UPDATE_FROM, target, easeInOut(t));
          updates.push({ x: q.x, y: q.y, label: u.label, opacity: 1 - clamp01((t - 0.6) / 0.4) });
        }
        if (f >= arr && f < arr + UPDATE_ABSORB) gwUpdateFlash = Math.max(gwUpdateFlash, 1 - (f - arr) / UPDATE_ABSORB);
      });
    }

    out.push({
      gateway,
      gatewayLive: packets.some((p) => Math.abs(p.y - GATEWAY_C.y) < 40 && !inA1) ? 1 : 0,
      svcs,
      links,
      locks,
      packets,
      errors,
      updates,
      gwUpdateFlash,
      clientLive: packets.some((p) => p.y < CLIENT_C.y + 120) ? 1 : 0,
      clientLinkBroken,
      lockCount: locks.filter((l) => l.opacity > 0.4).length,
    });
  }

  return out;
};

export const STATES = simulate();

/** Kết cục — verify canh. */
const spokeBroken = (f: number) => {
  const spoke = STATES[f].links.filter((l) => !l.clientSide);
  return spoke.some((l) => l.broken > 0.4);
};
export const OUTCOME = {
  act1Locks: N_SVC,
  act2Locks: 1,
  clientBreaksInA1: STATES.slice(A1.change, A1.reset).some((s) => s.clientLinkBroken),
  clientBreaksInA2: STATES.slice(A2.start, RESET).some((s) => s.clientLinkBroken),
  changedPortA1: SERVICES[CHANGED].portNew !== SERVICES[CHANGED].port,
  // Act 1: đường tới CHANGED KẸT ĐỨT tới sát reset (client không tự vá được).
  a1StillBrokenAtEnd: STATES[A1.reset - 30].links.some((l) => l.clientSide && l.broken > 0.4),
  // Act 2: spoke chỉ lành SAU khi update đầu được nuốt, KHÔNG trước. Đo theo
  // KHOẢNG, không một frame: đường đứt nhấp nháy nên một frame lẻ có thể rơi
  // đúng lúc blink chạm đáy (<0.4) và bị đọc nhầm là "không đứt".
  spokeBrokenBeforeUpdate: (() => {
    for (let f = A2.change + BREAK_IN; f < A2.updateStart + UPDATE_FLY; f++) if (spokeBroken(f)) return true;
    return false;
  })(),
  spokeHealedAfterUpdate: (() => {
    for (let f = A2.updateStart + UPDATE_FLY + DRAW_DUR + 2; f < RESET; f++) if (spokeBroken(f)) return false;
    return true;
  })(),
  // 404 chỉ ở act 1.
  err404InA1: STATES.slice(A1.change, A1.reset).some((s) => s.errors.length > 0),
  err404InA2: STATES.slice(A2.start, RESET).some((s) => s.errors.length > 0),
  updateCount: UPDATES.length,
  updatesSeen: Math.max(...STATES.map((s) => s.updates.length)) > 0,
  // Ổ khoá stem to dần: cuối act 2 phải lớn hơn lúc đầu (mỗi update auth +1 bậc).
  lockScaleStart: STATES[A2.fire].locks[0]?.scale ?? 1,
  lockScaleEnd: STATES[A2.updateStart + 2 * A2.updateGap + UPDATE_FLY + 8].locks[0]?.scale ?? 1,
};

void RIPPLE_DUR;
export type { Pt };
