import { T } from "../theme";

export default function StatusDot({ severity }) {
  const colors = [T.success, T.warning, T.planned, T.danger];
  const color  = colors[severity] ?? T.textMuted;
  return (
    <span style={{
      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
      backgroundColor: color, flexShrink: 0,
    }} />
  );
}
