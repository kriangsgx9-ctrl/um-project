// Creates real user accounts (and optionally a real Cohort) from a JSON file
// — the app has no signup/invite UI yet, so this is the only way to onboard
// real employees. Safe to re-run: upserts by email, never duplicates.
//
// Usage: npm run db:create-users -- path/to/real-users.json
// (defaults to prisma/real-users.json if no path given)
//
// Input file shape:
// {
//   "cohort": { "id": "co-2026-01", "name": "รุ่นที่ 1", "startDate": "2026-02-01", "endDate": "2026-08-01" },
//   "users": [
//     { "name": "...", "email": "...", "role": "al" },
//     { "name": "...", "email": "...", "role": "coach" },
//     { "name": "...", "email": "...", "role": "um", "coachEmail": "...", "alEmail": "...", "startDate": "2026-02-01" }
//   ]
// }
//
// Prints a name/email/role/temporary-password table at the end — that is the
// ONLY place the plaintext passwords are ever shown (not logged anywhere
// else, not stored anywhere but the bcrypt hash in the database). Distribute
// them to each person over a secure channel and have them treat it as a
// temporary password — there is no self-service change/reset flow yet, so
// losing this output means an admin has to re-run this script for that user.
import "dotenv/config";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { PrismaClient, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface InputUser {
  name: string;
  email: string;
  role: Role;
  nick?: string;
  phone?: string;
  code?: string;
  coachEmail?: string;
  alEmail?: string;
  startDate?: string;
}
interface InputFile {
  cohort?: { id: string; name: string; startDate: string; endDate: string };
  users: InputUser[];
}

function genPassword(): string {
  // 10 chars from a set that avoids visually-ambiguous characters (0/O, 1/l/I).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(10), (b) => alphabet[b % alphabet.length]).join("");
}

async function main() {
  const filePath = process.argv[2] ?? "prisma/real-users.json";
  const input: InputFile = JSON.parse(readFileSync(filePath, "utf-8"));

  if (!input.users?.length) throw new Error("no users in input file");

  if (input.cohort) {
    await prisma.cohort.upsert({
      where: { id: input.cohort.id },
      create: { id: input.cohort.id, name: input.cohort.name, startDate: new Date(input.cohort.startDate), endDate: new Date(input.cohort.endDate), status: "active" },
      update: { name: input.cohort.name, startDate: new Date(input.cohort.startDate), endDate: new Date(input.cohort.endDate) },
    });
  }

  const results: { name: string; email: string; role: string; password: string }[] = [];

  for (const u of input.users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    const password = existing ? null : genPassword();
    const passwordHash = password ? await bcrypt.hash(password, 10) : existing!.passwordHash;

    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name, email: u.email, role: u.role, nick: u.nick ?? null, phone: u.phone ?? null, code: u.code ?? null,
        passwordHash, cohortId: input.cohort?.id ?? null,
        startDate: u.startDate ? new Date(u.startDate) : new Date(), currentPhase: 1,
      },
      update: { name: u.name, role: u.role, nick: u.nick ?? null, phone: u.phone ?? null, cohortId: input.cohort?.id ?? undefined },
    });

    results.push({ name: u.name, email: u.email, role: u.role, password: password ?? "(already existed — password unchanged)" });
  }

  // second pass: resolve coachEmail/alEmail to ids now that every user exists
  for (const u of input.users) {
    if (!u.coachEmail && !u.alEmail) continue;
    const coach = u.coachEmail ? await prisma.user.findUnique({ where: { email: u.coachEmail } }) : null;
    const al = u.alEmail ? await prisma.user.findUnique({ where: { email: u.alEmail } }) : null;
    await prisma.user.update({ where: { email: u.email }, data: { coachId: coach?.id ?? null, alId: al?.id ?? null } });
  }

  console.log(`\nCreated/updated ${results.length} users.\n`);
  console.log("name\temail\trole\ttemporary password");
  for (const r of results) console.log(`${r.name}\t${r.email}\t${r.role}\t${r.password}`);
  console.log("\nDistribute these securely — this is the only time the plaintext password is shown.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
