/**
 * Chốt chặn tự động. Chạy TRƯỚC khi render, và mỗi lần đổi một hằng số.
 *
 *   npx esbuild src/scenes/WebSocket/verify.ts --bundle --platform=node \
 *     --outfile=.v.cjs --log-level=error && node .v.cjs
 *
 * Nguyên tắc: soi đúng thứ LÊN MÀN HÌNH. Verify xanh mà màn hình sai thì
 * verify đang cho cảm giác an toàn giả.
 */
import { SFX } from "../../../scripts/sfx-table.mjs";
import { breathe, clamp, spring01 } from "../../lib/anim";
import { C, ID_L, fitChroma, idHue, oklchToRgb } from "../../lib/tokens";
import {
  ACT,
  BREATHE,
  BURST,
  CLIENT_BOTTOM,
  CLIENT_Y,
  FPS,
  LANE,
  LOOP,
  MSGS,
  NODE_H,
  NODE_W,
  RAILS,
  READOUT_HTTP,
  READOUT_WS,
  RESET_FROM,
  SERVER_TOP,
  SERVER_Y,
  STAGE_TOP,
  type Dir,
} from "./constants";
import { EVENTS, STATES } from "./sim";

let bad = 0;
const ok = (cond: boolean, msg: string, detail = "") => {
  if (cond) {
    console.log(`  ok   ${msg}`);
  } else {
    console.log(`  FAIL ${msg}${detail ? ` -- ${detail}` : ""}`);
    bad++;
  }
};
const head = (s: string) => console.log(`\n${s}`);

// -- Cái gì THỰC SỰ hiện ra --------------------------------------------
const packetVisible = (age: number) =>
  clamp(spring01(age / FPS, { omega: 20, zeta: 0.5 })) > 0.002;

/** Làm tròn VÀ giết -0: sin(16π) ra -1e-15, khác chuỗi mà giống hệt pixel. */
const q = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d + 0;

/** Chỉ serialize thứ lên khung hình: toạ độ làm tròn, lọc theo ngưỡng nhìn thấy. */
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    p: s.packets
      .filter((p) => packetVisible(p.age))
      .map((p) => `${p.kind}/${p.dir}/${Math.round(p.x)}/${Math.round(p.y)}`)
      .sort(),
    r: s.rails
      .filter((r) => r.draw > 0.002 && r.alpha > 0.002)
      .map((r) => `${r.dir}/${q(r.draw, 3)}/${q(r.alpha, 3)}/${q(r.lock, 3)}`)
      .sort(),
    w: s.ripples
      .filter((r) => (1 - r.t) * 0.75 > 0.004)
      .map((r) => `${Math.round(r.x)}/${Math.round(r.y)}/${q(r.t, 3)}/${r.tone}`)
      .sort(),
    h: [q(s.clientHeat), q(s.serverHeat)],
    o: q(s.readout),
    s: s.sweep < 0 ? "-" : q(s.sweep),
    b: q(breathe(f, BREATHE), 5),
  });
};

const bothLanes = (f: number) => STATES[f].laneBusy.down && STATES[f].laneBusy.up;

// -- 1 - Loop ----------------------------------------------------------
head("LOOP");
ok(LOOP % 16 === 0, `LOOP=${LOOP} là bội của 16 (nhát cắt AAC rơi đúng mẫu)`);
ok(LOOP % BREATHE === 0, `BREATHE=${BREATHE} chia hết LOOP (${LOOP / BREATHE} chu kỳ)`);
ok(
  norm(0) === norm(LOOP),
  "seamless: frame 0 khớp frame LOOP",
  `\n   f0=${norm(0)}\n   fL=${norm(LOOP)}`,
);
ok(norm(0) !== norm(LOOP - 1), "frame LOOP-1 PHẢI khác frame 0 (đúng một bước chuyển động)");

