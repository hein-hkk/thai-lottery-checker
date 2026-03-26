"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";

interface HeaderDrawerProps {
  children: ReactNode;
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function HeaderDrawer({ children, id, isOpen, onClose, title, triggerRef }: HeaderDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ui-drawer-root lg:hidden">
      <button aria-label={`Close ${title}`} className="ui-drawer-overlay" onClick={onClose} type="button" />
      <aside aria-labelledby={titleId} aria-modal="true" className="ui-drawer-panel" id={id} role="dialog">
        <div className="ui-drawer-header">
          <h2 className="ui-drawer-title" id={titleId}>
            {title}
          </h2>
          <button
            aria-label={`Close ${title}`}
            className="ui-button-secondary ui-header-icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="ui-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
