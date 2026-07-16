import { SVC_COLORS } from "../../../lib/tokens";
import {
  BROKER_C,
  BROKER_HOLD,
  BROKER_SUB,
  BROKER_LABEL,
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
  PUB_SUB,
  RESET,
  SEND_STAGGER,
  SPOKE_FRAMES,
  STEM_FRAMES,
  SUB_SIZE,
  SVC,
  SVC_LABEL,
  SVC_LABEL_SIZE,
  attachPt,
  segAt,
  svcAnchor,
  svcX,
  SPOKE,
  SUB_FLY,
} from "./constants";
import { ARRIVALS, EVENTS, ROUNDS, STATES } from "./sim";

// Chốt chặn tự động cho V2. Quét cả 672 frame, không phải liếc vài cái.

const checks: [string, boolean, string][] = [];
const add = (name: string, ok: boolean, note: string) =>
  checks.push([name, ok, note]);

// ─── Lời hứa của scene ────────────────────────────────────────────────
const svc4 = ARRIVALS.filter((a) => a.svc === 3 && a.f <= LOOP);
const before = svc4.filter((a) => a.f < DIAG_OUT);
add(
  "svc 4 không nhận gì khi direct",
  before.length === 0,
  before.length === 0 ? `0 thư trong ${DIAG_OUT} frame đầu` : `NHẬN ${before.length}`,
);
add(
  "svc 4 nhận đủ sau khi đăng ký",
  svc4.length === PUBLISH_BROKER.length,
  `${svc4.length}/${PUBLISH_BROKER.length} round`,
);

// ─── Con số kể chuyện ─────────────────────────────────────────────────
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

// ─── MÀU LÀ ĐỊA CHỈ — luận điểm lõi của V2 ────────────────────────────
// Đừng nhận diện "thư trên stem" bằng x≈540: nan quạt chéo CŨNG xuất phát từ
// x=540 (đỉnh quạt ở publisher), nên thư có địa chỉ ở frame đầu tiên của nó
// bị tính nhầm thành thư trên stem. Đã dính một lần — chốt chặn sai còn tệ
// hơn không có, vì nó báo động vào đúng chỗ không hỏng.
const RIM = BROKER_C.cy - BROKER_C.r; // 785 — vành trên của topic

// Thư trắng CHỈ được tồn tại phía trên vành: qua khỏi topic là phải có màu.
const white = STATES.flatMap((s) => s.msgs).filter((m) => m.svc === null);
const whiteBelow = white.filter((m) => m.y > RIM + 0.5);
add(
  "thư trắng không xuống quá broker",
  white.length > 0 && whiteBelow.length === 0,
  `${white.length} frame-thư trắng, tất cả y ≤ ${RIM} — qua topic mới được dán địa chỉ`,
);

// Trước khi có broker: KHÔNG một thư trắng nào. Publisher biết đích danh từng
// đứa nên thư nào cũng có màu sẵn. Sau khi có broker thì ngược hẳn lại.
const whiteDirect = STATES.slice(0, DIAG_OUT).flatMap((s) =>
  s.msgs.filter((m) => m.svc === null),
);
const addressed = ARRIVALS.filter((a) => a.f < DIAG_OUT).length;
add(
  "act direct: thư nào cũng có địa chỉ sẵn",
  whiteDirect.length === 0 && addressed > 0,
  `0 thư trắng / ${addressed} thư có màu — publisher tự dán địa chỉ`,
);
add(
  "4 màu service phân biệt được",
  new Set(SVC_COLORS).size === N_TOTAL,
  SVC_COLORS.join(" "),
);
// Không màu nào được lấn dải cam-đỏ của accent, nếu không thì cú nháy fail
// hết chỗ đứng riêng — mất nốt thứ duy nhất mà màu còn chỉ được.
const hueOf = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return 0;
  const h =
    mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
};
const hues = SVC_COLORS.map(hueOf);
const clashAccent = hues.filter((h) => h < 40 || h > 340);
add(
  "không màu nào lấn dải accent",
  clashAccent.length === 0,
  `hue ${hues.map((h) => Math.round(h)).join("/")} — accent ở ~13°`,
);

