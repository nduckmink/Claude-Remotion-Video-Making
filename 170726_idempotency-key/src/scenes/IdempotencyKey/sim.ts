import {
  A1_RESET,
  A2_START,
  ACT2_AT,
  AMOUNT,
  BUTTON_C,
  CHARGE_FLASH,
  CLICK_AT,
  CLICK_FLASH,
  CURSOR_IN,
  DIE_AT,
  HOVER,
  IDEM_KEY,
  KEY_IN,
  KEY_IN_DUR,
  LANE_FRAMES,
  LOOKUP,
  LOOP,
  MATCH_FLASH,
  BALANCE_START,
  PRICE,
  N_CLICKS,
  QUEUE_PITCH,
  TEAR,
  TEAR_HOLD,
  REQ_FROM,
  REQ_TO,
  RESET,
  RESET_DUR,
  RES_FROM,
  RES_TO,
  RIPPLE_DUR,
  SPEED,
  WORK,
  at,
  ledger,
  type Pt,
} from "./constants";

/**
 * Mô phỏng thật, từng frame — kể cả HÀNG ĐỢI của server.
 *
 * Toán tay nói dối ở đúng chỗ này: act 1 ba request dồn tới trong 16 frame,
 * mà server làm việc mất 22 frame một cái. Chúng PHẢI xếp hàng. Gõ tay mấy
 * mốc "charge ở frame 202, 224, 246" là đoán; cho hàng đợi chạy thì nó tự ra,
 * và nếu đổi WORK thì mọi thứ tự dịch theo.
 *
 * Chính cái nghẽn ấy là tương phản nhịp: act 1 dồn VÀO rồi nhỏ giọt RA,
 * act 2 dồn vào thì dồn ra.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export type EvKind =
  | "click"
  | "emit" // request rời client
  | "absorb" // request tới server
  | "arrive" // charge nằm xuống sổ · hoặc hồi âm về tới client
  | "fail" // charge TRÙNG — tiền bị trừ lần nữa
  | "drop" // hồi âm chết giữa đường
  | "attach"; // server tra sổ thấy key đã có → trả biên lai cũ

export type Ev = { f: number; kind: EvKind; i?: number };

/** `withKey` gắn vào TỪNG khối, không suy từ `keyOn` lúc vẽ: keyOn là độ hiện
 *  của cái pill, còn "request này có mang key không" là thuộc tính của chính
 *  nó. Suy từ thứ khác là đúng cái bẫy đã dính nhiều lần. */
export type Msg = {
  i: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  withKey: boolean;
  /** 0→1 cuống vé rời ra. Cú xé LÀ cú kiểm. */
  torn: number;
  /** "attached" chưa xé · "new" key mới, giữ lại · "used" key này xé rồi. */
  stubKind: "attached" | "new" | "used";
};
export type Charge = { p: number; flash: number; dup: boolean; opacity: number };

export type State = {
  cursor: { x: number; y: number; press: number; opacity: number } | null;
  press: number;
  spinning: number;
  spinRot: number;
  reqs: Msg[];
  resps: Msg[];
  charges: Charge[];
  /** 0→1 độ hiện của pill key trên card. KHÔNG phải boolean `hasKey`: ở biên
   *  loop, f=640 vẫn đang ở act 2 nên hasKey=true còn f=0 thì false — hai
   *  frame giống hệt nhau trên màn hình mà lệch trên giấy. Pill phải TAN
   *  trong cửa sổ reset như mọi thứ khác. */
  keyOn: number;
  /** 0→1: server đang LÀM VIỆC thật (trừ tiền). Đây là chỗ nghẽn. */
  working: number;
  /** 0→1: server đang TRA KHO KEY. */
  looking: number;
  /** Số dư còn lại — thứ người xem thấy đau. */
  balance: number;
  /** 0→1 vừa bị trừ. `dup` = cú trừ OAN (từ lần thứ hai trở đi). */
  balanceFlash: number;
  balanceDup: boolean;
  /** Kho key: 0→1 độ hiện. Rỗng cho tới khi request đầu ghi key vào. */
  keyStored: number;
  /** 0→1: key đang tới KHỚP với key trong kho — loé lên, rồi mới quay đầu. */
  keyMatch: number;
  /** Độ hiện của sổ + số dư + kho key. Tan ở CẢ HAI mối nối. */
  panel: number;
  srvRipple: number;
  reqLive: number;
  resLive: number;
  /** chỉ để verify */
  charged: number;
  queued: number;
};

/** Một cú chạy của server: làm việc thật hay chỉ tra sổ. */
type Job = {
  i: number;
  clickAt: number;
  arriveAt: number;
  start: number;
  end: number;
  work: boolean; // true = trừ tiền, false = tra sổ rồi trả biên lai cũ
  chargeSlot: number | null;
  dies: boolean;
};

