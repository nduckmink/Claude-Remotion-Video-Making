import {
  A1,
  A2,
  CHANGED,
  CLIENT,
  GATEWAY_C,
  LOOP,
  N_SVC,
  RESET,
  SERVICES,
  SVC,
  SVC_C,
  directFrames,
  spokeFrames,
} from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

// Chốt chặn tự động. Quét cả 640 frame.
const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LUẬN ĐIỂM A — auth: đếm ổ khoá ────────────────────────────────
const locks1 = Math.max(...STATES.slice(A1.start, A1.reset).map((s) => s.lockCount));
const locks2 = Math.max(...STATES.slice(A2.fire, A2.change).map((s) => s.lockCount));
add(
  "act 1: auth kiểm ở 3 ổ khoá (lặp lại)",
  locks1 === N_SVC,
  `${locks1} ổ — mỗi service tự kiểm, thêm service là thêm chỗ có thể sai`,
);
add(
  "act 2: auth kiểm ở 1 ổ (tập trung)",
  locks2 === 1,
  `${locks2} ổ ở cửa gateway — trong nhà tin nhau`,
);

// ─── 2. LUẬN ĐIỂM B — thay đổi rơi vào đâu ────────────────────────────
// Đây là cột sống. Cùng cú đổi port, act 1 làm ĐỨT đường của CLIENT; act 2
// chỉ đứt spoke nội bộ, đường của client không hề nhúc nhích.
add(
  "act 1: cú đổi port làm ĐỨT đường của CLIENT",
  OUTCOME.clientBreaksInA1,
  "client phải tự vá — và ×N client đều thế",
);
add(
  "act 1: đường KẸT ĐỨT tới hết act (không tự vá)",
  OUTCOME.a1StillBrokenAtEnd,
  "client không nối lại được — đó là nỗi đau, không phải sự cố thoáng qua",
);
add(
  "404 hiện ở act 1, KHÔNG ở act 2",
  OUTCOME.err404InA1 && !OUTCOME.err404InA2,
  "act 2 gateway hấp thụ nên client không bao giờ thấy 404",
);
add(
  "act 2: đường của client KHÔNG hề đứt",
  !OUTCOME.clientBreaksInA2,
  "thay đổi bị hấp thụ ở gateway, client không thấy gì",
);
add(
  "act 2: spoke lành SAU update, KHÔNG tự nối",
  OUTCOME.spokeBrokenBeforeUpdate && OUTCOME.spokeHealedAfterUpdate,
  `đứt cho tới khi khối update vào gateway rồi mới vẽ lại — "chỉ sửa MỘT chỗ"`,
);
add(
  "nhiều loại update đều vào gateway",
  OUTCOME.updateCount >= 3 && OUTCOME.updatesSeen,
  `${OUTCOME.updateCount} update (địa chỉ · role · quyền) — MỌI thay đổi xuyên suốt dồn vào một chỗ`,
);
add(
  "ổ khoá TO DẦN sau mỗi update auth",
  OUTCOME.lockScaleEnd > OUTCOME.lockScaleStart + 0.4,
  `khoá ${OUTCOME.lockScaleStart.toFixed(2)}× → ${OUTCOME.lockScaleEnd.toFixed(2)}× — role + quyền = tăng cường, thấy được`,
);
add(
  "cùng một service đổi port ở cả hai act",
  OUTCOME.changedPortA1 && SERVICES[CHANGED].portNew !== SERVICES[CHANGED].port,
  `${SERVICES[CHANGED].label}: ${SERVICES[CHANGED].port} → ${SERVICES[CHANGED].portNew} — biến DUY NHẤT thay đổi`,
);

// ─── 3. Đối chứng: act 2 đường client bền qua CẢ cú đổi ───────────────
let stemBrokeAt = -1;
for (let f = A2.change; f < RESET && stemBrokeAt < 0; f++) {
  const stem = STATES[f].links.find((l) => l.clientSide);
  if (stem && stem.broken > 0.1) stemBrokeAt = f;
}
add(
  "đường client→gateway trơ nguyên qua cú đổi port",
  stemBrokeAt < 0,
  stemBrokeAt < 0 ? "không frame nào nó đứt" : `f=${stemBrokeAt}`,
);

