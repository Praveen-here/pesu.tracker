interface Props {
  size?: number;
  color?: string;
}

// iOS-style spoked activity indicator.
export default function ActivityIndicator({ size = 20, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="activity-indicator"
      role="progressbar"
      aria-label="Loading"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="12"
          y1="2.5"
          x2="12"
          y2="7"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity={0.2 + (i / 7) * 0.8}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}
