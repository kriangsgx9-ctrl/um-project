import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { DONE, actionsFor, dueDate, isOverdue, phaseById, ua, userById } from "@/lib/domain/actions";
import { diffDays, today } from "@/lib/domain/dates";
import { ActionsList, type ActionRow } from "@/components/Actions/ActionsList";

export default async function ActionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const store = await loadStoreForUser(prisma, userId);
  const user = userById(store, userId)!;

  const rows: ActionRow[] = actionsFor(store, userId)
    .map((a) => {
      const phase = phaseById(store, a.phaseId);
      const status = ua(store, userId, a.id).status;
      const due = dueDate(user, a);
      return {
        id: a.id,
        title: a.title,
        category: a.category,
        priority: a.priority,
        status,
        due,
        overdue: isOverdue(store, user, a),
        phaseKey: phase?.key ?? "-",
        done: DONE.has(status),
        daysUntilDue: diffDays(due, today()),
      };
    })
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Actions</h1>
      <ActionsList rows={rows} />
    </div>
  );
}