// -- 2 - Cửa sổ reset --------------------------------------------------
head("CUA SO RESET");
{
  let moving = 0;
  for (let f = RESET_FROM; f < LOOP; f++) {
    const s = STATES[f];
    if (s.packets.some((p) => packetVisible(p.age))) moving++;
    if (s.rails.some((r) => r.draw > 0.002 && r.alpha > 0.002)) moving++;
    if (s.ripples.some((r) => (1 - r.t) * 0.75 > 0.004)) moving++;
  }
  ok(moving === 0, `[${RESET_FROM},${LOOP}) không còn gì ĐANG CHẠY`, `${moving} vi phạm`);
  const late = EVENTS.filter((e) => e.f >= RESET_FROM);
  ok(late.length === 0, "không sự kiện tiếng nào rơi vào cửa sổ reset", `${late.length} tiếng`);
}

// -- 3 - Lời hứa của scene ---------------------------------------------
head("LOI HUA -- HTTP thi ghep cap, WS thi khong");
{
  let httpBoth = 0;
  for (let f = ACT.http[0]; f < ACT.http[1]; f++) if (bothLanes(f)) httpBoth++;
  ok(httpBoth === 0, "nhịp HTTP: KHÔNG frame nào hai làn cùng chạy", `${httpBoth} frame`);

  let hsBoth = 0;
  for (let f = ACT.upgrade[0]; f < ACT.upgrade[1]; f++) if (bothLanes(f)) hsBoth++;
  ok(hsBoth === 0, "nhịp bắt tay: vẫn ghép cặp, chưa full-duplex", `${hsBoth} frame`);

  let openBoth = 0;
  for (let f = ACT.open[0]; f < ACT.open[1]; f++) if (bothLanes(f)) openBoth++;
  ok(openBoth >= 25, `nhịp OPEN: hai làn cùng chạy ${openBoth} frame (full-duplex nhìn thấy được)`);
}

// -- 4 - Cú BURST, cái aha ---------------------------------------------
head("BURST -- server noi truoc");
{
  let downFrames = 0;
  for (let f = BURST[0]; f < BURST[1]; f++) if (STATES[f].laneBusy.down) downFrames++;
  ok(
    downFrames === 0,
    `[${BURST[0]},${BURST[1]}): làn XUỐNG trống trơn`,
    `${downFrames} frame có gói`,
  );

  const ups = MSGS.filter((m) => m.dir === "up" && m.t >= BURST[0] && m.t < BURST[1]);
  ok(ups.length === 3, `làn LÊN mang ${ups.length} gói trong cùng cửa sổ`);
  ok(BURST[1] - BURST[0] >= 45, `cửa sổ dài ${BURST[1] - BURST[0]} frame, đủ để đọc ra`);
}

// -- 5 - Số lần dựng dây -----------------------------------------------
head("DUNG DAY");
{
  const http = RAILS.filter((r) => r.birth < ACT.upgrade[0]);
  const kept = RAILS.filter((r) => r.lock !== undefined);
  ok(http.length === 4, `nhịp HTTP dựng ${http.length} lần dây (và chết cả 4)`);
  ok(
    http.every((r) => r.deathAt + r.deathF <= ACT.http[1]),
    "mọi dây HTTP chết trước khi nhịp 1 kết thúc",
  );
  ok(kept.length === 2, `socket dựng ${kept.length} làn, dựng MỘT lần`);
  const rebuilt = RAILS.filter((r) => r.birth >= ACT.open[0]);
  ok(rebuilt.length === 0, "nhịp OPEN: không dựng lại lần nào", `${rebuilt.length} lần`);
}

