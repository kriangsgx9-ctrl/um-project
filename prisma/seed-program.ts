// Seeds ONLY the static program content (game settings, phases/gates,
// competencies, actions) — no demo Cohort, Users, Candidates, KPIs, Evidence,
// Coaching, or TeamChallenge rows. This is the script to run against a real
// production database: the content here is genuinely program-wide and not
// specific to any person, unlike prisma/seed.ts (which also creates the demo
// cohort and its fake users/activity — dev/staging only).
//
// Run: npm run db:seed:program
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildDemoSeed } from "../src/lib/domain/seed";
import { DEFAULT_CAPS } from "../src/lib/game/caps";
import { DEFAULT_LEVEL_CURVE } from "../src/lib/game/level";
import { DEFAULT_XP_TABLE } from "../src/lib/game/xp-table";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const toJson = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));

async function main() {
  // buildDemoSeed() also returns demo users/candidates/etc — we only take the
  // program-structure parts of its `store` (phases/competencies/actions),
  // which are seed-data-source-of-truth regardless of which people use them.
  const { store } = buildDemoSeed();

  await prisma.gameSettings.upsert({
    where: { id: "default" },
    create: { id: "default", xpTable: toJson(DEFAULT_XP_TABLE), caps: toJson(DEFAULT_CAPS), levelCurve: toJson(DEFAULT_LEVEL_CURVE), leaderboardOn: true, kudosOn: true },
    update: { xpTable: toJson(DEFAULT_XP_TABLE), caps: toJson(DEFAULT_CAPS), levelCurve: toJson(DEFAULT_LEVEL_CURVE) },
  });

  for (const p of store.phases) {
    await prisma.phase.upsert({
      where: { id: p.id },
      create: { id: p.id, no: p.no, key: p.key, th: p.th, startDay: p.startDay, endDay: p.endDay, objective: p.objective, mission: p.mission },
      update: {},
    });
    const gate = await prisma.gate.upsert({
      where: { phaseId: p.id },
      create: { phaseId: p.id, name: p.gate.name, description: "" },
      update: {},
    });
    for (const [i, m] of p.gate.metrics.entries()) {
      await prisma.gateRequirement.upsert({
        where: { id: m.id },
        create: { id: m.id, gateId: gate.id, title: m.title, type: "metric", metric: m.metric, min: m.min, order: i },
        update: {},
      });
    }
  }

  for (const c of store.competencies) {
    await prisma.competency.upsert({
      where: { id: c.id },
      create: { id: c.id, category: c.category, name: c.name, description: c.description ?? "" },
      update: {},
    });
  }

  for (const a of store.actions) {
    // Skip one-off Coach Quests (assignedTo set) — those belong to a specific
    // person's demo data, never program-wide template content.
    if (a.assignedTo) continue;
    await prisma.action.upsert({
      where: { id: a.id },
      create: {
        id: a.id, phaseId: a.phaseId, title: a.title, description: a.desc, category: a.category,
        priority: a.priority, required: a.required, evidence: a.evidence, evidenceHint: a.evidenceHint,
        dueOffset: a.dueOffset, why: a.why, steps: a.steps, success: a.success, competencyId: a.competencyId,
        questType: a.questType ?? "main", bonusXp: a.bonusXp ?? null, assignedTo: null,
      },
      update: {},
    });
  }

  console.log(`Seeded program content: ${store.phases.length} phases, ${store.competencies.length} competencies, ${store.actions.filter((a) => !a.assignedTo).length} actions. No users/cohorts/demo data created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
