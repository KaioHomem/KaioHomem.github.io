import { cn } from "@/lib/utils";

/**
 * Splits a word into per-character spans for animation. Screen readers get the whole
 * word once (a visually hidden copy), not letter by letter.
 */
export function SplitChars({
  text,
  className,
  charClassName,
  attr = "data-char",
  charStyle,
}: {
  text: string;
  className?: string;
  charClassName?: string;
  attr?: string;
  /** Initial inline style, e.g. a transform GSAP animates from. */
  charStyle?: React.CSSProperties;
}) {
  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden {...{ [attr]: "" }} className={cn("inline-block will-change-transform", charClassName)} style={charStyle}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}
