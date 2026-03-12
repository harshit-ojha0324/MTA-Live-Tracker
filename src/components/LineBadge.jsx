import { SUBWAY_LINES } from "../constants/lines";

export default function LineBadge({ line, size = 28 }) {
  const info = SUBWAY_LINES[line];
  if (!info) return null;
  const isYellow = info.color === "#FCCC0A";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      backgroundColor: info.color,
      color: isYellow ? "#1a1a1a" : "#fff",
      fontSize: size * 0.5, fontWeight: 800,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      lineHeight: 1, flexShrink: 0,
    }}>
      {line}
    </span>
  );
}