// ─── Không nói dối về NHỊP ────────────────────────────────────────────
const diffs = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]);
const allPeriod = [...diffs(PUBLISH_DIRECT), ...diffs(PUBLISH_BROKER)];
add(
  "nhịp publish y hệt ở cả hai act",
  allPeriod.every((d) => d === PERIOD),
  `${[...new Set(allPeriod)].join(",")} frame`,
);

// ─── Không nói dối về LATENCY ─────────────────────────────────────────
const dOff = (i: number) => i * SEND_STAGGER + DIAG_FRAMES[i];
const bOff = (i: number) =>
  STEM_FRAMES + BROKER_HOLD + i * SEND_STAGGER + SPOKE_FRAMES[i];
const gaps = Array.from({ length: N_INITIAL }, (_, i) => bOff(i) - dOff(i));
add(
  "broker KHÔNG BAO GIỜ nhanh hơn direct",
  gaps.every((g) => g >= 0),
  `chênh ${gaps.join("/")} frame (direct ${Array.from({ length: N_INITIAL }, (_, i) => dOff(i)).join("/")} → broker ${Array.from({ length: N_INITIAL }, (_, i) => bOff(i)).join("/")})`,
);

// ─── Hình học của cú đăng ký ──────────────────────────────────────────
// Chốt phải nằm ĐÚNG trên vành, không "gần gần".
const offs = Array.from({ length: N_TOTAL }, (_, i) => {
  const p = attachPt(i);
  return Math.abs(Math.hypot(p.x - BROKER_C.cx, p.y - BROKER_C.cy) - BROKER_C.r);
});
add(
  "chốt cắm nằm đúng trên vành broker",
  offs.every((o) => o < 0.01),
  `lệch tối đa ${Math.max(...offs).toExponential(1)}px, r=${BROKER_C.r}`,
);
// Bay lên đường nào thì dây phải mọc ra đúng đường đó — hai đoạn phải là một.
const mirror = Array.from({ length: N_TOTAL }, (_, i) => {
  const a = segAt(SUB_FLY[i], 0.37);
  const b = segAt(SPOKE[i], 0.63);
  return Math.hypot(a.x - b.x, a.y - b.y);
});
add(
  "dây mọc đúng đường mà chốt đã bay",
  mirror.every((d) => d < 0.01),
  "SUB_FLY là SPOKE đảo đầu, dùng chung segAt()",
);
add(
  "broker tròn không đè pub cũng không đè service",
  BROKER_C.cy - BROKER_C.r > PUB.y + PUB.h && BROKER_C.cy + BROKER_C.r < SVC.y,
  `pub đáy ${PUB.y + PUB.h} < vành ${BROKER_C.cy - BROKER_C.r}–${BROKER_C.cy + BROKER_C.r} < svc đỉnh ${SVC.y}`,
);

// ─── Loop seamless ────────────────────────────────────────────────────
// So thứ ĐƯỢC VẼ RA, không so biến nội bộ: `draw` của đường đang opacity 0
// cố ý KHÔNG reset (đường phải mờ đi chứ không rút lui).
const norm = (f: number) => {
  const s = STATES[f];
  const drawn = (d: number, on: number) => (on > 0.001 ? d : 0);
  return JSON.stringify({
    msgs: s.msgs.map((m) => [Math.round(m.x), Math.round(m.y), m.svc]),
    flying: s.flying.map((t) => [t.i, Math.round(t.x), Math.round(t.y)]),
    attached: s.attached,
    snap: s.snap.map((v, i) => (s.attached[i] > 0.001 ? v : 0)),
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
    spokeDraw: s.spokeDraw.map((d, i) => drawn(d, s.spokeOn[i])),
    spokeOn: s.spokeOn,
    diagLive: s.diagLive,
    stemLive: s.stemLive,
    spokeLive: s.spokeLive,
    pubLive: s.pubLive,
  });
};
add("f0 trùng khít f672", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── Cửa sổ reset phải sạch ───────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  if (s.msgs.length > 0 || s.flying.length > 0 || s.svcFlash.some((v) => v > 0.001)) {
    dirty = f;
    break;
  }
}
add(
  "không còn gì đang chạy lúc reset",
  dirty < 0,
  dirty < 0 ? `sạch từ f=${RESET}` : `f=${dirty} vẫn còn thư/flash`,
);

