"use client";

// V2 §4.2 Quick Log: a floating "+" button opening a bottom-sheet with 4 flows,
// each ≤2 taps (not counting typing) and each backed by a real server action
// that persists data and awards real XP — see src/app/(app)/quick-log/actions.ts.
import { useState, useTransition } from "react";
import { BarChart3, Camera, Handshake, Paperclip, Phone, Plus, X } from "lucide-react";
import {
  type ContactOutcome,
  type KpiMetric,
  logCandidateContactAction,
  logCoachingAction,
  logKpiAction,
  submitEvidenceAction,
} from "@/app/(app)/quick-log/actions";
import { MAX_EVIDENCE_FILES } from "@/lib/storage/evidence-limits";

interface Candidate {
  id: string;
  name: string;
}
interface EvidenceAction {
  actionId: string;
  title: string;
}

type Tab = "menu" | "contact" | "kpi" | "evidence" | "coaching";

const KPI_LABEL: Record<KpiMetric, string> = { activity: "Activity", appointments: "Appointment", cases: "Case" };

export function QuickLogButton({ candidates, evidenceActions }: { candidates: Candidate[]; evidenceActions: EvidenceAction[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("menu");
  const [pending, startTransition] = useTransition();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [topic, setTopic] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [kpiCounts, setKpiCounts] = useState<Record<KpiMetric, number>>({ activity: 0, appointments: 0, cases: 0 });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setTab("menu");
    setSelectedCandidate(null);
    setSelectedAction(null);
    setNote("");
    setTopic("");
    setFollowUp("");
    setKpiCounts({ activity: 0, appointments: 0, cases: 0 });
    setEvidenceFiles([]);
    setEvidenceError(null);
  }

  function doContact(outcome: ContactOutcome) {
    if (!selectedCandidate) return;
    startTransition(async () => {
      await logCandidateContactAction(selectedCandidate, outcome);
      close();
    });
  }

  function saveKpi() {
    startTransition(async () => {
      const entries = Object.entries(kpiCounts) as [KpiMetric, number][];
      for (const [metric, count] of entries) {
        if (count !== 0) await logKpiAction(metric, count);
      }
      close();
    });
  }

  function saveEvidence() {
    if (!selectedAction) return;
    setEvidenceError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        evidenceFiles.forEach((f) => formData.append("files", f));
        await submitEvidenceAction(selectedAction, note, formData);
        close();
      } catch (e) {
        setEvidenceError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  function saveCoaching() {
    if (!topic) return;
    startTransition(async () => {
      await logCoachingAction(topic, note, followUp);
      close();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick Log"
        className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-40 w-14 h-14 rounded-full bg-[#ff6b00] text-[#111111] shadow-lg grid place-items-center transition-transform hover:scale-105"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={close}>
          <div
            className="relative bg-white text-zinc-900 w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={close} aria-label="ปิด" className="absolute right-4 top-4 w-8 h-8 rounded-full grid place-items-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
              <X size={18} />
            </button>

            {tab === "menu" && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTab("contact")} className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-[#ff6b00]/40 hover:bg-[#fff8f2]">
                  <div className="w-9 h-9 rounded-lg bg-[#fff1e6] text-[#b84c00] grid place-items-center">
                    <Phone size={18} />
                  </div>
                  <div className="font-semibold text-sm mt-2">บันทึกการติดต่อผู้สมัคร</div>
                </button>
                <button onClick={() => setTab("kpi")} className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-[#ff6b00]/40 hover:bg-[#fff8f2]">
                  <div className="w-9 h-9 rounded-lg bg-[#fff1e6] text-[#b84c00] grid place-items-center">
                    <BarChart3 size={18} />
                  </div>
                  <div className="font-semibold text-sm mt-2">บันทึก KPI วันนี้</div>
                </button>
                <button onClick={() => setTab("evidence")} className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-[#ff6b00]/40 hover:bg-[#fff8f2]">
                  <div className="w-9 h-9 rounded-lg bg-[#fff1e6] text-[#b84c00] grid place-items-center">
                    <Camera size={18} />
                  </div>
                  <div className="font-semibold text-sm mt-2">ส่งหลักฐาน</div>
                </button>
                <button onClick={() => setTab("coaching")} className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-[#ff6b00]/40 hover:bg-[#fff8f2]">
                  <div className="w-9 h-9 rounded-lg bg-[#fff1e6] text-[#b84c00] grid place-items-center">
                    <Handshake size={18} />
                  </div>
                  <div className="font-semibold text-sm mt-2">บันทึกโค้ชชิ่ง/1-on-1</div>
                </button>
              </div>
            )}

            {tab === "contact" && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold">เลือกผู้สมัคร</h3>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCandidate(c.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm ${
                        selectedCandidate === c.id ? "border-[#ff6b00] bg-[#fff1e6]" : "border-zinc-200"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {candidates.length === 0 && <p className="text-sm text-zinc-500">ยังไม่มีผู้สมัครที่ active</p>}
                </div>
                {selectedCandidate && (
                  <div className="flex gap-2 flex-wrap">
                    <button disabled={pending} onClick={() => doContact("contacted")} className="px-3 py-2 rounded-full bg-[#111111] text-white text-sm">
                      ติดต่อได้
                    </button>
                    <button disabled={pending} onClick={() => doContact("interview")} className="px-3 py-2 rounded-full bg-[#111111] text-white text-sm">
                      นัดสัมภาษณ์
                    </button>
                    <button disabled={pending} onClick={() => doContact("unavailable")} className="px-3 py-2 rounded-full border border-zinc-300 text-sm">
                      ไม่ว่าง
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "kpi" && (
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold">บันทึก KPI วันนี้</h3>
                {(Object.keys(KPI_LABEL) as KpiMetric[]).map((metric) => (
                  <div key={metric} className="flex items-center justify-between">
                    <span className="text-sm">{KPI_LABEL[metric]}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setKpiCounts((c) => ({ ...c, [metric]: Math.max(0, c[metric] - 1) }))}
                        aria-label={`ลด ${KPI_LABEL[metric]}`}
                        className="w-8 h-8 rounded-full border border-zinc-300"
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums" aria-live="polite">
                        {kpiCounts[metric]}
                      </span>
                      <button
                        onClick={() => setKpiCounts((c) => ({ ...c, [metric]: c[metric] + 1 }))}
                        aria-label={`เพิ่ม ${KPI_LABEL[metric]}`}
                        className="w-8 h-8 rounded-full border border-zinc-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <button disabled={pending} onClick={saveKpi} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2">
                  บันทึก
                </button>
              </div>
            )}

            {tab === "evidence" && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold">ส่งหลักฐาน</h3>
                <p className="text-xs text-zinc-400">แนบรูปภาพหรือ PDF ได้สูงสุด {MAX_EVIDENCE_FILES} ไฟล์ (ไม่เกิน 8MB ต่อไฟล์)</p>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {evidenceActions.map((a) => (
                    <button
                      key={a.actionId}
                      onClick={() => setSelectedAction(a.actionId)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm ${
                        selectedAction === a.actionId ? "border-[#ff6b00] bg-[#fff1e6]" : "border-zinc-200"
                      }`}
                    >
                      {a.title}
                    </button>
                  ))}
                  {evidenceActions.length === 0 && <p className="text-sm text-zinc-500">ไม่มีงานที่ต้องส่งหลักฐานตอนนี้</p>}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="สรุปผลลัพธ์"
                  placeholder="สรุปผลลัพธ์สั้น ๆ"
                  rows={3}
                  className="border border-zinc-300 rounded-lg p-2 text-sm"
                />
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  aria-label="แนบไฟล์หลักฐาน (รูปภาพหรือ PDF)"
                  onChange={(e) => setEvidenceFiles(Array.from(e.target.files ?? []).slice(0, MAX_EVIDENCE_FILES))}
                  className="text-xs"
                />
                {evidenceFiles.length > 0 && (
                  <ul className="text-xs text-zinc-500 flex flex-col gap-1">
                    {evidenceFiles.map((f) => (
                      <li key={f.name} className="flex items-center gap-1.5">
                        <Paperclip size={12} className="flex-none" />
                        {f.name} ({Math.ceil(f.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                )}
                {evidenceError && (
                  <p role="alert" className="text-xs text-red-600">
                    {evidenceError}
                  </p>
                )}
                <button
                  disabled={pending || !selectedAction}
                  onClick={saveEvidence}
                  className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-40"
                >
                  ส่งให้โค้ชดู
                </button>
              </div>
            )}

            {tab === "coaching" && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold">บันทึกโค้ชชิ่ง/1-on-1</h3>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  aria-label="หัวข้อ"
                  placeholder="หัวข้อ"
                  className="border border-zinc-300 rounded-lg p-2 text-sm"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="สิ่งที่คุยกัน / action plan"
                  placeholder="สิ่งที่คุยกัน / action plan"
                  rows={3}
                  className="border border-zinc-300 rounded-lg p-2 text-sm"
                />
                <input
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  aria-label="วันที่ติดตามผล"
                  className="border border-zinc-300 rounded-lg p-2 text-sm"
                />
                <button
                  disabled={pending || !topic}
                  onClick={saveCoaching}
                  className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-40"
                >
                  บันทึก
                </button>
              </div>
            )}

            {tab !== "menu" && (
              <button onClick={() => setTab("menu")} className="mt-4 text-xs text-zinc-500 block">
                ← กลับ
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
