import {
  arc,
  breathe,
  clamp01,
  easeInOutCubic,
  loopPhase,
  pulse,
  ramp,
  spring01,
} from "../../lib/anim";
import {
  A,
  BREATHE,
  CLAIM_DUR,
  CLAIM_FALL,
  CLAIM_REAPPEAR,
  CLAIMS,
  CLIENT_DOCK,
  DELIVER_END,
  EMIT,
  FPS,
  HACK_IN,
  HACK_OUT,
  INTERCEPT,
  LANE_BEND,
  LOOP,
  MINT_END,
  MOUTH,
  OWN_SIG,
  PAYLOAD_GOOD,
  PAYLOAD_TAMPERED,
  SERVER_DOCK,
  SIGN_F,
  SWIRL_TURNS,
  T1,
  T2,
} from "./constants";

/** Mô phỏng từng frame. Component chỉ ĐỌC STATES[f] rồi vẽ. Không import remotion
 *  (chạy Node cho verify). Mọi chuyển động lấy từ lib/anim (spring/arc/breathe). */

export type Verdict = "none" | "pass" | "reject";
export type ClaimS = { x: number; y: number; scale: number; rot: number; opacity: number };
export type TokenS = {
  present: boolean;
  x: number;
  y: number;
  scale: number;
  rot: number;
  seal: number;
  payload: string;
  tamper: number;
  shatter: number;
  verdict: Verdict;
  opacity: number;
};
export type State = {
  claims: ClaimS[];
  funnel: { swirl: number; glow: number };
  mintSeal: { active: number; press: number; opacity: number };
  serverSeal: { active: number };
  token: TokenS;
  /** Kính lúp soi token: scan 0..1 lia qua token; pop = dấu V xanh bung lên khi đạt. */
  verify: { present: boolean; scan: number; verdict: Verdict; pop: number; opacity: number };
  client: { live: number };
  server: { live: number };
  hacker: { opacity: number; live: number; grab: number };
};

export type EvKind = "emit" | "attach" | "fill" | "arrive" | "fail" | "slow" | "drop";
export type Ev = { f: number; kind: EvKind };
const events: Ev[] = [];
CLAIM_FALL.forEach((f) => events.push({ f, kind: "emit" }));
events.push({ f: SIGN_F, kind: "attach" });
events.push({ f: MINT_END, kind: "fill" });
[T1, T2].forEach((t) => {
  events.push({ f: t.up, kind: "emit" });
  events.push({ f: t.pass, kind: "arrive" });
});
events.push({ f: A.up, kind: "emit" });
events.push({ f: A.intercept, kind: "slow" });
events.push({ f: A.tamper, kind: "slow" });
events.push({ f: A.reject, kind: "fail" });
events.push({ f: A.shatter, kind: "drop" });
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < LOOP).sort((a, b) => a.f - b.f);

const seg = (f: number, t0: number, t1: number) => clamp01((f - t0) / (t1 - t0));
// hình chuông 0→1→0 (đỉnh giữa) — cho lean/scale khi bay
const bell = (p: number) => Math.sin(clamp01(p) * Math.PI);

type Pt = { x: number; y: number };
const travel = (from: Pt, to: Pt, bend: number, t0: number, t1: number, f: number) => {
  const p = easeInOutCubic(seg(f, t0, t1));
  const pt = arc(from, to, p, bend);
  const lean = (to.x - from.x > 0 ? 8 : -8) * bell(p); // nghiêng theo hướng bay = sức nặng
  return { x: pt.x, y: pt.y, p, lean };
};

