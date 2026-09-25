// Minimal AppShell/Sidebar/Topbar (V1 spec §29) + mobile bottom nav (V2 §4.3).
import {
  ClipboardList,
  FileCheck2,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Map,
  Trophy,
  TrendingUp,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { QuickLogButton } from "@/components/QuickLog/QuickLogButton";
import { NavLink } from "@/components/NavLink";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journey", label: "My Journey", icon: Map },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/recruitment", label: "Recruitment", icon: Users },
  { href: "/development", label: "Development", icon: GraduationCap },
  { href: "/evidence", label: "Evidence", icon: FileCheck2 },
  { href: "/promotion", label: "Promotion", icon: Trophy },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/passport", label: "UM Passport", icon: IdCard },
];

// V2 §4.3: หน้าแรก · แผนที่ · [+ Quick Log, rendered separately as a floating
// button so it can sit visually centered above this bar] · ทีม · ฉัน
const MOBILE_NAV = [
  { href: "/dashboard", label: "หน้าแรก", icon: LayoutDashboard },
  { href: "/journey", label: "แผนที่", icon: Map },
  { href: "/team", label: "ทีม", icon: UsersRound },
  { href: "/profile", label: "ฉัน", icon: User },
];

interface QuickLogCandidate {
  id: string;
  name: string;
}
interface QuickLogEvidenceAction {
  actionId: string;
  title: string;
}

export function AppShell({
  children,
  userName,
  role,
  quickLogCandidates,
  quickLogEvidenceActions,
}: {
  children: React.ReactNode;
  userName: string;
  role: string;
  quickLogCandidates: QuickLogCandidate[];
  quickLogEvidenceActions: QuickLogEvidenceAction[];
}) {
  return (
    <div className="md:grid md:grid-cols-[248px_1fr] min-h-screen">
      <a href="#main" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <aside className="hidden md:flex text-zinc-300 p-4 flex-col gap-1" style={{ background: "var(--ink)" }}>
        <div className="flex items-center gap-2.5 mb-6 px-2 pt-1">
          <div className="w-8 h-8 rounded-lg bg-[#ff6b00] text-[#111111] font-black text-sm grid place-items-center flex-none">P</div>
          <div>
            <div className="font-extrabold text-sm tracking-wide text-white leading-tight">PRIME UM ASCEND</div>
            <div className="text-[10px] text-zinc-500 tracking-wide">Agent → Leader → UM</div>
          </div>
        </div>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
              activeClassName="!bg-[#ff6b00]/15 !text-[#ff8a33]"
            >
              <item.icon size={17} strokeWidth={2} className="flex-none" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          href="/profile"
          className="mt-auto flex items-center gap-2.5 text-xs text-zinc-500 px-2 pt-4 pb-2.5 border-t border-white/10 hover:bg-white/5 hover:text-zinc-300 rounded-b-lg transition-colors"
          activeClassName="!bg-white/5 !text-zinc-200"
        >
          <span className="w-7 h-7 rounded-full bg-white/10 grid place-items-center flex-none">
            <User size={14} />
          </span>
          <span>
            <div className="text-zinc-200 font-medium">{userName}</div>
            <div className="capitalize">{role}</div>
          </span>
        </NavLink>
      </aside>

      <main id="main" className="p-4 md:p-8 pb-32 md:pb-8">
        {children}
      </main>

      <nav
        aria-label="เมนูมือถือ"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-zinc-500"
            activeClassName="!text-[#ff6b00]"
          >
            <item.icon size={20} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <QuickLogButton candidates={quickLogCandidates} evidenceActions={quickLogEvidenceActions} />
    </div>
  );
}
