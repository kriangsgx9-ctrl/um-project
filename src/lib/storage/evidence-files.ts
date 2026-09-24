// Evidence file storage for Quick Log's evidence flow (§4.2 flow 3). Saves to
// local disk under public/uploads so files are real and persisted (served by
// Next.js at the returned url) rather than only living in browser memory.
// S3/cloud storage is out of scope until a later sprint per v1 §31/§43 — this
// is a real, working substitute for local/single-instance deployment, not a
// mock: bytes are actually written and read back from disk.
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { MAX_EVIDENCE_FILES } from "./evidence-limits";

export interface StoredEvidenceFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// process.cwd() is NOT reliable in every hosting/dev-preview setup — it can
// diverge from the project root Next itself resolves internally for serving
// /public (confirmed by testing here: a cwd-based write landed outside the
// tree Next actually serves, 404ing back; Turbopack's own module resolution
// also turned out to use a virtualized path, not a real one, so that wasn't
// a safe anchor either). EVIDENCE_UPLOAD_DIR lets an environment pin the real
// absolute path explicitly; process.cwd() remains the default for the normal
// case (a real deployment where cwd genuinely is the project root).
function uploadRoot(): string {
  return process.env.EVIDENCE_UPLOAD_DIR ? path.resolve(process.env.EVIDENCE_UPLOAD_DIR) : path.join(process.cwd(), "public", "uploads");
}

export async function saveEvidenceFiles(userId: string, evidenceId: string, files: File[]): Promise<StoredEvidenceFile[]> {
  const valid = files.filter((f) => f.size > 0).slice(0, MAX_EVIDENCE_FILES);
  if (valid.length === 0) return [];

  for (const file of valid) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(`ไฟล์ "${file.name}" เป็นชนิดที่ไม่รองรับ (รองรับ JPG/PNG/WEBP/PDF เท่านั้น)`);
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`ไฟล์ "${file.name}" มีขนาดเกิน 8MB`);
    }
  }

  const dir = path.join(uploadRoot(), "evidence", userId);
  await mkdir(dir, { recursive: true });

  const out: StoredEvidenceFile[] = [];
  for (const [i, file] of valid.entries()) {
    const ext = path.extname(file.name).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, "");
    const filename = `${evidenceId}-${i}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    out.push({ url: `/uploads/evidence/${userId}/${filename}`, name: file.name, type: file.type, size: file.size });
  }
  return out;
}
