"use client";

// V1 §10 Action Center: 4 due-date tabs + Phase/Category/Priority/Status
// filters. "Due date" as its own filter (also named in §10) is already
// covered by the tabs, which partition on exactly that dimension.
import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Eye, PenLine, RotateCcw, type LucideIcon } from "lucide-react";

export interface ActionRow {
  id: string;
  title: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  due: string;
  overdue: boolean;
  phaseKey: string;
  done: boolean;
  daysUntilDue: number;
}

type Tab = "today" | "week" | "upcoming" | "completed";

const TAB_LABEL: Record<Tab, string> = { today: "วันนี้", week: "สัปดาห์นี้", upcoming: "ถัดไป", completed: "เสร็จแล้ว" };

const PRIORITY_STYLE: Record<ActionRow["priority"], string> = {
  critical: "bg-red-50 border-red-200 text-red-700",
  high: "bg-amber-50 border-amber-200 text-amber-700",
  medium: "bg-blue-50 border-blue-200 text-blue-700",
  low: "bg-zinc-50 border-zinc-200 text-zinc-500",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  submitted: "ส่งแล้ว",
  waiting_review: "รอรีวิว",
  verified: "ยืนยันแล้ว",
  needs_revision: "ต้องแก้ไข",
  completed: "เสร็จแล้ว",
};

const STATUS_ICON: Record<string, LucideIcon> = {
  not_started: Circle,
  in_progress: PenLine,
  submitted: Eye,
  waiting_review: Eye,
  verified: CheckCircle2,
  needs_revision: RotateCcw,
  completed: CheckCircle2,
};

const STATUS_ICON_STYLE: Record<string, string> = {
  not_started: "text-zinc-400",
  in_progress: "text-blue-600",
  submitted: "text-amber-600",
  waiting_review: "text-amber-600",
  verified: "text-green-600",
  needs_revision: "text-red-600",
  completed: "text-green-600",
};

export function ActionsList({ rows }: { rows: ActionRow[] }) {
  const [tab, setTab] = useState<Tab>("today");
  const [phase, setPhase] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const phases = useMemo(() => Array.from(new Set(rows.map((r) => r.phaseKey))), [rows]);
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))), [rows]);

  const inTab = (r: ActionRow): boolean => {
    if (tab === "completed") return r.done;
    if (r.done) return false;
    if (tab === "today") return r.overdue || r.daysUntilDue <= 0;
    if (tab === "week") return r.daysUntilDue > 0 && r.daysUntilDue <= 7;
    return r.daysUntilDue > 7;
  };

  const filtered = rows.filter(
    (r) =>
      inTab(r) &&
      (!phase || r.phaseKey === phase) &&
      (!category || r.category === category) &&
      (!priority || r.priority === priority) &&
      (!status || r.status === status)
  );

  const counts: Record<Tab, number> = {
    today: rows.filter((r) => !r.done && (r.overdue || r.daysUntilDue <= 0)).length,
    week: rows.filter((r) => !r.done && r.daysUntilDue > 0 && r.daysUntilDue <= 7).length,
    upcoming: rows.filter((r) => !r.done && r.daysUntilDue > 7).length,
    completed: rows.filter((r) => r.done).length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="ตัวกรองตามกำหนดส่ง">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
              tab === t ? "bg-[#ff6b00] text-[#111111] border-[#ff6b00]" : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select aria-label="กรองตามเฟส" value={phase} onChange={(e) => setPhase(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
          <option value="">ทุกเฟส</option>
          {phases.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select aria-label="กรองตามหมวดหมู่" value={category} onChange={(e) => setCategory(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="กรองตามความสำคัญ" value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
          <option value="">ทุกความสำคัญ</option>
          {(["critical", "high", "medium", "low"] as const).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select aria-label="กรองตามสถานะ" value={status} onChange={(e) => setStatus(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">ไม่มี Action ในตัวกรองนี้</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((r) => {
            const StatusIcon = STATUS_ICON[r.status] ?? Circle;
            return (
              <li key={r.id}>
                <Link
                  href={`/actions/${r.id}`}
                  className="rounded-xl border border-zinc-200 p-3 flex items-center gap-3 hover:border-zinc-300 hover:shadow-card transition-shadow block"
                >
                  <StatusIcon size={18} className={`flex-none ${STATUS_ICON_STYLE[r.status] ?? "text-zinc-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {r.phaseKey} · {r.category} · กำหนดส่ง {r.due}
                      {r.overdue && <span className="text-red-600 font-medium"> · เลยกำหนด</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-none">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span>
                    <span className="text-[11px] text-zinc-500">{STATUS_LABEL[r.status] ?? r.status}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
