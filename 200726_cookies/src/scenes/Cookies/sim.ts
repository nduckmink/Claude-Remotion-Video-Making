import { arc, clamp01, easeInOutCubic, pulse, ramp } from "../../lib/anim";
import {
  BREATHE,
  B_ANCHOR,
  COOKIE_HOME,
  LANE_BEND,
  LOOP,
  REQ_BACK,
  REQ_LOOK,
  REQ_OUT,
  REQ_STARTS,
  RESET,
  SERVER,
  STORE_CELL,
  S_ANCHOR,
  T,
} from "./constants";

/** Mô phỏng từng frame. Component chỉ đọc STATES[f]. Không import remotion. */

export type Packet = { x: number; y: number; rot: number; hasCookie: boolean; rejected: number; opacity: number };
export type State = {
  cells: number[]; // 8 ngăn tủ
  wipe: number; // 0..1 tiến trình XOÁ (áo vỡ vụn)
  wipeFlash: number; // 0..1 loé đỏ + rung khi xoá
  lookup: number; // server tra tủ
  cookie: { present: boolean; x: number; y: number; dead: number; opacity: number };
  packet: Packet | null;
  ghost: number; // JWT đối chiếu (mờ)
  loading: number; // browser đợi server trả về
  browser: { live: number };
  server: { live: number };
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow";
export type Ev = { f: number; kind: EvKind };
const events: Ev[] = [
  { f: T.loginOut, kind: "emit" },
  { f: T.sessionMake, kind: "fill" }, // cất áo vào tủ
  { f: T.setCookie, kind: "attach" }, // phát cookie
  ...REQ_STARTS.map((s) => ({ f: s, kind: "emit" as EvKind })),
  ...REQ_STARTS.map((s) => ({ f: s + REQ_OUT + REQ_LOOK, kind: "arrive" as EvKind })),
  { f: T.wipe, kind: "drop" }, // xoá tủ
  { f: T.reject, kind: "fail" }, // 401
];
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const NCELL = 8;
type Pt = { x: number; y: number };
const travel = (from: Pt, to: Pt, t0: number, t1: number, f: number, bend = LANE_BEND) => {
  const p = easeInOutCubic(clamp01((f - t0) / (t1 - t0)));
  const pt = arc(from, to, p, bend);
  return { x: pt.x, y: pt.y, rot: (to.x - from.x > 0 ? 5 : -5) * Math.sin(p * Math.PI) };
};

const packetAt = (f: number): Packet | null => {
  const mk = (t: { x: number; y: number; rot: number }, hasCookie: boolean, rejected = 0): Packet => ({ ...t, hasCookie, rejected, opacity: 1 });

  // Đăng nhập (mang mật khẩu, chưa có cookie)
  if (f >= T.loginOut && f < T.loginAt) return mk(travel(B_ANCHOR, S_ANCHOR, T.loginOut, T.loginAt, f), false);

  // 3 request đã đăng nhập — round trip, TỰ kèm cookie
  for (const s of REQ_STARTS) {
    const o1 = s + REQ_OUT;
    const l1 = o1 + REQ_LOOK;
    const b1 = l1 + REQ_BACK;
    if (f >= s && f < o1) return mk(travel(B_ANCHOR, S_ANCHOR, s, o1, f), true);
    if (f >= o1 && f < l1) return mk({ x: S_ANCHOR.x, y: S_ANCHOR.y, rot: 0 }, true);
    if (f >= l1 && f < b1) return mk(travel(S_ANCHOR, B_ANCHOR, l1, b1, f), true);
  }

  // Request sau khi xoá tủ — cùng cookie, nhưng bị từ chối
  if (f >= T.badOut && f < T.badAt) return mk(travel(B_ANCHOR, S_ANCHOR, T.badOut, T.badAt, f), true);
  if (f >= T.badAt && f < T.badBack) return mk({ x: S_ANCHOR.x, y: S_ANCHOR.y, rot: 0 }, true, clamp01(ramp(f, T.reject, 8)));
  if (f >= T.badBack && f < T.badEnd) return mk(travel(S_ANCHOR, B_ANCHOR, T.badBack, T.badEnd, f), true, 1);

  return null;
};

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    // Tủ: ngăn giữ phiên sáng sau login; khi XOÁ thì "áo" vỡ dần trong 22 frame
    const wipe = clamp01((f - T.wipe) / 22);
    const wipeFlash = f >= T.wipe ? clamp01(1.15 - (f - T.wipe) / 16) : 0;
    const active = clamp01(ramp(f, T.sessionMake, 20) * (1 - wipe));
    const cells = Array.from({ length: NCELL }, (_, i) => (i === STORE_CELL ? active : 0));

    // Tra tủ: pulse ở mỗi request (good + bad). Bad thì tủ trống nên tra hụt.
    let lookup = 0;
    for (const s of REQ_STARTS) {
      const o1 = s + REQ_OUT;
      const l1 = o1 + REQ_LOOK;
      if (f >= o1 - 2 && f < l1) lookup = Math.max(lookup, Math.sin(clamp01((f - (o1 - 2)) / (l1 - o1 + 2)) * Math.PI));
    }
    if (f >= T.badAt - 2 && f < T.badBack) lookup = Math.max(lookup, Math.sin(clamp01((f - (T.badAt - 2)) / (T.badBack - T.badAt + 2)) * Math.PI));

    // Cookie: bay server→hũ, nằm yên, chết khi tủ xoá, rồi bị bỏ
    const cPresent = f >= T.setCookie && f < T.discardEnd;
    let cookie = { present: false, x: 0, y: 0, dead: 0, opacity: 0 };
    if (cPresent) {
      const from = { x: 786, y: 520 };
      const pos = f < T.cookieHome ? travel(from, COOKIE_HOME, T.setCookie, T.cookieHome, f, 40) : { x: COOKIE_HOME.x, y: COOKIE_HOME.y, rot: 0 };
      cookie = {
        present: true,
        x: pos.x,
        y: pos.y,
        dead: clamp01(ramp(f, T.cookieDead, 12)),
        opacity: clamp01(ramp(f, T.setCookie, 8) - ramp(f, T.discard, T.discardEnd - T.discard)),
      };
    }

    const packet = packetAt(f);
    const ghost = clamp01(ramp(f, T.ghost, 18) - ramp(f, T.ghostEnd - 18, 18));

    // Loading: browser đợi từ lúc gửi tới lúc nhận về
    let loading = 0;
    if (f >= T.loginOut && f < T.cookieHome) loading = 1;
    for (const s of REQ_STARTS) if (f >= s && f < s + REQ_OUT + REQ_LOOK + REQ_BACK) loading = 1;
    if (f >= T.badOut && f < T.badEnd) loading = 1;

    const browser = { live: clamp01(0.14 + 0.5 * (packet && packet.x < 540 ? 1 : 0) * (0.6 + 0.4 * pulse(f, BREATHE))) };
    const server = { live: clamp01(0.14 + 0.6 * Math.max(lookup, active > 0.5 && f > T.sessionMake && f < T.wipe ? 0.25 : 0)) };

    out.push({ cells, wipe, wipeFlash, lookup: clamp01(lookup), cookie, packet, ghost, loading, browser, server });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
const anyReqFrame = (s: number) => STATES[s + Math.floor(REQ_OUT / 2)];
export const OUTCOME = {
  // Mọi request lúc đã đăng nhập đều TỰ kèm cookie.
  everyReqHasCookie: REQ_STARTS.every((s) => anyReqFrame(s).packet?.hasCookie === true),
  // Phiên nằm ở TỦ server (ngăn sáng sau login), KHÔNG ở cookie.
  sessionInStore: STATES[T.sessionMake + 30].cells[STORE_CELL] > 0.8,
  // Mỗi request: server tra tủ (pulse).
  lookupEachReq: REQ_STARTS.every((s) => STATES[s + REQ_OUT + Math.floor(REQ_LOOK / 2)].lookup > 0.5),
  // Sau khi xoá tủ: ngăn trống, request cùng cookie NHƯNG bị từ chối.
  storeEmptyAtBad: STATES[T.badAt].cells[STORE_CELL] < 0.05,
  badRejectedWithCookie: (() => {
    const p = STATES[T.badBack + 10].packet;
    return !!p && p.hasCookie && p.rejected > 0.5;
  })(),
  cookieDeadAfterWipe: STATES[T.reject + 6].cookie.dead > 0.5,
};
void SERVER;
