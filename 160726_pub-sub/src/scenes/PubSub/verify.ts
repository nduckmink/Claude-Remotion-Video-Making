import {
  BROKER,
  BROKER_HOLD,
  DIAG_FRAMES,
  DIAG_OUT,
  LABEL_SIZE,
  LOOP,
  N_INITIAL,
  N_TOTAL,
  PERIOD,
  PUB,
  PUBLISH_BROKER,
  PUBLISH_DIRECT,
  PUB_LABEL,
  RESET,
  SEND_STAGGER,
  STEM_FRAMES,
  SVC,
  SVC_LABEL,
  BROKER_LABEL,
  VERT_FRAMES,
  svcX,
} from "./constants";
import { ARRIVALS, EVENTS, ROUNDS, STATES } from "./sim";

// Chốt chặn tự động. Kiểm những thứ MẮT KHÔNG THẤY ĐƯỢC — quét cả 672 frame,
// không phải liếc vài cái. Chạy TRƯỚC render, chạy lại mỗi lần đổi hằng số.

const checks: [string, boolean, string][] = [];
const add = (name: string, ok: boolean, note: string) =>
  checks.push([name, ok, note]);

// ─── 1. Lời hứa của scene ─────────────────────────────────────────────
const svc4 = ARRIVALS.filter((a) => a.svc === 3 && a.f <= LOOP);
const svc4Before = svc4.filter((a) => a.f < DIAG_OUT);
add(
  "svc 4 không nhận gì khi direct",
  svc4Before.length === 0,
  svc4Before.length === 0
    ? `0 packet trong ${DIAG_OUT} frame đầu`
    : `NHẬN ${svc4Before.length} — vỡ câu chuyện`,
);
add(
  "svc 4 nhận đủ sau khi có broker",
  svc4.length === PUBLISH_BROKER.length,
  `${svc4.length}/${PUBLISH_BROKER.length} round`,
);

// ─── 2. Con số kể chuyện: publisher GỬI mấy lần ───────────────────────
const direct = ROUNDS.filter((r) => r.mode === "direct");
const broker = ROUNDS.filter((r) => r.mode === "broker");
add(
  "direct: publisher gửi N lần",
  direct.every((r) => r.sends === N_INITIAL),
  `${N_INITIAL} lần/round × ${direct.length} round`,
);
add(
  "pub/sub: publisher gửi 1 lần",
  broker.every((r) => r.sends === 1),
  `1 lần/round × ${broker.length} round`,
);
add(
  "có 4 service mà vẫn chỉ 3 lần gửi",
  direct.filter((r) => r.at >= 100).every((r) => r.sends === 3),
  "publisher không biết svc 4 tồn tại",
);

// ─── 3. Không nói dối về NHỊP ─────────────────────────────────────────
const diffs = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]);
const allPeriod = [...diffs(PUBLISH_DIRECT), ...diffs(PUBLISH_BROKER)];
add(
  "nhịp publish y hệt ở cả hai act",
  allPeriod.every((d) => d === PERIOD),
  `${[...new Set(allPeriod)].join(",")} frame — broker KHÔNG làm publish dày hơn`,
);

// ─── 4. Không nói dối về LATENCY ──────────────────────────────────────
// Thêm một hop thì phải chậm hơn. Hình học layout có thể lật ngược điều đó
// mà không ai để ý — đó là lý do có dòng này.
const dOff = (i: number) => i * SEND_STAGGER + DIAG_FRAMES[i];
const bOff = (i: number) =>
  STEM_FRAMES + BROKER_HOLD + i * SEND_STAGGER + VERT_FRAMES[i];
const gaps = Array.from({ length: N_INITIAL }, (_, i) => bOff(i) - dOff(i));
add(
  "broker KHÔNG BAO GIỜ nhanh hơn direct",
  gaps.every((g) => g >= 0),
  `chênh ${gaps.join("/")} frame (direct ${Array.from({ length: N_INITIAL }, (_, i) => dOff(i)).join("/")} → broker ${Array.from({ length: N_INITIAL }, (_, i) => bOff(i)).join("/")})`,
);

// ─── 5. Loop seamless ─────────────────────────────────────────────────
// So f=0 với f=LOOP, KHÔNG phải LOOP-1.
//
// So thứ ĐƯỢC VẼ RA, không so biến nội bộ: id packet khác nhau không đẻ ra
// pixel nào khác, và `draw` của một đường đang opacity 0 cũng vậy — nó cố ý
// KHÔNG bị reset (đường phải mờ đi chứ không rút lui). So thô là báo động giả.
const norm = (f: number) => {
  const s = STATES[f];
  const drawn = (draw: number, on: number) => (on > 0.001 ? draw : 0);
  return JSON.stringify({
    items: s.items.map((it) => [Math.round(it.x), Math.round(it.y)]),
    svcFlash: s.svcFlash,
    svcMiss: s.svcMiss,
    svc4In: s.svc4In,
    diag: s.diag,
    dash: s.dash,
    broker: s.broker,
    brokerAccent: s.brokerAccent,
    brokerLive: s.brokerLive,
    brokerRipple: s.brokerRipple,
    stemDraw: drawn(s.stemDraw, s.stemOn),
    stemOn: s.stemOn,
    vertDraw: s.vertDraw.map((d, i) => drawn(d, s.vertOn[i])),
    vertOn: s.vertOn,
    diagLive: s.diagLive,
    stemLive: s.stemLive,
    vertLive: s.vertLive,
    pubLive: s.pubLive,
  });
};
add("f0 trùng khít f672", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 6. Cửa sổ reset phải sạch ────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  if (STATES[f].items.length > 0 || STATES[f].svcFlash.some((v) => v > 0.001)) {
    dirty = f;
    break;
  }
}
add(
  "không còn gì đang chạy lúc reset",
  dirty < 0,
  dirty < 0 ? `sạch từ f=${RESET}` : `f=${dirty} vẫn còn packet/flash`,
);

