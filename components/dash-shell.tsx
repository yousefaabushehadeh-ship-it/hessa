"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import { useT } from "@/components/lang";

export type NavItem = { href: string; label: string; icon: string };

export function DashShell({ nav, children, footer }: { nav: NavItem[]; children: ReactNode; footer?: ReactNode }) {
  const path = usePathname();
  const t = useT();
  // The first item is the dashboard root, so it only matches exactly.
  const isOn = (href: string, i: number) => (i === 0 ? path === href : path.startsWith(href));
  return (
    <div className="dash">
      <aside className="rail">
        <Link href="/" className="logo">
          <span className="mk">ح</span>Hessa
        </Link>
        <nav>
          {nav.map((n, i) => (
            <Link key={n.href} href={n.href} className={isOn(n.href, i) ? "on" : ""}>
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ))}
        </nav>
        {footer}
      </aside>
      <main className="main">{children}</main>
      <nav className="mbar" aria-label={t("Navigation")}>
        {nav.map((n, i) => (
          <Link key={n.href} href={n.href} className={isOn(n.href, i) ? "on" : ""}>
            <Icon name={n.icon} />
            <span>{n.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function TopBar({ title, sub, who, initial, color }: { title: string; sub: string; who: string; initial: string; color: string }) {
  return (
    <div className="top">
      <div className="hi">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="me">
        <div className="av" style={{ width: 44, height: 44, borderRadius: "50%", background: color, fontSize: 18 }}>
          {initial}
        </div>
        <span>{who}</span>
      </div>
    </div>
  );
}
