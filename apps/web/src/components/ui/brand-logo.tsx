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
        className="logo-light block h-auto w-auto dark:hidden"
        priority={priority}
        src={selectedLogo.light}
      />
      <Image
        alt={alt}
        className="logo-dark hidden h-auto w-auto dark:block"
        priority={priority}
        src={selectedLogo.dark}
      />
    </span>
  );
}