/**
 * Dựng lịch một act. `hasKey` là BIẾN DUY NHẤT khác nhau giữa hai act —
 * lịch click, chỗ hồi âm chết, quãng đường, tất cả giữ nguyên.
 */
const buildAct = (t0: number, hasKey: boolean): Job[] => {
  const jobs: Job[] = [];
  let free = -Infinity;
  let slot = 0;
  let keySeen = false;

  CLICK_AT.forEach((c, i) => {
    const clickAt = t0 + c;
    const arriveAt = clickAt + LANE_FRAMES;
    // Trùng = CÓ key VÀ key ấy server đã thấy rồi. Không key thì server không
    // có cách nào biết bốn cái này là một ý định — nên nó làm cả bốn.
    const dup = hasKey && keySeen;
    // ĐỌC (tra key) chạy song song được — không giữ khoá. GHI (trừ tiền) thì
    // phải nối đuôi. Bắt cú tra sổ xếp hàng như cú trừ tiền là sai cơ chế, và
    // nó xoá mất chính lý do khiến idempotency rẻ.
    const start = dup ? arriveAt : Math.max(arriveAt, free);
    const end = start + (dup ? LOOKUP : WORK);
    if (!dup) free = end;
    if (!dup) keySeen = true;
    jobs.push({
      i,
      clickAt,
      arriveAt,
      start,
      end,
      work: !dup,
      chargeSlot: dup ? null : slot++,
      dies: i === 0, // hồi âm ĐẦU TIÊN chết — y hệt ở cả hai act
    });
  });
  return jobs;
};

const ACT1 = buildAct(0, false);
const ACT2 = buildAct(A2_START, true);

export const ACTS = { act1: ACT1, act2: ACT2 };

const events: Ev[] = [];
for (const act of [ACT1, ACT2]) {
  for (const j of act) {
    events.push({ f: j.clickAt, kind: "click", i: j.i });
    events.push({ f: j.clickAt + 2, kind: "emit", i: j.i });
    events.push({ f: j.arriveAt, kind: "absorb", i: j.i });
    if (j.work && j.chargeSlot !== null) {
      // Charge đầu tiên của act là hợp lệ; từ cái thứ hai trở đi là TIỀN BỊ
      // TRỪ OAN — đó mới là cú hỏng, nên nó mới được kêu bằng `fail`.
      events.push({ f: j.end, kind: j.chargeSlot === 0 ? "arrive" : "fail", i: j.i });
    } else {
      events.push({ f: j.start + LOOKUP, kind: "attach", i: j.i });
    }
    if (j.dies) {
      events.push({ f: j.end + Math.round(LANE_FRAMES * DIE_AT), kind: "drop", i: j.i });
    } else {
      events.push({ f: j.end + LANE_FRAMES, kind: "arrive", i: j.i });
    }
  }
}
events.sort((a, b) => a.f - b.f);
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);

/** Con trỏ: bò vào từ dưới-phải rồi ĐỨNG IM một nhịp mới bấm. */
const CURSOR_FROM = { x: 880, y: 990 };
const CURSOR_ON = { x: BUTTON_C.x + 5, y: BUTTON_C.y - 7 };