// -- 6 - Hình học: đường VẼ trùng khít đường BAY ------------------------
head("HINH HOC");
{
  let offLane = 0;
  let outOfBand = 0;
  for (let f = 0; f <= LOOP; f++) {
    for (const p of STATES[f].packets) {
      if (p.x !== LANE[p.dir as Dir].x) offLane++;
      if (p.y < CLIENT_BOTTOM - 0.001 || p.y > SERVER_TOP + 0.001) outOfBand++;
    }
  }
  ok(offLane === 0, "mọi gói bay ĐÚNG trên x của làn nó chạy", `${offLane} lệch`);
  ok(outOfBand === 0, `mọi gói nằm trong [${CLIENT_BOTTOM},${SERVER_TOP}]`, `${outOfBand} tràn`);

  ok(CLIENT_Y >= STAGE_TOP, `client bắt đầu ở y=${CLIENT_Y}, dưới stage top ${STAGE_TOP}`);
  ok(SERVER_Y + NODE_H <= 1600, `đáy server y=${SERVER_Y + NODE_H}, chừa y>1600 cho nền tảng`);

  // Pill đi trên làn này không được đụng làn kia.
  const pillW = (t: string) => t.length * 14.4 + 36;
  const half = Math.max(pillW("UPGRADE"), pillW("CLOSE")) / 2;
  const gap = Math.abs(LANE.up.x - LANE.down.x) - half - pillW("101") / 2;
  ok(gap > 0, `pill làn này cách pill làn kia ${gap.toFixed(1)}px`);

  // Nhãn: đo TỪ dài nhất, không phải cả câu.
  const longest = Math.max(...[READOUT_HTTP, READOUT_WS, "CLIENT", "SERVER"].map((s) => s.length));
  ok(longest * 14.4 + 40 < NODE_W, `nhãn dài nhất (${longest} ký tự) lọt trong node ${NODE_W}px`);
}

// -- 7 - Âm thanh ------------------------------------------------------
head("AM THANH");
{
  const msOf = (name: string) => {
    const base = name.split("-")[0] as keyof typeof SFX;
    return SFX[base].ms as number;
  };
  const endF = (e: (typeof EVENTS)[number]) => e.f + (msOf(e.sfx) / 1000) * FPS;
  const last = EVENTS.reduce((a, e) => Math.max(a, endF(e)), 0);
  ok(last < LOOP - 2, `tiếng cuối tắt ở frame ${last.toFixed(1)} < ${LOOP - 2}`);
  ok(
    EVENTS.every((e) => e.f >= 0 && e.f < LOOP),
    "mọi sự kiện tiếng nằm trong loop",
  );
  const dup = EVENTS.filter((e, i) => i > 0 && EVENTS[i - 1].f === e.f);
  ok(dup.length === 0, "không hai tiếng nào chồng đúng một frame", `${dup.length} chồng`);
  console.log(`  info ${EVENTS.length} tiếng / ${(LOOP / FPS).toFixed(2)}s`);
}

// -- 8 - Màu: danh tính không được đội lốt TRẠNG THÁI --------------------
head("MAU");
{
  const CH = ["R", "G", "B"];
  const dom = (rgb: number[]) => rgb.indexOf(Math.max(...rgb));
  const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  // pass viết bằng oklch, brand viết bằng hex — đọc mỗi cái theo đúng dạng của nó.
  const passDom = dom(oklchToRgb(0.76, 0.17, 150));
  const brandDom = dom(hexRgb(C.brand));

  for (let i = 0; i < 2; i++) {
    const h = idHue(i, 2);
    const d = dom(oklchToRgb(ID_L, fitChroma(h), h));
    ok(
      d !== passDom && d !== brandDom,
      `idColor(${i},2) hue ${h.toFixed(1)}: kênh trội ${CH[d]}, khác pass(${CH[passDom]}) và brand(${CH[brandDom]})`,
      "một phần tử đang khoác đúng màu trạng thái",
    );
  }
}

// -- 9 - Readout -------------------------------------------------------
head("READOUT");
ok(STATES[0].readout === 0 && STATES[LOOP].readout === 0, "readout về đúng bậc HTTP ở hai biên");
const firstOpen = MSGS.find((m) => m.t >= ACT.open[0]);
ok(
  STATES[firstOpen!.t].readout === 1,
  `readout lật xong TRƯỚC gói đầu tiên của socket (f=${firstOpen!.t})`,
);

console.log(bad === 0 ? "\nOK: tat ca chot chan xanh\n" : `\nFAIL: ${bad} chot chan DO\n`);
process.exit(bad === 0 ? 0 : 1);
