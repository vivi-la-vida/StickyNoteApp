type MagnetProps = {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function Magnet({
  color = "#EF5350",
  className = "",
  style,
}: MagnetProps) {
  return (
    <div
      className={`absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white/60 shadow-md ${className}`.trim()}
      style={{
        background: `radial-gradient(circle at 35% 35%, white 0%, ${color} 50%, ${color}cc 100%)`,
        ...style,
      }}
    />
  );
}