// ─── Token: một object đi suốt vòng đời ────────────────────────────────
const tokenAt = (f: number): TokenS => {
  const base: TokenS = {
    present: true,
    x: EMIT.x,
    y: EMIT.y,
    scale: 1,
    rot: 0,
    seal: 1,
    payload: PAYLOAD_GOOD,
    tamper: 0,
    shatter: 0,
    verdict: "none",
    opacity: 1,
  };
  // Lúc ĐỨNG YÊN token KHÔNG xoay: xoay SVG text chậm làm chữ role/user lấp lánh,
  // đọc ra là "giật". Sức nặng để dành cho lúc BAY (lean), dừng thì đứng thật yên.
  const idleRot = 0;

  // Chưa đúc xong
  if (f < SIGN_F) return { ...base, present: false, opacity: 0 };

  // ĐÚC: thành hình ở cổ phễu, seal (mã vạch) mọc lên
  if (f < MINT_END) {
    const s = spring01((f - SIGN_F) / FPS, { omega: 13, zeta: 0.5 });
    return { ...base, x: EMIT.x, y: EMIT.y, scale: 0.2 + 0.8 * s, seal: clamp01((f - SIGN_F) / (MINT_END - SIGN_F)), rot: idleRot };
  }
  // GIAO về client
  if (f < DELIVER_END) {
    const t = travel(EMIT, CLIENT_DOCK, -120, MINT_END, DELIVER_END, f);
    const settle = 1 + 0.05 * Math.sin((f - DELIVER_END) * 0.6) * 0; // (settle xử lý khi dừng)
    return { ...base, x: t.x, y: t.y, rot: t.lean, scale: settle };
  }

  // ── Một vòng hợp lệ: up → verify(hold) → back ──
  const validTrip = (t: typeof T1): TokenS | null => {
    if (f < t.up) return null;
    if (f < t.verify) {
      const tr = travel(CLIENT_DOCK, SERVER_DOCK, LANE_BEND, t.up, t.verify, f);
      return { ...base, x: tr.x, y: tr.y, rot: tr.lean };
    }
    if (f < t.back) {
      const verdict: Verdict = f >= t.pass ? "pass" : "none";
      return { ...base, x: SERVER_DOCK.x, y: SERVER_DOCK.y, rot: idleRot, verdict };
    }
    if (f < t.end) {
      const tr = travel(SERVER_DOCK, CLIENT_DOCK, LANE_BEND, t.back, t.end, f);
      return { ...base, x: tr.x, y: tr.y, rot: tr.lean, verdict: "pass" };
    }
    return { ...base, x: CLIENT_DOCK.x, y: CLIENT_DOCK.y, rot: idleRot }; // đậu lại client
  };

  if (f < A.up) {
    // trong khoảng các vòng hợp lệ (hoặc hold ở client giữa chúng)
    if (f < T1.end || (f >= T2.up && f < T2.end)) {
      const r = f < T1.end ? validTrip(T1) : validTrip(T2);
      if (r) return r;
    }
    return { ...base, x: CLIENT_DOCK.x, y: CLIENT_DOCK.y, rot: idleRot }; // hold ở client
  }

  // ── TẤN CÔNG ──
  if (f < A.intercept) {
    const tr = travel(CLIENT_DOCK, INTERCEPT, LANE_BEND * 0.7, A.up, A.intercept, f);
    return { ...base, x: tr.x, y: tr.y, rot: tr.lean };
  }
  if (f < A.resume) {
    // hacker GIẰNG token: rung mạnh hơn khi đang bẻ payload. Rung này giờ SẠCH
    // (jitter chữ trước kia là do transformBox trong Token, đã bỏ) — đọc ra
    // "đang bị cạy sửa", không phải lỗi render.
    const shake = f >= A.tamper ? breathe(f, 4, 3.5) : breathe(f, 6, 1.2);
    const tampered = f >= A.tamper;
    return {
      ...base,
      x: INTERCEPT.x + shake,
      y: INTERCEPT.y,
      rot: shake * 0.6,
      payload: tampered ? PAYLOAD_TAMPERED : PAYLOAD_GOOD,
      tamper: tampered ? clamp01((f - A.tamper) / 10) : 0,
    };
  }
  if (f < A.atServer) {
    const tr = travel(INTERCEPT, SERVER_DOCK, -60, A.resume, A.atServer, f);
    return { ...base, x: tr.x, y: tr.y, rot: tr.lean, payload: PAYLOAD_TAMPERED, tamper: 1 };
  }
  if (f < A.shatterEnd) {
    const verdict: Verdict = f >= A.reject ? "reject" : "none";
    const sh = f >= A.shatter ? clamp01((f - A.shatter) / (A.shatterEnd - A.shatter)) : 0;
    return {
      ...base,
      x: SERVER_DOCK.x,
      y: SERVER_DOCK.y,
      rot: idleRot + sh * 14,
      payload: PAYLOAD_TAMPERED,
      tamper: 1,
      verdict,
      shatter: sh,
      opacity: 1 - sh,
    };
  }
  return { ...base, present: false, opacity: 0 };
};

// ─── Claims rơi vào phễu ───────────────────────────────────────────────
const claimAt = (i: number, f: number): ClaimS => {
  const c = CLAIMS[i];
  const t0 = CLAIM_FALL[i];
  const t1 = t0 + CLAIM_DUR;
  const base: ClaimS = { x: c.spawn.x, y: c.spawn.y, scale: 1, rot: 0, opacity: 1 };

  // Vòng mới: hiện lại ở spawn (fade-in). Dùng CHUNG breathe với nhánh "chờ" bên
  // dưới, và breathe có chu kỳ chia hết LOOP → f=LOOP trùng khít f=0.
  if (f >= CLAIM_REAPPEAR) {
    const a = ramp(f, CLAIM_REAPPEAR, LOOP - CLAIM_REAPPEAR);
    return { ...base, rot: breathe(f, BREATHE, 3, i), scale: 0.9 + 0.1 * a, opacity: a };
  }
  // Trước khi rơi: chờ ở spawn
  if (f < t0) return { ...base, rot: breathe(f, BREATHE, 3, i) };
  // Đang rơi: spring vào miệng rồi chui cổ, co nhỏ + xoay
  if (f < t1) {
    const s = easeInOutCubic(seg(f, t0, t1));
    const x = c.spawn.x + (MOUTH.x - c.spawn.x) * s;
    const y = c.spawn.y + (MOUTH.y - c.spawn.y) * s;
    return { x, y, scale: 1 - 0.5 * s, rot: (i % 2 ? 1 : -1) * 40 * s, opacity: 1 };
  }
  // Đã bị nuốt: chui vào cổ, biến mất
  const s2 = clamp01((f - t1) / 16);
  return { x: MOUTH.x, y: MOUTH.y + s2 * 140, scale: 0.5 * (1 - s2), rot: 0, opacity: 1 - s2 };
};

