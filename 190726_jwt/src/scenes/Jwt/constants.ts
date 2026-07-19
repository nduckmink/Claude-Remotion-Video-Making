// JWT — "Vòng đời một token". Một mạch kể liền: ĐÚC → DÙNG → BỊ TẤN CÔNG.
//
// Không mã hoá con số nào bằng chữ: token bay có SỨC NẶNG (spring/arc), chữ ký
// là mã vạch băm từ payload — sửa payload thì server ký lại ra dãy vạch khác,
// lộ ngay. Hacker thiếu con dấu secret nên giả không nổi.

export const FPS = 30;
export const LOOP = 528; // 17.6s — bội 16 (×33)
export const W = 1080;
export const H = 1920;

export const TITLE = "JWT";

// ─── Vị trí ────────────────────────────────────────────────────────────
export const FUNNEL = { cx: 540, top: 430, mouthW: 320, neckW: 74, height: 196 };
export const EMIT = { x: 540, y: 664 }; // token nhả ra ở đây
export const MINT_SEAL = { x: 540, y: 604 }; // con dấu ký ở cổ phễu

// Claims rơi vào phễu — spawn phía trên miệng, chụm về cổ.
export const CLAIMS = [
  { label: "user:42", spawn: { x: 442, y: 352 } },
  { label: "role:user", spawn: { x: 560, y: 330 } },
  { label: "exp:2h", spawn: { x: 662, y: 356 } },
];
export const MOUTH = { x: 540, y: 470 }; // đích claim rơi tới trước khi chui cổ

export const CLIENT = { x: 238, y: 1246, w: 300, h: 250, rows: 3 };
export const SERVER = { x: 844, y: 1210, w: 330, h: 320, rows: 4 };
export const SERVER_SEAL = { x: 985, y: 1008 }; // secret ở góc trên-phải server, né token

export const CLIENT_DOCK = { x: 300, y: 1052 }; // token đậu ở client
export const SERVER_DOCK = { x: 768, y: 952 }; // token đậu ở server (cao hơn nóc server)
export const LANE_BEND = 150; // độ võng cung client↔server (dương = võng xuống, về phía hacker)

export const HACKER = { x: 540, y: 1540, size: 150 };
export const INTERCEPT = { x: 540, y: 1150 }; // chỗ hacker chộp token giữa làn

// ─── Payload & chữ ký ───────────────────────────────────────────────────
export const PAYLOAD_GOOD = "role:user";
export const PAYLOAD_TAMPERED = "role:admin";
export const OWN_SIG = "role:user"; // chữ ký đóng dấu lúc đúc (từ payload gốc)

// ─── Timeline (frame) ────────────────────────────────────────────────────
// ĐÚC
export const CLAIM_FALL = [6, 24, 42]; // mỗi claim bắt đầu rơi
export const CLAIM_DUR = 34; // thời gian rơi vào cổ phễu
export const SIGN_F = 66; // con dấu đập xuống — bắt đầu ký
export const MINT_END = 96; // token thành hình, seal = 1
export const DELIVER_END = 150; // token đậu ở client

// DÙNG — hai vòng hợp lệ (up → verify → back)
export const T1 = { up: 150, verify: 196, pass: 214, back: 228, end: 262 };
export const T2 = { up: 276, verify: 322, pass: 340, back: 354, end: 388 };

// TẤN CÔNG
export const A = {
  up: 400, // token rời client về phía server
  intercept: 432, // hacker chộp ở giữa làn — token khựng lại
  tamper: 446, // payload user → admin
  resume: 462, // token đi tiếp tới server
  atServer: 488, // đậu ở server
  reject: 508, // ký lại lệch → từ chối (đỏ)
  shatter: 510,
  shatterEnd: 526,
};

// RESET
export const CLAIM_REAPPEAR = 504; // claims hiện lại ở spawn cho vòng sau
export const HACK_IN = 384; // hacker mờ hiện vào
export const HACK_OUT = 524; // hacker mờ đi

// ─── Nhịp thở (period phải CHIA HẾT LOOP=528 để seamless) ─────────────────
export const BREATHE = 132; // 528/4
export const SWIRL_TURNS = 3; // xoáy phễu quay 3 vòng/loop → f0==fLOOP

export type Pt = { x: number; y: number };