// ─── Đường VẼ phải có mặt khi thư BAY trên nó ─────────────────────────
let ghost = -1;
for (let f = 0; f <= LOOP; f++) {
  const s = STATES[f];
  const bad =
    s.diagLive.some((v, i) => v > 0 && i < N_INITIAL && s.diag < 0.02) ||
    s.spokeLive.some((v, i) => v > 0 && (s.spokeOn[i] < 0.02 || s.spokeDraw[i] < 1)) ||
    (s.stemLive > 0 && (s.stemOn < 0.02 || s.stemDraw < 1)) ||
    s.diagLive[3] > 0; // đường thứ tư không tồn tại
  if (bad) {
    ghost = f;
    break;
  }
}
add(
  "không thư nào bay trên đường tàng hình",
  ghost < 0,
  ghost < 0 ? "mọi đường đều vẽ xong trước khi có thư" : `f=${ghost}`,
);

// ─── Luật đèn rọi (phần còn giữ) ──────────────────────────────────────
// V2 đã bỏ luật "một accent" ở tầng màu service, nhưng ACCENT CAM thì vẫn chỉ
// được chiếu một chỗ mỗi frame — đó là thứ duy nhất còn chỉ đường.
let clash = -1;
for (let f = 0; f <= LOOP; f++) {
  const s = STATES[f];
  if (s.brokerAccent > 0.02 && (s.dash > 0.02 || s.svcMiss > 0.02)) {
    clash = f;
    break;
  }
}
add(
  "accent cam không chiếu hai chỗ",
  clash < 0,
  clash < 0 ? "đường đứt tan xong broker mới sáng" : `f=${clash}`,
);

// ─── Âm thanh ─────────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = {
  publish: 40,
  recv: 60,
  miss: 90,
  svcIn: 70,
  subscribe: 55,
  attach: 45,
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

// ─── Motion ───────────────────────────────────────────────────────────
const moves = [
  ...DIAG_FRAMES.slice(0, N_INITIAL),
  STEM_FRAMES,
  ...SPOKE_FRAMES,
];
add(
  "không chuyển động nào < 8 frame",
  Math.min(...moves) >= 8,
  `ngắn nhất ${Math.min(...moves)} frame`,
);

// ─── Hình học khung ───────────────────────────────────────────────────
const rowL = svcX(0);
const rowR = svcX(N_TOTAL - 1) + SVC.w;
add(
  "hàng service né action rail",
  rowL >= 80 && rowR <= 950,
  `x ${rowL}–${rowR}`,
);
add(
  "hàng service đối xứng quanh trục",
  Math.abs((rowL + rowR) / 2 - 540) < 0.5,
  `tâm x=${(rowL + rowR) / 2}`,
);
add(
  "đáy khung để trống cho caption nền tảng",
  SVC.y + SVC.h <= 1600,
  `service đáy y=${SVC.y + SVC.h}`,
);
void svcAnchor;

// Nhãn xuống dòng theo dấu cách ⇒ cái đáng đo là TỪ DÀI NHẤT, không phải cả câu.
const monoW = (s: string, size: number, spacing: number) =>
  s.length * (0.6 + spacing) * size;
const longest = (s: string) =>
  s.split(" ").reduce((a, b) => (a.length >= b.length ? a : b));
const fits: [string, number, number][] = [
  [PUB_LABEL, monoW(PUB_LABEL, LABEL_SIZE, 0.14), PUB.w],
  [PUB_SUB, monoW(PUB_SUB, SUB_SIZE, 0), PUB.w],
  [BROKER_LABEL, monoW(BROKER_LABEL, LABEL_SIZE, 0.14), BROKER_C.r * 2],
  [BROKER_SUB, monoW(BROKER_SUB, SUB_SIZE, 0), BROKER_C.r * 2],
  ...SVC_LABEL.map((s): [string, number, number] => [
    longest(s),
    monoW(longest(s), SVC_LABEL_SIZE, 0.04),
    SVC.w,
  ]),
];
const tight = fits.filter(([, w, box]) => w > box - 36);
add(
  "nhãn lọt trong node (dư ≥18px mỗi bên)",
  tight.length === 0,
  tight.length === 0
    ? fits.map(([s, w, box]) => `${s}:${Math.round(w)}/${box}`).join(" ")
    : tight.map(([s, w, box]) => `"${s}" ${Math.round(w)}px > ${box - 36}`).join(", "),
);

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [name, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(40)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);
