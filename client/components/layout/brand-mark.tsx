import Link from "next/link";

import { GitQueryIcon } from "@/components/icons/gitquery-icon";
import { cn } from "@/lib/utils";

/**
 * Logo lockup used in headers and on the auth pages.
 *
 * Lives in its own module rather than in `app-shell` so that pages which only
 * need the brand — the landing page and the login screen — don't pull the
 * whole sidebar client bundle into their render tree.
 */
export function BrandMark({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string | null;
  showText?: boolean;
}) {
  const content = (
    <>
      <GitQueryIcon className="size-8 rounded-[11px] shadow-subtle transition-transform duration-300 group-hover/brand:scale-105" />
      {showText && (
        <span className="font-heading text-[0.95rem] font-semibold tracking-tight">
          GitQuery
        </span>
      )}
    </>
  );

  const shared = cn(
    "group/brand inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
    className,
  );

  if (!href) {
    return <div className={shared}>{content}</div>;
  }

  return (
    <Link href={href} className={shared}>
      {content}
    </Link>
  );
}