// ─── Verify = KÍNH LÚP soi token ───────────────────────────────────────
// Kính lúp lia qua token (scan 0→1). Tới nơi: đúng → dấu V xanh BUNG lên (pop);
// sai → không có V, token vỡ (tokenAt lo phần vỡ). Trực quan hơn kiểu so "=".
const verifyAt = (f: number) => {
  const windows: { v0: number; passF: number; v1: number; verdict: Verdict }[] = [
    { v0: T1.verify, passF: T1.pass, v1: T1.back, verdict: "pass" },
    { v0: T2.verify, passF: T2.pass, v1: T2.back, verdict: "pass" },
    { v0: A.atServer, passF: A.reject, v1: A.shatter, verdict: "reject" },
  ];
  for (const w of windows) {
    if (f >= w.v0 - 6 && f < w.v1 + 6) {
      const scan = clamp01((f - w.v0) / Math.max(1, w.passF - w.v0)); // lia qua token
      const verdict: Verdict = f >= w.passF ? w.verdict : "none";
      const pop = w.verdict === "pass" && f >= w.passF ? clamp01(spring01((f - w.passF) / FPS, { omega: 15, zeta: 0.45 })) : 0;
      const opacity = f < w.v0 ? ramp(f, w.v0 - 6, 6) : f >= w.v1 ? 1 - ramp(f, w.v1, 6) : 1;
      return { present: true, scan, verdict, pop, opacity: clamp01(opacity) };
    }
  }
  return { present: false, scan: 0, verdict: "none" as Verdict, pop: 0, opacity: 0 };
};

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    const token = tokenAt(f);
    const claims = [0, 1, 2].map((i) => claimAt(i, f));
    const verify = verifyAt(f);

    // Phễu: xoáy quay đều SWIRL_TURNS vòng/loop (seamless), sáng khi đang nuốt claim
    const swallowing = f >= CLAIM_FALL[0] && f < MINT_END;
    const funnelGlow = swallowing ? 0.4 + 0.6 * pulse(f, 24) : 0.12 * (0.5 + 0.5 * breathe(f, BREATHE, 1));
    const funnel = { swirl: loopPhase(f, LOOP, SWIRL_TURNS) * 360, glow: clamp01(funnelGlow) };

    // Con dấu đúc: đập xuống lúc SIGN_F, sáng suốt lúc ký
    const mintActive = f >= SIGN_F && f < MINT_END ? 1 : 0;
    const mintPress = f >= SIGN_F ? 18 * (1 - spring01((f - SIGN_F) / FPS, { omega: 18, zeta: 0.5 })) : 0;
    const mintOpacity = f >= SIGN_F - 18 && f < MINT_END + 14 ? clamp01(ramp(f, SIGN_F - 18, 12) - ramp(f, MINT_END, 14)) : 0;
    const mintSeal = { active: mintActive, press: f >= SIGN_F && f < MINT_END ? mintPress : 0, opacity: mintOpacity };

    // Secret ở server: sáng khi kính lúp đang soi
    const serverSeal = { active: verify.present && verify.scan > 0.1 ? clamp01(verify.scan) : 0 };

    // Devices
    const tokenAtClient = token.present && Math.abs(token.x - CLIENT_DOCK.x) < 40 && token.y < 1120;
    const tokenAtServer = token.present && Math.abs(token.x - SERVER_DOCK.x) < 40 && token.y < 1120;
    const client = { live: tokenAtClient ? 0.4 + 0.6 * pulse(f, BREATHE) : 0.12 };
    const server = { live: tokenAtServer || verify.present ? 0.4 + 0.6 * clamp01(verify.scan) : 0.12 };

    // Hacker
    const hackOpacity = clamp01(ramp(f, HACK_IN, 30) - ramp(f, HACK_OUT, LOOP - HACK_OUT));
    const grab = f >= A.intercept && f < A.resume ? spring01((f - A.intercept) / FPS, { omega: 16, zeta: 0.7 }) : 0;
    const hackLive = hackOpacity * (0.3 + 0.4 * pulse(f, 18) + 0.5 * grab);
    const hacker = { opacity: hackOpacity, live: clamp01(hackLive), grab: clamp01(grab) };

    out.push({ claims, funnel, mintSeal, serverSeal, token, verify, client, server, hacker });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
export const OUTCOME = {
  ownSig: OWN_SIG,
  goodPayload: PAYLOAD_GOOD,
  tamperedPayload: PAYLOAD_TAMPERED,
  // token bẩn (đã sửa) có bao giờ được verdict pass không? PHẢI = false.
  tamperedEverPassed: STATES.some((s) => s.token.payload === PAYLOAD_TAMPERED && s.token.verdict === "pass"),
  // token sạch có được pass ở hai vòng đầu không?
  cleanPassed: STATES.some((s) => s.token.payload === PAYLOAD_GOOD && s.token.verdict === "pass"),
  rejectHappened: STATES.some((s) => s.token.verdict === "reject"),
};
