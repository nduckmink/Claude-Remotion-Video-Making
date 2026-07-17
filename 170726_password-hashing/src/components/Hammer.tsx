import { C } from "../lib/tokens";

export const HEAD = { w: 46, h: 26 };

/**
 * Búa — động từ của khối bcrypt, không phải một thành phần hệ thống.
 *
 * Ẩn dụ chọn vì đúng cái tính chất cần nói: đập thì được, gỡ ra thì không.
 * Một chiều. Đó là toàn bộ lý do hash cứu được cái database bị trộm.
 *
 * Búa mang tên `bcrypt` chứ không phải `salt`: salt là NGUYÊN LIỆU trộn vào
 * trước khi đập, không phải cái đập.
 *
 * API nhận CHỖ ĐẦU BÚA PHẢI CHẠM, không nhận trục xoay — trục suy ra từ đó.
 * Bản trước nhận trục và tự dựng chuôi hướng LÊN, nên ở swing=1 đầu búa nằm
 * cách cái đe 110px phía trên: gõ vào không khí. Cho gọi hàm khai báo cái mình
 * MUỐN (chạm ở đâu) thì kiểu sai đó không viết ra được.
 */
export const Hammer: React.FC<{
  /** Chỗ tâm đầu búa phải nằm khi swing = 1. */
  headX: number;
  headY: number;
  /** 0 = giơ, 1 = chạm đe. */
  swing: number;
  arm?: number;
  /** Góc giơ, độ. Dương = giơ sang trái. */
  raise?: number;
  opacity?: number;
}> = ({ headX, headY, swing, arm = 64, raise = 100, opacity = 1 }) => {
  // Trục xoay nằm ngay TRÊN đầu búa đúng một chiều dài chuôi: ở swing=1
  // (góc 0) chuôi thẳng đứng và đầu búa rơi chính xác vào (headX, headY).
  const angle = raise * (1 - swing);

  return (
    <div
      style={{
        position: "absolute",
        left: headX,
        top: headY - arm,
        width: 0,
        height: 0,
        opacity,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 0",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -4,
          top: 0,
          width: 8,
          height: arm - HEAD.h / 2,
          borderRadius: 3,
          backgroundColor: C.lineLive,
        }}
      />
      {/* Đầu búa: khối ĐẶC, góc cạnh — thứ nặng thì góc cạnh. */}
      <div
        style={{
          position: "absolute",
          left: -HEAD.w / 2,
          top: arm - HEAD.h / 2,
          width: HEAD.w,
          height: HEAD.h,
          borderRadius: 3,
          backgroundColor: C.data,
        }}
      />
    </div>
  );
};
