import { C } from "../lib/tokens";

/**
 * Một message đang bay — phong bì ĐẶC có glow. Đây là diễn viên.
 *
 * Đặc, không rỗng: "hệ thống thì rỗng, dữ liệu thì đặc" (style_guide.md).
 * Vẽ bằng SVG primitive, không phải icon pack — nắp thư chỉ là một nét chữ V
 * màu nền khoét lên thân.
 *
 * MÀU CHÍNH LÀ ĐỊA CHỈ. Phong bì trắng = thư chưa có người nhận — publisher
 * bắn nó vào topic mà không biết ai sẽ đọc. Broker mới là chỗ dán địa chỉ.
 * Đó là toàn bộ ý của video, nằm gọn trong một quy ước màu.
 */
export const Envelope: React.FC<{
  x: number;
  y: number;
  color: string;
  w?: number;
  opacity?: number;
  scale?: number;
}> = ({ x, y, color, w = 38, opacity = 1, scale = 1 }) => {
  const h = Math.round(w * 0.72);

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        borderRadius: 4,
        boxShadow: `0 0 18px ${color}66, 0 0 6px ${color}99`,
      }}
    >
      <svg width={w} height={h} viewBox="0 0 38 27" style={{ display: "block" }}>
        <rect x={0} y={0} width={38} height={27} rx={4} fill={color} />
        <path
          d="M4 7 L19 18 L34 7"
          fill="none"
          stroke={C.bg}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
