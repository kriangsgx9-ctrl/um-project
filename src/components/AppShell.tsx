// Minimal AppShell/Sidebar/Topbar (V1 spec §29) — routing skeleton only.
// Full visual design (mirroring the validated prototype) lands in Sprint C.
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journey", label: "My Journey" },
  { href: "/actions", label: "Actions" },
  { href: "/performance", label: "Performance" },
  { href: "/recruitment", label: "Recruitment" },
  { href: "/development", label: "Development" },
  { href: "/evidence", label: "Evidence" },
  { href: "/promotion", label: "Promotion" },
  { href: "/team", label: "Team" },
];

export function AppShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: string;
}) {
  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen">
      <aside className="bg-[#111111] text-zinc-200 p-4 flex flex-col gap-1">
        <div className="font-extrabold text-sm tracking-wide mb-6 px-2">PRIME UM ASCEND</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-zinc-500 px-2 pt-4 border-t border-zinc-800">
          <div className="text-zinc-300 font-medium">{userName}</div>
          <div>{role}</div>
        </div>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
