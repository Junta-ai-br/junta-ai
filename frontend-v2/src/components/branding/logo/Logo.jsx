import fullBranca from "@/assets/logos/logo-full-branca.svg";
import fullPreta from "@/assets/logos/logo-full-preta.svg";

import horizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import horizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";

import iconLogo from "@/assets/logos/logo-icon.svg";

const logos = {
  full: {
    branca: fullBranca,
    preta: fullPreta,
  },
  horizontal: {
    branca: horizontalBranca,
    preta: horizontalPreta,
  },
  icon: iconLogo,
};

export default function Logo({
  variant = "horizontal",
  wordmark="preta",
  width = 180,
  height,
  alt = "Junta.ai",
  className = "",
  ...props
}) {
  const src =
    variant === "icon"
      ? logos.icon
      : logos[variant]?.[wordmark] ?? logos.horizontal.preta;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      draggable={false}
      {...props}
    />
  );
}