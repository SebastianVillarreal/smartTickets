import { Injectable } from '@nestjs/common';
import { Priority, Prisma, TicketStatus, TicketType } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

const SLA_DAYS: Record<Priority, number> = {
  CRITICAL: 2,
  HIGH: 5,
  MEDIUM: 10,
  LOW: 20,
};

function diffHours(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / 36e5;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid]! : (arr[mid - 1]! + arr[mid]!) / 2;
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(query: DashboardQueryDto) {
    const now = new Date();
    const to = query.to ? new Date(query.to) : now;
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 90 * 24 * 3600 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const baseWhere: Prisma.TicketWhereInput = {
      createdAt: { gte: from, lte: to },
      ...(query.systemId ? { systemId: query.systemId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const openStatuses = { notIn: [TicketStatus.DONE, TicketStatus.CANCELLED] };

    const [tickets, systems] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where: {
          ...baseWhere,
          OR: [
            { createdAt: { gte: from, lte: to } },
            { resolvedAt: { gte: from, lte: to } },
            { status: openStatuses },
          ],
        },
        include: { system: true, assignedToUser: { select: { id: true, name: true } } },
      }),
      this.prisma.system.findMany({ select: { id: true, key: true, name: true } }),
    ]);

    const kpiOpenTickets = tickets.filter((t) => ![TicketStatus.DONE, TicketStatus.CANCELLED].includes(t.status)).length;
    const kpiOpenBugs = tickets.filter((t) => t.type === TicketType.BUG && ![TicketStatus.DONE, TicketStatus.CANCELLED].includes(t.status)).length;
    const kpiPendingFeatures = tickets.filter((t) => t.type === TicketType.FEATURE && t.status !== TicketStatus.DONE && t.status !== TicketStatus.CANCELLED).length;

    const resolved30 = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= thirtyDaysAgo);
    const resolutionDurations = resolved30
      .filter((t) => t.resolvedAt)
      .map((t) => diffHours(t.resolvedAt!, t.createdAt));
    const avgResolutionHours30d = resolutionDurations.length
      ? resolutionDurations.reduce((s, n) => s + n, 0) / resolutionDurations.length
      : 0;

    const slaEligible = resolved30.filter((t) => t.resolvedAt);
    const slaHitCount = slaEligible.filter((t) => {
      const hours = diffHours(t.resolvedAt!, t.createdAt);
      return hours <= SLA_DAYS[t.priority] * 24;
    }).length;
    const slaPercent = slaEligible.length ? (slaHitCount / slaEligible.length) * 100 : 0;

    const weeklyTrend = Array.from({ length: 12 }).map((_, idx) => {
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - (11 - idx) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const created = tickets.filter((t) => t.createdAt >= weekStart && t.createdAt <= weekEnd).length;
      const resolved = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= weekStart && t.resolvedAt <= weekEnd).length;
      return {
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        created,
        resolved,
      };
    });

    const statusDistribution = Object.values(TicketStatus).map((status) => ({
      status,
      bugs: tickets.filter((t) => t.status === status && t.type === TicketType.BUG).length,
      features: tickets.filter((t) => t.status === status && t.type === TicketType.FEATURE).length,
    }));

    const topSystemsByOpenBugs = systems
      .map((s) => ({
        systemId: s.id,
        key: s.key,
        name: s.name,
        openBugs: tickets.filter(
          (t) =>
            t.systemId === s.id &&
            t.type === TicketType.BUG &&
            ![TicketStatus.DONE, TicketStatus.CANCELLED].includes(t.status),
        ).length,
      }))
      .sort((a, b) => b.openBugs - a.openBugs)
      .slice(0, 5);

    const resolutionByPriority = Object.values(Priority).map((priority) => {
      const rows = tickets.filter((t) => t.priority === priority && t.resolvedAt);
      const createdToResolved = rows.map((t) => diffHours(t.resolvedAt!, t.createdAt));
      const inProgress = rows
        .filter((t) => t.startedAt)
        .map((t) => diffHours(t.resolvedAt!, t.startedAt!));
      return {
        priority,
        avgResolutionHours: createdToResolved.length
          ? createdToResolved.reduce((s, n) => s + n, 0) / createdToResolved.length
          : 0,
        medianResolutionHours: median(createdToResolved),
        avgInProgressHours: inProgress.length ? inProgress.reduce((s, n) => s + n, 0) / inProgress.length : 0,
      };
    });

    const criticalOpenTickets = tickets
      .filter((t) => t.priority === Priority.CRITICAL && ![TicketStatus.DONE, TicketStatus.CANCELLED].includes(t.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        code: t.code,
        title: t.title,
        type: t.type,
        system: t.system,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        assignedTo: t.assignedToUser,
        ageDays: Math.floor((now.getTime() - t.createdAt.getTime()) / (24 * 3600 * 1000)),
      }));

    const topPendingFeatures = tickets
      .filter((t) => t.type === TicketType.FEATURE && ![TicketStatus.DONE, TicketStatus.CANCELLED].includes(t.status))
      .sort((a, b) => {
        const pRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[b.priority] - { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[a.priority];
        if (pRank !== 0) return pRank;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        code: t.code,
        title: t.title,
        system: t.system,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        ageDays: Math.floor((now.getTime() - t.createdAt.getTime()) / (24 * 3600 * 1000)),
      }));

    return {
      filtersApplied: { from, to, systemId: query.systemId ?? null, type: query.type ?? 'ALL' },
      kpis: {
        openTickets: kpiOpenTickets,
        openBugs: kpiOpenBugs,
        pendingFeatures: kpiPendingFeatures,
        avgResolutionHours30d: Number(avgResolutionHours30d.toFixed(2)),
        slaResolvedPercent30d: Number(slaPercent.toFixed(2)),
      },
      charts: {
        weeklyTrend,
        statusDistribution,
        topSystemsByOpenBugs,
        resolutionByPriority,
      },
      executiveTables: {
        criticalOpenTickets,
        topPendingFeatures,
      },
      meta: {
        slaDays: SLA_DAYS,
      },
    };
  }
}
