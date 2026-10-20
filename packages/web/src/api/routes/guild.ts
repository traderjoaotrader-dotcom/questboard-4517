import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import { profile, quests, rewards, purchases, achievements } from "../database/schema";

const types = [
  ["code1", "Programação · 1h", "Programação", 60, 12, 22, 18],
  ["code2", "Programação · 2h", "Programação", 120, 7, 46, 36],
  ["code3", "Programação · 3h", "Programação", 180, 3, 72, 54],
  ["islands", "Language Islands", "Francês", 90, 8, 34, 27],
  ["listen", "Active Listening", "Francês", 135, 12, 52, 40],
  ["cafe", "Café em Francês", "Francês", 30, 5, 4, 4],
  ["read1", "Leitura · 1h", "Livro", 60, 6, 22, 18],
  ["read2", "Leitura · 2h", "Livro", 120, 8, 46, 36],
  ["rev1", "Revisão · 1h", "Livro", 60, 5, 25, 18],
  ["rev2", "Revisão · 2h", "Livro", 120, 5, 52, 36],
  ["field15", "Field Guide · 15min", "Memory Architect", 15, 6, 6, 4],
  ["field30", "Field Guide · 30min", "Memory Architect", 30, 5, 12, 9],
  ["field60", "Field Guide · 1h", "Memory Architect", 60, 2, 25, 18],
  ["palace15", "Palácio · 15min", "Memory Architect", 15, 6, 6, 4],
  ["palace60", "Palácio · 1h", "Memory Architect", 60, 3, 25, 18],
  ["palace90", "Palácio · 1h30", "Memory Architect", 90, 1, 38, 27],
  ["palace180", "Palácio · 3h", "Memory Architect", 180, 1, 78, 54],
] as const;
const starterRewards = [
  ["Sorvete", 18],
  ["Três episódios de anime/série", 16],
  ["Doce especial", 14],
  ["Duas horas de videogame", 24],
  ["Cinema em casa", 30],
  ["Pizza ou hambúrguer", 45],
  ["Maratona de anime/série", 48],
  ["Comprar um livro", 55],
  ["Ir ao cinema", 75],
  ["Passeio especial com amigos", 80],
  ["Festival de lazer", 100],
  ["Presente especial", 130],
] as const;
const contracts = {
  forge: { title: "A Forja Ininterrupta", xp: 100, copper: 80, cadence: "week" },
  voice: { title: "A Voz de Outro Mundo", xp: 120, copper: 90, cadence: "month" },
  manuscript: { title: "O Manuscrito Renascido", xp: 200, copper: 150, cadence: "once" },
} as const;

function dateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { year: Number(get("year")), month: get("month"), day: get("day") };
}
function periods() {
  const { year, month, day } = dateParts();
  const local = new Date(Date.UTC(year, Number(month) - 1, Number(day)));
  const weekday = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - weekday);
  const weekYear = local.getUTCFullYear();
  const first = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((local.getTime() - first.getTime()) / 86400000 + 1) / 7);
  return { month: `${year}-${month}`, week: `${weekYear}-W${String(week).padStart(2, "0")}` };
}
async function ensureSeed() {
  const { month } = periods();
  await db
    .insert(profile)
    .values({ id: 1, name: "Aventureiro", xp: 0, copper: 0 })
    .onConflictDoNothing();
  const entries = types.flatMap(([type, title, category, minutes, count, xp, copper]) =>
    Array.from({ length: count }, (_, index) => ({
      id: `${month}-${type}-${String(index + 1).padStart(2, "0")}`,
      month,
      type,
      title,
      category,
      minutes,
      xp,
      copper,
    })),
  );
  await db.insert(quests).values(entries).onConflictDoNothing();
  // Stable built-in IDs avoid reseeding if the user removes or edits custom rewards.
  for (let i = 0; i < starterRewards.length; i++) {
    const [name, price] = starterRewards[i];
    await db
      .insert(rewards)
      .values({ id: i + 1, name, price, description: "", custom: false })
      .onConflictDoNothing();
  }
  return month;
}
const notFound = () => new ORPCError("NOT_FOUND", { message: "Registro não encontrado." });
const invalid = (message: string) => new ORPCError("BAD_REQUEST", { message });

