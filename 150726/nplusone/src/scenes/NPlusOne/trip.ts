import { interpolate } from "remotion";
import { ease } from "../../lib/motion";
import {
  LINE_Y0,
  LINE_Y1,
  RIPPLE_LEN,
  TRIP,
  TRIP_DOWN,
  TRIP_DWELL,
} from "./constants";

export type Trip = {
  /** thứ tự round trip trong act, 0-based */
  index: number;
  /** frame trong nội bộ round trip: 0..TRIP-1 */
  local: number;
  /** y của packet trên connector */
  packetY: number;
  /** 0→1 độ nở của ripple tại DB; 0 = chưa chạm */
  ripple: number;
  /** packet đang đi xuống (query) hay đi lên (result) */
  returning: boolean;
};

/**
 * Trạng thái round trip tại một frame tuyệt đối.
 * null = act chưa bắt đầu hoặc đã xong.
 *
 * MỌI round trip đều dài đúng TRIP frame — ở cả hai act. Đó là điều
 * khiến Act 2 ngắn hơn *chỉ vì* nó đi ít vòng hơn, chứ không phải vì
 * được tua nhanh.
 */
export const tripAt = (
  frame: number,
  start: number,
  count: number,
): Trip | null => {
  const t = frame - start;
  if (t < 0 || t >= count * TRIP) return null;

  const index = Math.floor(t / TRIP);
  const local = t % TRIP;

  const down = local < TRIP_DOWN;
  const dwell = local >= TRIP_DOWN && local < TRIP_DOWN + TRIP_DWELL;

  let packetY: number;
  if (down) {
    packetY = interpolate(local, [0, TRIP_DOWN], [LINE_Y0, LINE_Y1], {
      easing: ease,
    });
  } else if (dwell) {
    packetY = LINE_Y1;
  } else {
    packetY = interpolate(
      local,
      [TRIP_DOWN + TRIP_DWELL, TRIP],
      [LINE_Y1, LINE_Y0],
      { easing: ease },
    );
  }

  const ripple = down
    ? 0
    : interpolate(local, [TRIP_DOWN, TRIP_DOWN + RIPPLE_LEN], [0, 1], {
        extrapolateRight: "clamp",
      });

  return { index, local, packetY, ripple, returning: !down && !dwell };
};
