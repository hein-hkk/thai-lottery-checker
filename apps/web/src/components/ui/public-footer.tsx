import Link from "next/link";
import type { PublicMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";

interface PublicFooterProps {
  locale: SupportedLocale;
  messages: PublicMessages;
}

export function PublicFooter({ locale, messages }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="ui-public-footer" role="contentinfo">
      <div className="ui-container">
        <div className="ui-public-footer-inner">
          <nav aria-label="Footer navigation" className="ui-public-footer-nav">
            <Link className="ui-public-footer-link" href={`/${locale}`}>
              {messages.home}
            </Link>
            <Link className="ui-public-footer-link" href={`/${locale}/results`}>
              {messages.latestResults}
            </Link>
            <Link className="ui-public-footer-link" href={`/${locale}/blog`}>
              {messages.blog}
            </Link>
          </nav>
          <p className="ui-public-footer-copy">{messages.footerCopyright.replace("{year}", year.toString())}</p>
        </div>
      </div>
    </footer>
  );
}
