import Image from "next/image";
import logoFullDark from "../../../../../brand/logo-full-dark.svg";
import logoFullLight from "../../../../../brand/logo-full-light.svg";
import logoMarkDark from "../../../../../brand/logo-mark-dark.svg";
import logoMarkLight from "../../../../../brand/logo-mark-light.svg";

interface BrandLogoProps {
  alt: string;
  className?: string;
  priority?: boolean;
  variant?: "full" | "mark";
}

const logos = {
  full: {
    dark: logoFullDark,
    light: logoFullLight
  },
  mark: {
    dark: logoMarkDark,
    light: logoMarkLight
  }
} as const;

export function BrandLogo({ alt, className, priority = false, variant = "full" }: BrandLogoProps) {
  const selectedLogo = logos[variant];

  return (
    <span className={className}>
      <Image
        alt={alt}
        className="ui-theme-light-logo h-auto w-auto"
        priority={priority}
        src={selectedLogo.light}
      />
      <Image
        alt={alt}
        className="ui-theme-dark-logo h-auto w-auto"
        priority={priority}
        src={selectedLogo.dark}
      />
    </span>
  );
}
