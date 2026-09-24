"use client";

// v1 §35 "never make users hunt for their next action" + §42 accessibility:
// marks the current page both visually and via aria-current for screen readers.
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  className,
  activeClassName,
  children,
}: {
  href: string;
  className: string;
  activeClassName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link href={href} aria-current={isActive ? "page" : undefined} className={`${className} ${isActive ? activeClassName : ""}`}>
      {children}
    </Link>
  );
}
