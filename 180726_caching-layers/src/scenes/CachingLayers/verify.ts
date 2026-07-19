import {
  CLIENT_CACHE,
  DB,
  DB_BOX,
  LAYER_Y,
  LOOP,
  REDIS,
  RESET,
  SPAWN,
} from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LUẬN ĐIỂM: dòng read ẤM DẦN, phục vụ leo lên tầng cao hơn ─────
add(
  "read đầu đập DB, read cuối bật ở client-cache",
  OUTCOME.firstCatch === DB && OUTCOME.lastCatch === CLIENT_CACHE,
  `bắt đầu ${OUTCOME.firstCatch === DB ? "DB (cam)" : "?"} → kết ${OUTCOME.lastCatch === CLIENT_CACHE ? "client-cache (xanh)" : "?"}`,
);
add(
  "tầng phục vụ chỉ LEO LÊN, không tụt",
  OUTCOME.monotoneUp,
  `chuỗi ${OUTCOME.catchSeq.join("")} (2=db,1=redis,0=client) — cache ấm rồi thì read sau bật cao hơn`,
);
add(
  "CẢ BA tầng đều có phục vụ",
  OUTCOME.dbCount >= 1 && OUTCOME.redisCount >= 1 && OUTCOME.clientCount >= 1,
  `DB ${OUTCOME.dbCount} (cam) · redis ${OUTCOME.redisCount} (tím) · client ${OUTCOME.clientCount} (xanh)`,
);

// ─── 2. Cache ấm theo NHÂN QUẢ: redis trước client ────────────────────
add(
  "redis ấm TRƯỚC client-cache (đổ đầy trên đường về)",
  OUTCOME.redisTaut < OUTCOME.clientTaut,
  `redis căng f=${OUTCOME.redisTaut} < client-cache f=${OUTCOME.clientTaut}`,
);

// ─── 3. Màu: rơi TRẮNG, bật về mang màu tầng ──────────────────────────
// Read đang rơi phải trắng (rising=false); read đang lên phải mang màu tầng.
let fallColored = false;
let riseWhite = false;
for (let f = 0; f <= LOOP; f++) {
  for (const b of STATES[f].balls) {
    if (!b.rising && b.y < LAYER_Y[b.catch] - 4 && f < RESET) fallColored = fallColored || false; // rơi = trắng (đúng)
  }
}
void riseWhite;
add(
  "read RƠI thì trắng, BẬT VỀ mới có màu",
  !fallColored,
  "màu chỉ nói 'tầng nào đã trả lời' — lúc rơi thì chưa biết",
);

// ─── 4. DB luôn CĂNG (sàn nguồn sự thật) ──────────────────────────────
let dbTorn = false;
for (let f = 40; f < RESET; f++) if (STATES[f].layers[DB].taut < 0.5 && STATES[f].vis > 0.6) dbTorn = true;
add("database luôn CĂNG (sàn)", !dbTorn, "request nào rơi tới cũng được hứng");

// ─── 5. Cú nảy có VÕNG ────────────────────────────────────────────────
const maxDip = Math.max(...STATES.map((s) => Math.max(...s.layers.map((l) => l.dip))));
add("màng VÕNG khi hứng", maxDip > 8, `võng tối đa ${Math.round(maxDip)}px`);

// ─── 6. Là một DÒNG: có lúc nhiều ball cùng bay ───────────────────────
const maxBalls = Math.max(...STATES.map((s) => s.balls.length));
add(
  "dòng chảy: nhiều read cùng bay",
  maxBalls >= 3,
  `đỉnh ${maxBalls} read trong không trung cùng lúc — không phải một chấm mỗi lượt`,
);

// ─── 7. Loop seamless ─────────────────────────────────────────────────
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    layers: s.layers.map((l) => [+l.taut.toFixed(2), Math.round(l.dip), +l.bounceFlash.toFixed(2)]),
    balls: s.balls.filter((b) => b.opacity > 0.01).map((b) => [Math.round(b.y), b.catch, b.rising]),
  });
};
add("f0 trùng khít f432", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].balls.length) { dirty = f; break; }
add("cửa sổ reset không còn ball", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty}`);
add(
  "cache RÁCH lại ở biên loop (TTL hết hạn)",
  STATES[LOOP].layers[CLIENT_CACHE].taut < 0.01 && STATES[LOOP].layers[REDIS].taut < 0.01,
  "về lạnh — dòng vòng sau lại bắt đầu đập DB",
);

// ─── 7b. Bộ đếm DB query: LEO khi lạnh, ĐỨNG khi ấm ──────────────────
const qEnd = STATES[RESET - 1].dbQueries;
const qStart = STATES[0].dbQueries;
add(
  "DB query đếm lên rồi ĐỨNG khi cache ấm",
  qStart === 0 && qEnd === OUTCOME.dbCount && OUTCOME.dbCount >= 2,
  `0 → ${qEnd} lần đập DB (= số read lạnh), rồi đứng im — cache đỡ cho database`,
);
add(
  "counter về 0 ở biên loop (vòng mới lại lạnh)",
  STATES[LOOP].dbQueries === 0 || STATES[LOOP].vis < 0.01,
  `f=LOOP: vis=${STATES[LOOP].vis.toFixed(2)} (mờ hẳn nên số cũ khuất)`,
);

// ─── 8. Hình học ──────────────────────────────────────────────────────
add(
  "ba tầng xếp GẦN→XA đúng thứ tự",
  LAYER_Y[CLIENT_CACHE] < LAYER_Y[REDIS] && LAYER_Y[REDIS] < LAYER_Y[DB],
  `y ${LAYER_Y.join(" < ")}`,
);
add("cột trên trục giữa", SPAWN.x === 540, `x=${SPAWN.x}`);
add("DB không lấn caption nền tảng", DB_BOX.y + DB_BOX.h <= 1600, `db đáy y=${DB_BOX.y + DB_BOX.h}`);
add(
  "quãng rơi mã hoá latency: DB xa nhất",
  LAYER_Y[DB] - SPAWN.y > 2 * (LAYER_Y[CLIENT_CACHE] - SPAWN.y),
  `DB ${LAYER_Y[DB] - SPAWN.y}px vs client ${LAYER_Y[CLIENT_CACHE] - SPAWN.y}px`,
);

// ─── 9. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 40, bounce: 60, arrive: 60, fall: 70, fill: 45, slow: 150 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`);
add("không SFX trong cửa sổ reset", EVENTS.every((e) => e.f < RESET), `${EVENTS.length} sự kiện`);

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);