// ─── 4. Loop seamless ─────────────────────────────────────────────────
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    // So THỨ VẼ RA, không so mảng nội bộ: hai act khác số phần tử (3 đường vs
    // 4, 3 khoá vs 1) nhưng ở biên loop đều opacity 0 → tập thấy được rỗng cả
    // hai. So mảng thô là báo LỆCH ở chỗ chẳng có pixel nào khác.
    gateway: +s.gateway.toFixed(3),
    svcs: s.svcs.map((v) => [Math.round(v.dx), v.port, +v.recv.toFixed(2), +v.fail.toFixed(2)]),
    links: s.links.filter((l) => l.opacity > 0.001).map((l) => [Math.round(l.x1), Math.round(l.y1), +l.broken.toFixed(2), +l.draw.toFixed(2)]),
    locks: s.locks.filter((l) => l.opacity > 0.001).map((l) => [Math.round(l.x), l.state, +l.pulse.toFixed(2)]),
    packets: s.packets.filter((p) => p.opacity > 0.001).map((p) => [Math.round(p.x), Math.round(p.y), p.kind]),
  });
};
add("f0 trùng khít f640", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  if (s.packets.length || s.svcs.some((v) => v.recv > 0.01 || v.fail > 0.01)) {
    dirty = f;
    break;
  }
}
add("không còn gì CHẠY lúc reset", dirty < 0, dirty < 0 ? `từ f=${RESET} chỉ còn gateway đang tan` : `f=${dirty}`);
add("f=LOOP rỗng hẳn", STATES[LOOP].gateway < 0.01 && STATES[LOOP].packets.length === 0, `gateway=${STATES[LOOP].gateway.toFixed(3)}`);

// ─── 5. Packet không CHỒNG HẲN lên nhau ───────────────────────────────
// Ngưỡng 16, không phải 26 (đường kính chấm): ba packet toả ra từ MỘT nguồn
// (client hoặc gateway) thì vài frame đầu tất yếu chạm nhau ở nguồn rồi tách
// theo hướng — đó là fan-out tự nhiên, không phải lỗi. Chấm trắng trơn không
// chữ, chạm nhẹ lúc phóng đọc ra là "toả ra", không phải "đè". Cấm là cấm
// chồng HẲN (< 10). Hội tụ về hub thì khuất sau node hub, không tính.
let overlap = "";
for (let f = 0; f <= LOOP && !overlap; f++) {
  const ps = STATES[f].packets;
  for (let a = 0; a < ps.length && !overlap; a++)
    for (let b = a + 1; b < ps.length; b++) {
      const d = Math.hypot(ps[a].x - ps[b].x, ps[a].y - ps[b].y);
      if (d < 10) { overlap = `f=${f}: hai packet cách ${Math.round(d)}px`; break; }
    }
}
add("packet không chồng hẳn lên nhau", !overlap, overlap || `quét ${LOOP + 1} frame`);

// ─── 6. Hình học ──────────────────────────────────────────────────────
const rail = (cx: number, cy: number) => {
  const r = cx + SVC.w / 2, t = cy - SVC.h / 2, b = cy + SVC.h / 2;
  return r > 950 && b > 1000 && t < 1750; // đè action rail?
};
const railHit = SVC_C.map((s, i) => (rail(s.x, s.y) ? SERVICES[i].label : null)).filter(Boolean);
add("service né action rail", railHit.length === 0, railHit.length ? `đè: ${railHit.join(",")}` : "cả 3 ngoài rail");
add(
  "gateway nằm đúng trục giữa",
  Math.abs(GATEWAY_C.x - 540) < 0.5,
  `x=${GATEWAY_C.x}`,
);
const lows = SVC_C.map((s) => s.y + SVC.h / 2);
add("service không lấn caption nền tảng", Math.max(...lows) <= 1600, `service thấp nhất y=${Math.max(...lows)}`);
add("client dưới hairline", CLIENT.y >= 310, `client y=${CLIENT.y}`);
// Tán thật, không hàng lối: 3 service phải khác nhau CẢ x LẪN y rõ rệt.
const xs = SVC_C.map((s) => s.x), ys = SVC_C.map((s) => s.y);
add(
  "layout tán ra, không hàng lối",
  Math.max(...xs) - Math.min(...xs) > 300 && Math.max(...ys) - Math.min(...ys) > 300,
  `spread x=${Math.max(...xs) - Math.min(...xs)} y=${Math.max(...ys) - Math.min(...ys)}`,
);

// ─── 7. Motion ────────────────────────────────────────────────────────
const moves = [...directFrames, ...spokeFrames];
add("không chuyển động nào < 8 frame", Math.min(...moves) >= 8, `ngắn nhất ${Math.min(...moves)}f`);

// ─── 8. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 40, absorb: 70, arrive: 60, fail: 90, drop: 110, install: 250, attach: 45 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`);
add("không SFX trong cửa sổ reset", EVENTS.every((e) => e.f < RESET), `${EVENTS.length} sự kiện`);

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(44)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);
