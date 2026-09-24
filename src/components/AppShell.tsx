// Minimal AppShell/Sidebar/Topbar (V1 spec §29) + mobile bottom nav (V2 §4.3).
// Full visual design (mirroring the validated prototype) lands in a later sprint.
import { QuickLogButton } from "@/components/QuickLog/QuickLogButton";
import { NavLink } from "@/components/NavLink";

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
  { href: "/passport", label: "UM Passport" },
];

// V2 §4.3: หน้าแรก · แผนที่ · [+ Quick Log, rendered separately as a floating
// button so it can sit visually centered above this bar] · ทีม · ฉัน
const MOBILE_NAV = [
  { href: "/dashboard", label: "หน้าแรก" },
  { href: "/journey", label: "แผนที่" },
  { href: "/team", label: "ทีม" },
  { href: "/profile", label: "ฉัน" },
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
    <div className="md:grid md:grid-cols-[220px_1fr] min-h-screen">
      <a href="#main" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <aside className="hidden md:flex bg-[#111111] text-zinc-200 p-4 flex-col gap-1">
        <div className="font-extrabold text-sm tracking-wide mb-6 px-2">PRIME UM ASCEND</div>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800"
              activeClassName="bg-zinc-800 text-white"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-xs text-zinc-500 px-2 pt-4 border-t border-zinc-800">
          <div className="text-zinc-300 font-medium">{userName}</div>
          <div>{role}</div>
        </div>
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
            className="flex flex-col items-center justify-center py-2 text-[11px] font-medium text-zinc-500"
            activeClassName="!text-[#ff6b00]"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <QuickLogButton candidates={quickLogCandidates} evidenceActions={quickLogEvidenceActions} />
    </div>
  );
}
