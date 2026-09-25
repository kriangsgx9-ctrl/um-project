import type { LucideIcon } from "lucide-react";

// Consistent page-header treatment (icon badge + title) reusing the same
// icon per page as its sidebar nav entry, so the icon language stays coherent
// between navigating-to and landing-on a page.
export function PageHeader({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-[#fff1e6] text-[#b84c00] grid place-items-center flex-none">
        <Icon size={19} />
      </span>
      <h1 className="text-2xl font-bold">{children}</h1>
    </div>
  );
}
