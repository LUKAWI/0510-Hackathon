export function staggerDelay(index: number, baseMs = 50): React.CSSProperties {
  return {
    animationDelay: `${index * baseMs}ms`,
  };
}

export function staggerStyle(
  index: number,
  baseMs = 50,
  animName = "fadeInUp",
): React.CSSProperties {
  return {
    animation: `${animName} 0.4s var(--ease-smooth) both`,
    animationDelay: `${index * baseMs}ms`,
  };
}
