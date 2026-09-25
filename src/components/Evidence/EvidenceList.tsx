"use client";

// V1 §13 Evidence Portfolio: category + status filters over the user's own
// submitted evidence.
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";

export interface EvidenceRow {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  status: "draft" | "submitted" | "verified" | "revision";
  actionId: string;
  phaseKey: string;
  reviewerName: string | null;
  reviewerComment: string;
  files: { url: string; name: string; type: string }[];
}

const STATUS_LABEL: Record<EvidenceRow["status"], string> = {
  draft: "ฉบับร่าง",
  submitted: "ส่งแล้ว",
  verified: "ยืนยันแล้ว",
  revision: "ต้องแก้ไข",
};

const STATUS_STYLE: Record<EvidenceRow["status"], string> = {
  draft: "bg-zinc-50 border-zinc-200 text-zinc-500",
  submitted: "bg-amber-50 border-amber-200 text-amber-700",
  verified: "bg-green-50 border-green-200 text-green-700",
  revision: "bg-red-50 border-red-200 text-red-700",
};

export function EvidenceList({ rows }: { rows: EvidenceRow[] }) {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))), [rows]);
  const filtered = rows.filter((r) => (!category || r.category === category) && (!status || r.status === status));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="กรองตามหมวดหมู่" value={category} onChange={(e) => setCategory(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
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
        <p className="text-sm text-zinc-500">ยังไม่มีหลักฐานในตัวกรองนี้</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-xl border border-zinc-200 p-3 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/actions/${r.actionId}`} className="text-sm font-medium hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-zinc-500">
                    {r.phaseKey} · {r.category} · {r.date}
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-none ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              {r.description && <p className="text-sm text-zinc-600">{r.description}</p>}
              {r.files.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.files.map((f) =>
                    f.type.startsWith("image/") ? (
                      <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer">
                        <Image src={f.url} alt={f.name} width={56} height={56} className="w-14 h-14 object-cover rounded-lg border border-zinc-200" />
                      </a>
                    ) : (
                      <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline text-blue-700 px-2 py-1 border border-zinc-200 rounded-lg">
                        <FileText size={13} className="flex-none" />
                        {f.name}
                      </a>
                    )
                  )}
                </div>
              )}
              {(r.reviewerName || r.reviewerComment) && (
                <div className="text-xs text-zinc-500 border-t border-zinc-100 pt-1.5 mt-0.5">
                  {r.reviewerName && <span>รีวิวโดย {r.reviewerName}</span>}
                  {r.reviewerComment && <span> — {r.reviewerComment}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
