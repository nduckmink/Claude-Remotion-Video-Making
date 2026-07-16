/**
 * Đại diện cho một subscription — cái chốt mà service tự mang lên cắm vào topic.
 *
 * Hình khác hẳn Envelope là có chủ ý: phong bì là DỮ LIỆU đang chảy, còn cái
 * này là một mẩu CẤU HÌNH — bay lên một lần rồi ở lại làm một phần của hệ
 * thống. Hai thứ khác vai thì không được trông giống nhau.
 *
 * Nó mang màu của service đã phát ra nó: đăng ký xong thì cái spoke mọc ra từ
 * đây cũng đúng màu ấy — nhìn là biết chốt nào của ai.
 */
export const SubToken: React.FC<{
  x: number;
  y: number;
  color: string;
  /** 0→1: vừa cắm vào — ring loé rộng ra rồi co lại. */
  snap?: number;
  opacity?: number;
  r?: number;
}> = ({ x, y, color, snap = 0, opacity = 1, r = 11 }) => {
  const ring = r + 7 + 10 * (1 - snap) * (snap > 0 ? 1 : 0);

  return (
    <>
      {snap > 0 && snap < 1 ? (
        <div
          style={{
            position: "absolute",
            left: x - ring,
            top: y - ring,
            width: ring * 2,
            height: ring * 2,
            borderRadius: 999,
            border: `3px solid ${color}`,
            opacity: (1 - snap) * opacity,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: 999,
          backgroundColor: color,
          boxShadow: `0 0 16px ${color}88`,
          opacity,
        }}
      />
    </>
  );
};