// ─── 7. Đường VẼ phải có mặt khi packet BAY trên nó ───────────────────
// Cho packet chạy trên một đường đang tàng hình là nói dối kiểu tinh vi nhất:
// toạ độ đúng hết, mà sơ đồ thì không có đường đó.
let ghost = -1;
for (let f = 0; f <= LOOP; f++) {
  const s = STATES[f];
  const bad =
    s.diagLive.some((v, i) => v > 0 && i < N_INITIAL && s.diag < 0.02) ||
    // Kiểm cả HIỆN DIỆN lẫn VẼ XONG: đường mới vẽ được nửa mà packet đã chạy
    // trên đoạn chưa có thì cũng là bay trên hư không.
    s.vertLive.some((v, i) => v > 0 && (s.vertOn[i] < 0.02 || s.vertDraw[i] < 1)) ||
    (s.stemLive > 0 && (s.stemOn < 0.02 || s.stemDraw < 1)) ||
    s.diagLive[3] > 0; // đường thứ tư không tồn tại, không gì được bay trên nó
  if (bad) {
    ghost = f;
    break;
  }
}
add(
  "không packet nào bay trên đường tàng hình",
  ghost < 0,
  ghost < 0 ? "mọi đường đều hiện khi có packet" : `f=${ghost}`,
);

// ─── 8. Luật đèn rọi: mỗi frame accent chỉ đánh dấu MỘT việc ──────────
let clash = -1;
for (let f = 0; f <= LOOP; f++) {
  const s = STATES[f];
  const on = [s.dash > 0.02, s.svcMiss > 0.02, s.brokerAccent > 0.02];
  // dash + miss là CÙNG một chủ đề (svc 4 đang bị bỏ rơi) → không tính là hai.
  if (s.brokerAccent > 0.02 && (s.dash > 0.02 || s.svcMiss > 0.02)) {
    clash = f;
    break;
  }
  void on;
}
add(
  "accent không bao giờ chiếu hai chỗ",
  clash < 0,
  clash < 0 ? "đường đứt tan xong broker mới sáng" : `f=${clash} có hai vệt accent`,
);

// ─── 9. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = {
  publish: 40,
  recv: 60,
  miss: 90,
  svcIn: 70,
  wire: 35,
  brokerIn: 250,
  brokerHit: 70,
};
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add(
  "biên loop im tuyệt đối",
  soundEnd < LOOP - 2,
  `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`,
);
add(
  "không SFX trong cửa sổ reset",
  EVENTS.every((e) => e.f < RESET),
  `${EVENTS.length} sự kiện, cái cuối f=${Math.max(...EVENTS.map((e) => e.f))}`,
);

// ─── 10. Motion ───────────────────────────────────────────────────────
const moves = [...DIAG_FRAMES.slice(0, N_INITIAL), STEM_FRAMES, ...VERT_FRAMES];
add(
  "không chuyển động nào < 8 frame",
  Math.min(...moves) >= 8,
  `ngắn nhất ${Math.min(...moves)} frame`,
);

// ─── 11. Hình học ─────────────────────────────────────────────────────
const rowL = svcX(0);
const rowR = svcX(N_TOTAL - 1) + SVC.w;
add(
  "hàng service né action rail",
  rowL >= 80 && rowR <= 950,
  `x ${rowL}–${rowR} (rail bắt đầu x=950 ở dải y 1000–1750)`,
);
add(
  "hàng service đối xứng quanh trục",
  Math.abs((rowL + rowR) / 2 - 540) < 0.5,
  `tâm x=${(rowL + rowR) / 2}`,
);
add(
  "broker không đè pub cũng không đè service",
  BROKER.y > PUB.y + PUB.h && BROKER.y + BROKER.h < SVC.y,
  `pub đáy ${PUB.y + PUB.h} < broker ${BROKER.y}–${BROKER.y + BROKER.h} < svc đỉnh ${SVC.y}`,
);
add(
  "đáy khung để trống cho caption nền tảng",
  SVC.y + SVC.h <= 1600,
  `service đáy y=${SVC.y + SVC.h}`,
);

// Nhãn: mono advance 0.6em. Đổi nhãn là phải ĐO LẠI CHỖ, không chỉ gõ chữ mới.
const monoW = (s: string, size: number) => s.length * (0.6 + 0.14) * size;
const fits: [string, number, number][] = [
  [PUB_LABEL, monoW(PUB_LABEL, LABEL_SIZE), PUB.w],
  [BROKER_LABEL, monoW(BROKER_LABEL, LABEL_SIZE), BROKER.w],
  ...Array.from({ length: N_TOTAL }, (_, i): [string, number, number] => [
    SVC_LABEL(i),
    monoW(SVC_LABEL(i), LABEL_SIZE),
    SVC.w,
  ]),
];
const tight = fits.filter(([, w, box]) => w > box - 40);
add(
  "nhãn lọt trong node (dư ≥20px mỗi bên)",
  tight.length === 0,
  tight.length === 0
    ? fits.map(([s, w, box]) => `${s}:${Math.round(w)}/${box}`).join(" ")
    : tight.map(([s, w, box]) => `${s} ${Math.round(w)}px > ${box - 40}`).join(", "),
);

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [name, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(40)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);