const cursorAt = (f: number, t0: number, lastClick: number) => {
  const inAt = t0 + CLICK_AT[0] - HOVER - CURSOR_IN;
  if (f < inAt) return null;
  const outAt = lastClick + 40;
  if (f > outAt + 20) return null;
  const p = clamp01((f - inAt) / CURSOR_IN);
  const q = at(CURSOR_FROM, CURSOR_ON, easeOut(p));
  const fade = ramp(f, inAt, 8) * (1 - ramp(f, outAt, 20));
  return { x: q.x, y: q.y, opacity: fade };
};

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    // Nửa sau cửa sổ reset đã thuộc về VÒNG SAU: quay về act 1 ngay từ đó, để
    // f=LOOP mang đúng trạng thái của f=0 (số dư $200, sổ rỗng). Không thì
    // f=640 vẫn là act 2 với số dư $150 — hai frame lệch nhau ở đúng chỗ phải
    // trùng khít.
    const RESET_HALF = RESET + RESET_DUR / 2;
    /**
     * Nửa sau cửa sổ reset LÀ frame ÂM của vòng sau: f=628..640 chính là
     * fe=-12..0. Chỉ đổi `act` về ACT1 mà vẫn đọc `f` thì bốn cú trừ tiền của
     * act 1 SỐNG LẠI — `f >= j.end` vẫn đúng ở f=640. Phải quấn cả THỜI GIAN,
     * không chỉ quấn cái act.
     */
    const wrap = f >= RESET_HALF;
    const fe = wrap ? f - LOOP : f;
    const inA1 = fe < A1_RESET;
    const act = inA1 ? ACT1 : ACT2;
    const t0 = inA1 ? 0 : ACT2_AT;
    const hasKey = !inA1;

    /**
     * Tấm panel (sổ + số dư + kho key) tan ở CẢ HAI mối nối, không chỉ ở chỗ
     * khép loop: chỗ đổi act cũng là một mối nối. Thiếu nó thì ở f=310 số dư
     * nhảy $0 → $200 một phát và sổ biến mất tức thì — một cú giật thật, mà
     * chốt chặn seamless không thấy vì nó chỉ soi hai đầu loop.
     */
    const panel =
      f < A1_RESET
        ? 1 - ramp(f, A1_RESET - 14, 14)
        : f < RESET
          ? ramp(f, A1_RESET, 14)
          : f < RESET_HALF
            ? 1 - ramp(f, RESET, RESET_DUR / 2)
            : ramp(f, RESET_HALF, RESET_DUR / 2);

    const reqs: Msg[] = [];
    const resps: Msg[] = [];
    const charges: Charge[] = [];
    let working = 0;
    let looking = 0;
    let srvRipple = -1;
    let reqLive = 0;
    let resLive = 0;
    let press = 0;
    let charged = 0;
    let queued = 0;

    for (const j of act) {
      // ── Nút bị bấm ──
      if (fe >= j.clickAt && fe < j.clickAt + CLICK_FLASH) {
        press = Math.max(press, 1 - (fe - j.clickAt) / CLICK_FLASH);
      }

      // ── Request đi xuống, và DỒN ĐỐNG nếu server đang bận ──
      // Đống neo ở cửa server, phình LÊN. Đống càng cao thì khối đang tới càng
      // phải dừng SỚM — chạm đuôi hàng là đứng lại, không đâm xuyên qua.
      // Đây là chỗ act 1 tắc, và cái tắc ấy là tương phản nhịp của cả video.
      // Vé bay xuống, dồn đống nếu server bận, RỒI BỊ XÉ ngay cửa.
      // Cú xé phải nhìn thấy được — nó chính là cú kiểm key.
      const tearEnd = j.start + TEAR + TEAR_HOLD;
      if (fe >= j.clickAt && fe < tearEnd) {
        const flight = at(REQ_FROM, REQ_TO, easeInOut(clamp01((fe - j.clickAt) / LANE_FRAMES)));
        // Đếm vé còn ĐANG CHIẾM CỬA — kể cả vé chỉ đang bị xé. Cửa bị chiếm về
        // mặt VẬT LÝ thì vé sau phải chờ, dù server đã rảnh về mặt LOGIC (cú
        // tra sổ không giữ khoá). Đếm theo khoá logic thôi là vé sau bay xuyên
        // qua vé đang bị xé.
        const ahead = act.filter(
          (k) => k.i < j.i && k.arriveAt <= fe && fe < k.start + TEAR + TEAR_HOLD,
        ).length;
        const parkY = REQ_TO.y - ahead * QUEUE_PITCH;
        const y = Math.min(flight.y, parkY);
        const torn = hasKey ? ramp(fe, j.start, TEAR) : 0;
        // Cuống xanh = key mới (vé này được tính). Cuống đỏ = key đã xé rồi.
        const stubKind = torn < 0.5 ? "attached" : j.work ? "new" : "used";
        // Xé xong thì vé tan: thân đi vào server (cú GHI) hoặc bị bỏ (cú trùng).
        const fade = fe < j.start + TEAR ? 1 : 1 - ramp(fe, j.start + TEAR, TEAR_HOLD);
        reqs.push({
          i: j.i,
          x: REQ_FROM.x,
          y,
          opacity: hasKey ? fade : fe < j.start ? 1 : 0,
          scale: 1,
          withKey: hasKey,
          torn,
          stubKind,
        });
        if (fe < j.start) reqLive = 1;
        if (fe >= j.arriveAt && fe < j.start) queued++;
      }

      // ── Server đang chạy ──
      if (fe >= j.start && fe < j.end) {
        if (j.work) working = 1;
        else looking = 1;
        if (fe < j.start + RIPPLE_DUR) srvRipple = (fe - j.start) / RIPPLE_DUR;
      }

      // ── Charge nằm trong sổ ──
      if (j.chargeSlot !== null && fe >= j.end) {
        charges.push({
          p: j.chargeSlot,
          opacity: panel,
          flash: clamp01(1 - (fe - j.end) / CHARGE_FLASH),
          // Từ charge thứ HAI trở đi là tiền bị trừ oan → nháy cam.
          // Cái đầu tiên hợp lệ → loé trắng, bình thản.
          dup: j.chargeSlot > 0,
        });
        charged++;
      }

      // ── Hồi âm đi lên ──
      const respEnd = j.dies ? j.end + Math.round(LANE_FRAMES * DIE_AT) : j.end + LANE_FRAMES;
      if (fe >= j.end && fe < respEnd) {
        const p = (fe - j.end) / LANE_FRAMES;
        const q = at(RES_FROM, RES_TO, easeInOut(p));
        // Chết = tan dần trong 8 frame cuối, không biến mất một phát.
        const fade = j.dies ? 1 - clamp01((fe - (respEnd - 8)) / 8) : 1;
        resps.push({ i: j.i, x: q.x, y: q.y, opacity: fade, scale: 1, withKey: hasKey, torn: 0, stubKind: "attached" });
        resLive = 1;
      }
    }

    // Spinner: quay từ cú click đầu cho tới khi hồi âm ĐẦU TIÊN CÒN SỐNG về
    // tới nơi. Nó quay mãi mà không dứt chính là ĐỘNG CƠ của cú spam — không
    // có nó thì spam là lỗi người dùng, có nó thì spam là hành vi hợp lý.
    const firstAlive = act.filter((j) => !j.dies).map((j) => j.end + LANE_FRAMES);
    const spinUntil = firstAlive.length ? Math.min(...firstAlive) : Infinity;
    const spinFrom = act[0].clickAt;
    const spinning = fe >= spinFrom && fe < spinUntil ? 1 : 0;

    const lastClick = act[act.length - 1].clickAt;
    const c = cursorAt(fe, t0, lastClick);
    // Số dư: đếm mọi cú trừ đã xong tính tới frame này. Tính RA, không gõ.
    const done = act.filter((j) => j.chargeSlot !== null && fe >= j.end);
    const balance = BALANCE_START - done.length * PRICE;
    // Hỏi CÚ TRỪ CUỐI CÙNG có phải cú oan không — đừng suy từ số lượng.
    const last = done.length ? done.reduce((a, b) => (a.end >= b.end ? a : b)) : null;
    const balanceFlash = last ? clamp01(1 - (fe - last.end) / CHARGE_FLASH) : 0;
    const balanceDup = last ? (last.chargeSlot ?? 0) > 0 : false;

    // Kho key: rỗng cho tới khi cú GHI đầu tiên ghi key vào.
    const firstWrite = act.find((j) => j.work);
    const keyStored = hasKey && firstWrite && fe >= firstWrite.end ? ramp(fe, firstWrite.end, 8) : 0;
    // Khớp: request thừa đang nằm ở kho, hai key soi vào nhau.
    let keyMatch = 0;
    for (const j of act) {
      if (j.work) continue;
      if (fe >= j.start && fe < j.start + MATCH_FLASH) {
        keyMatch = Math.max(keyMatch, 1 - Math.abs(fe - (j.start + MATCH_FLASH / 2)) / (MATCH_FLASH / 2));
      }
    }

    const resetT = ramp(f, RESET, RESET_DUR);

    out.push({
      balance,
      balanceFlash,
      balanceDup,
      keyStored: keyStored * panel,
      panel,
      keyMatch,
      cursor: c && c.opacity > 0.001 ? { ...c, press } : null,
      press,
      spinning: spinning * (1 - resetT),
      spinRot: (f * 7) % 360,
      reqs,
      resps,
      charges: charges.filter((c) => c.opacity > 0.001),
      keyOn: ramp(fe, KEY_IN, KEY_IN_DUR) * panel,
      working,
      looking,
      srvRipple,
      reqLive,
      resLive,
      charged,
      queued,
    });
  }

  return out;
};

export const STATES = simulate();

/** Kết cục mỗi act — con số kể chuyện, verify canh. */
export const OUTCOME = {
  act1Charges: ACT1.filter((j) => j.chargeSlot !== null).length,
  act2Charges: ACT2.filter((j) => j.chargeSlot !== null).length,
  act1Work: ACT1.filter((j) => j.work).length,
  act2Work: ACT2.filter((j) => j.work).length,
  act1Answered: ACT1.length,
  act2Answered: ACT2.length,
};

/** Nhịp: act 1 dồn VÀO rồi nhỏ giọt RA; act 2 dồn vào thì dồn ra. */
export const CADENCE = {
  arrive: CLICK_AT.slice(1).map((c, i) => c - CLICK_AT[i]),
  act1Out: ACT1.slice(1).map((j, i) => j.end - ACT1[i].end),
  act2Out: ACT2.slice(1).map((j, i) => j.end - ACT2[i].end),
};

void SPEED;
void ledger;
void AMOUNT;
void IDEM_KEY;
void N_CLICKS;
export type { Pt };
