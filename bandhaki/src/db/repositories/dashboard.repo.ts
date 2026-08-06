import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import { bandhaki, customers, payments } from "../schema";
import type { DashboardData } from "../../types";

export interface DashboardTransaction {
  _id: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  loanNumber: string;
  principalAmount: number;
  status: string;
  customer?: { _id: string; name: string; phone?: string };
  interestComponent: number;
  principalComponent: number;
  createdAt: string;
}

export async function computeDashboardLocal(): Promise<DashboardData> {
  const [totalCustomers, activeLoans] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(isNull(customers.deletedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bandhaki)
      .where(
        and(
          isNull(bandhaki.deletedAt),
          inArray(bandhaki.status, ["active", "defaulted"])
        )
      ),
  ]);

  const recent = await db
    .select({ payments, bandhaki, customers })
    .from(payments)
    .leftJoin(bandhaki, eq(payments.bandhakiLocalId, bandhaki.localId))
    .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
    .orderBy(desc(payments.createdAt))
    .limit(10);

  const recentTransactions: DashboardTransaction[] = recent
    .filter((r) => r.bandhaki && !r.bandhaki.deletedAt)
    .slice(0, 5)
    .map((r) => ({
      _id: r.payments.localId,
      loanId: r.bandhaki!.localId,
      amount: r.payments.amount,
      paymentDate: r.payments.paymentDate.toISOString(),
      paymentMethod: r.payments.paymentMethod,
      loanNumber: r.bandhaki!.loanNumber ?? "Pending…",
      principalAmount: r.bandhaki!.principalAmount,
      status: r.bandhaki!.status,
      customer: r.customers
        ? {
            _id: r.customers.localId,
            name: r.customers.name,
            phone: r.customers.phone ?? undefined,
          }
        : undefined,
      interestComponent: r.payments.interestComponent,
      principalComponent: r.payments.principalComponent,
      createdAt: r.payments.createdAt.toISOString(),
    }));

  return {
    totalCustomers: totalCustomers[0]?.count ?? 0,
    activeLoans: activeLoans[0]?.count ?? 0,
    recentTransactions: recentTransactions as any,
  };
}
