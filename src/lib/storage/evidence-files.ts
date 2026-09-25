// Evidence file storage for Quick Log's evidence flow (§4.2 flow 3).
//
// Two backends, chosen automatically at runtime:
//   - Vercel Blob, when BLOB_READ_WRITE_TOKEN is set (Vercel injects this
//     automatically once Blob storage is attached to the project — no code
//     change needed to switch environments). Required for any deployment
//     without a single persistent disk (Vercel's own functions are ephemeral
//     and files written to disk do not survive between invocations or
//     redeploys).
//   - Local disk under public/uploads, for local dev and any self-hosted
//     single-instance deployment that does have a persistent disk.
// Either way, bytes are actually written and read back — not a mock.
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

function validate(files: File[]): File[] {
  const valid = files.filter((f) => f.size > 0).slice(0, MAX_EVIDENCE_FILES);
  for (const file of valid) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(`ไฟล์ "${file.name}" เป็นชนิดที่ไม่รองรับ (รองรับ JPG/PNG/WEBP/PDF เท่านั้น)`);
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`ไฟล์ "${file.name}" มีขนาดเกิน 8MB`);
    }
  }
  return valid;
}

function fileExt(name: string): string {
  return path.extname(name).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, "");
}

async function saveToBlob(userId: string, evidenceId: string, files: File[]): Promise<StoredEvidenceFile[]> {
  const { put } = await import("@vercel/blob");
  const out: StoredEvidenceFile[] = [];
  for (const [i, file] of files.entries()) {
    const pathname = `evidence/${userId}/${evidenceId}-${i}${fileExt(file.name)}`;
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: false });
    out.push({ url: blob.url, name: file.name, type: file.type, size: file.size });
  }
  return out;
}

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

async function saveToDisk(userId: string, evidenceId: string, files: File[]): Promise<StoredEvidenceFile[]> {
  const dir = path.join(uploadRoot(), "evidence", userId);
  await mkdir(dir, { recursive: true });

  const out: StoredEvidenceFile[] = [];
  for (const [i, file] of files.entries()) {
    const filename = `${evidenceId}-${i}${fileExt(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    out.push({ url: `/uploads/evidence/${userId}/${filename}`, name: file.name, type: file.type, size: file.size });
  }
  return out;
}

export async function saveEvidenceFiles(userId: string, evidenceId: string, files: File[]): Promise<StoredEvidenceFile[]> {
  const valid = validate(files);
  if (valid.length === 0) return [];

  return process.env.BLOB_READ_WRITE_TOKEN ? saveToBlob(userId, evidenceId, valid) : saveToDisk(userId, evidenceId, valid);
}