export const guild = {
  dashboard: base.handler(async () => {
    const month = await ensureSeed();
    const [person] = await db.select().from(profile).where(eq(profile.id, 1));
    const current = await db.select().from(quests).where(eq(quests.month, month));
    const allRewards = await db.select().from(rewards);
    const history = await db
      .select()
      .from(purchases)
      .orderBy(sql`${purchases.id} desc`);
    const elite = await db
      .select()
      .from(achievements)
      .orderBy(sql`${achievements.completedAt} desc`);
    const completed = await db
      .select({ count: sql<number>`count(*)` })
      .from(quests)
      .where(eq(quests.status, "completed"));
    const monthly = await db
      .select({ month: quests.month, count: sql<number>`count(*)` })
      .from(quests)
      .where(eq(quests.status, "completed"))
      .groupBy(quests.month)
      .orderBy(sql`${quests.month} desc`);
    return {
      month,
      person,
      quests: current,
      rewards: allRewards,
      purchases: history,
      achievements: elite,
      completed: Number(completed[0].count),
      monthly,
      periods: periods(),
    };
  }),
  rename: base
    .input(z.object({ name: z.string().trim().min(2).max(48) }))
    .handler(async ({ input }) => {
      await db.update(profile).set({ name: input.name }).where(eq(profile.id, 1));
      return { ok: true };
    }),
  accept: base.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const { month } = periods();
    const changed = await db
      .update(quests)
      .set({ status: "active" })
      .where(and(eq(quests.id, input.id), eq(quests.month, month), eq(quests.status, "available")))
      .returning();
    if (!changed.length) throw invalid("Este contrato não está disponível.");
    return { ok: true };
  }),
  complete: base.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const { month } = periods();
    return db.transaction(async (tx) => {
      const changed = await tx
        .update(quests)
        .set({ status: "completed", completedAt: new Date().toISOString() })
        .where(and(eq(quests.id, input.id), eq(quests.month, month), eq(quests.status, "active")))
        .returning();
      if (!changed.length)
        throw invalid("Aceite o contrato antes de concluí-lo, ou ele já foi concluído.");
      await tx
        .update(profile)
        .set({
          xp: sql`${profile.xp} + ${changed[0].xp}`,
          copper: sql`${profile.copper} + ${changed[0].copper}`,
        })
        .where(eq(profile.id, 1));
      return { ok: true };
    });
  }),
  saveReward: base
    .input(
      z.object({
        id: z.number().int().optional(),
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(240),
        price: z.number().int().positive().max(100000),
      }),
    )
    .handler(async ({ input }) => {
      if (input.id) {
        const changed = await db
          .update(rewards)
          .set({ name: input.name, description: input.description, price: input.price })
          .where(and(eq(rewards.id, input.id), eq(rewards.custom, true)))
          .returning();
        if (!changed.length) throw notFound();
      } else
        await db
          .insert(rewards)
          .values({
            name: input.name,
            description: input.description,
            price: input.price,
            custom: true,
          });
      return { ok: true };
    }),
  deleteReward: base.input(z.object({ id: z.number().int() })).handler(async ({ input }) => {
    const removed = await db
      .delete(rewards)
      .where(and(eq(rewards.id, input.id), eq(rewards.custom, true)))
      .returning();
    if (!removed.length) throw notFound();
    return { ok: true };
  }),
  redeem: base.input(z.object({ id: z.number().int() })).handler(async ({ input }) => {
    return db.transaction(async (tx) => {
      const [reward] = await tx.select().from(rewards).where(eq(rewards.id, input.id));
      if (!reward) throw notFound();
      const changed = await tx
        .update(profile)
        .set({ copper: sql`${profile.copper} - ${reward.price}` })
        .where(and(eq(profile.id, 1), gte(profile.copper, reward.price)))
        .returning();
      if (!changed.length) throw invalid("Cobres insuficientes para este resgate.");
      await tx
        .insert(purchases)
        .values({
          rewardId: reward.id,
          name: reward.name,
          price: reward.price,
          purchasedAt: new Date().toISOString(),
        });
      return { ok: true };
    });
  }),
  completeElite: base
    .input(z.object({ contract: z.enum(["forge", "voice", "manuscript"]) }))
    .handler(async ({ input }) => {
      const contract = contracts[input.contract];
      const p = periods();
      const period =
        contract.cadence === "week" ? p.week : contract.cadence === "month" ? p.month : "once";
      const id = `${input.contract}-${period}`;
      return db.transaction(async (tx) => {
        const created = await tx
          .insert(achievements)
          .values({
            id,
            contract: input.contract,
            period,
            xp: contract.xp,
            copper: contract.copper,
            completedAt: new Date().toISOString(),
          })
          .onConflictDoNothing()
          .returning();
        if (!created.length)
          throw invalid("Este contrato Elite já foi recompensado neste período.");
        await tx
          .update(profile)
          .set({
            xp: sql`${profile.xp} + ${contract.xp}`,
            copper: sql`${profile.copper} + ${contract.copper}`,
          })
          .where(eq(profile.id, 1));
        return { ok: true };
      });
    }),
};
