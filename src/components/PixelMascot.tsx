import type { HTMLAttributes } from "react";

type PixelMascotSize = "sm" | "md" | "lg";
type PixelMascotMood = "happy" | "read" | "think" | "cheer";

type PixelMascotProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  size?: PixelMascotSize;
  mood?: PixelMascotMood;
  label?: string;
};

export function PixelMascot({
  size = "md",
  mood = "happy",
  label = "跳跳学长像素小人",
  className,
  role,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  ...props
}: PixelMascotProps) {
  const hidden = ariaHidden === true || ariaHidden === "true";
  const classNames = ["pixel-mascot", size, mood, className].filter(Boolean).join(" ");
  const accessibilityProps = hidden
    ? { "aria-hidden": true }
    : {
        role: role ?? "img",
        "aria-label": ariaLabel ?? label
      };

  return (
    <div className={classNames} {...accessibilityProps} {...props}>
      <span className="pixel-shadow" aria-hidden="true" />
      <span className="pixel-pack pixel-backpack" aria-hidden="true" />
      <span className="pixel-leg pixel-foot left" aria-hidden="true" />
      <span className="pixel-leg pixel-foot right" aria-hidden="true" />
      <span className="pixel-body" aria-hidden="true" />
      <span className="pixel-arm left" aria-hidden="true" />
      <span className="pixel-arm right" aria-hidden="true" />
      <span className="pixel-head" aria-hidden="true" />
      <span className="pixel-hair" aria-hidden="true" />
      <span className="pixel-eye left" aria-hidden="true" />
      <span className="pixel-eye right" aria-hidden="true" />
      <span className="pixel-mouth" aria-hidden="true" />
    </div>
  );
}

export default PixelMascot;
