"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { HeaderDrawer } from "./header-drawer";
import { ThemeToggle } from "./theme-toggle";

interface AdminHeaderProps {
  logoHref: string;
  navItems: Array<{ href: string; label: string }>;
  userMeta: ReactNode;
  actions: ReactNode;
}

export function AdminHeader({ logoHref, navItems, userMeta, actions }: AdminHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="ui-shell-header">
      <div className="ui-container py-4">
        <div className="ui-mobile-topbar lg:hidden">
          <div className="ui-mobile-topbar-side">
            <button
              aria-controls="admin-mobile-drawer"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              className="ui-button-secondary ui-header-icon-button"
              onClick={() => setIsOpen((current) => !current)}
              ref={menuTriggerRef}
              type="button"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          </div>

          <Link aria-label="LottoKai admin home" className="ui-brand-link ui-mobile-brand" href={logoHref}>
            <BrandLogo alt="LottoKai" className="ui-brand-logo" priority variant="full" />
          </Link>

          <div className="ui-mobile-topbar-side ui-mobile-topbar-side-end" />
        </div>

        <HeaderDrawer id="admin-mobile-drawer" isOpen={isOpen} onClose={() => setIsOpen(false)} title="Admin navigation menu" triggerRef={menuTriggerRef}>
          <nav className="ui-mobile-nav" aria-label="Admin navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  className={`ui-mobile-nav-link ${isActive ? "ui-mobile-nav-link-active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ui-divider my-4" />

          <div className="ui-drawer-controls">
            <ThemeToggle darkModeLabel="Dark" lightModeLabel="Light" themeLabel="Theme" />
          </div>

          <div className="ui-divider my-4" />

          <div className="flex flex-col gap-3">
            <div className="ui-mobile-user">{userMeta}</div>
            <div>{actions}</div>
          </div>
        </HeaderDrawer>

        <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div className="ui-header-main">
            <Link aria-label="LottoKai admin home" className="ui-brand-link" href={logoHref}>
              <BrandLogo alt="LottoKai" className="ui-brand-logo" priority variant="full" />
            </Link>
            <nav className="ui-shell-nav" aria-label="Admin navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link className={`ui-nav-link ${isActive ? "ui-nav-link-active" : ""}`} href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {userMeta}
            <ThemeToggle darkModeLabel="Dark" lightModeLabel="Light" themeLabel="Theme" />
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
