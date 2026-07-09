import { COLORS } from "../theme";
import { cormorant } from "../fonts";

/** JBJ monogram lockup with champagne hairline frame. */
export default function Monogram({
  size = 120,
  color = COLORS.champagne,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `1px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.06em",
        color,
        fontFamily: cormorant,
        fontSize: size * 0.42,
        fontWeight: 500,
      }}
    >
      JBJ
    </div>
  );
}
