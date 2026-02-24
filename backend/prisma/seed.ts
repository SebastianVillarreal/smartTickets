import { PrismaClient, Role, TicketStatus, TicketType, Priority, Severity, Environment } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const systemsSeed = [
  { key: 'CRM', name: 'CRM Comercial', description: 'Gestión de clientes y pipeline', ownerTeam: 'SalesOps' },
  { key: 'ERP', name: 'ERP Finanzas', description: 'Órdenes, facturación y pagos', ownerTeam: 'FinOps' },
  { key: 'APP', name: 'App Móvil', description: 'Canal móvil para clientes', ownerTeam: 'Mobile' },
  { key: 'WEB', name: 'Portal Web', description: 'Portal público y área privada', ownerTeam: 'Web Platform' }
];

const usersSeed = [
  { name: 'Admin Demo', email: 'admin@demo.com', role: Role.ADMIN },
  { name: 'Manager Demo', email: 'manager@demo.com', role: Role.MANAGER },
  { name: 'Developer Demo', email: 'dev@demo.com', role: Role.DEVELOPER },
  { name: 'Reporter Demo', email: 'reporter@demo.com', role: Role.REPORTER }
];

const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL] as const;
const severities = [Severity.S1, Severity.S2, Severity.S3, Severity.S4] as const;
const environments = [Environment.DEV, Environment.QA, Environment.PROD] as const;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.system.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const users = await Promise.all(
    usersSeed.map((u) =>
      prisma.user.create({
        data: { ...u, passwordHash }
      }),
    ),
  );

  const systems = await Promise.all(
    systemsSeed.map((s) =>
      prisma.system.create({
        data: s
      }),
    ),
  );

  let bugCounter = 1;
  let featCounter = 1;

  for (let i = 0; i < 80; i += 1) {
    const isBug = i < 54 || Math.random() > 0.45;
    const type = isBug ? TicketType.BUG : TicketType.FEATURE;
    const priority = rand(priorities);
    const system = rand(systems);
    const createdBy = users.find((u) => u.role === Role.REPORTER) ?? users[0];
    const assignedTo = Math.random() > 0.2 ? users.find((u) => u.role === Role.DEVELOPER) : null;
    const createdAt = addHours(daysAgo(Math.floor(Math.random() * 84)), Math.floor(Math.random() * 12));
    const statusRoll = Math.random();

    let status: TicketStatus = TicketStatus.NEW;
    if (statusRoll > 0.88) status = TicketStatus.BLOCKED;
    else if (statusRoll > 0.74) status = TicketStatus.IN_PROGRESS;
    else if (statusRoll > 0.62) status = TicketStatus.READY_FOR_QA;
    else if (statusRoll > 0.30) status = TicketStatus.DONE;
    else if (statusRoll > 0.22) status = TicketStatus.TRIAGED;
    else status = TicketStatus.NEW;

    const triagedAt = status !== TicketStatus.NEW ? addHours(createdAt, 4 + Math.floor(Math.random() * 48)) : null;
    const startedAt =
      [TicketStatus.IN_PROGRESS, TicketStatus.BLOCKED, TicketStatus.READY_FOR_QA, TicketStatus.DONE].includes(status) && triagedAt
        ? addHours(triagedAt, 4 + Math.floor(Math.random() * 72))
        : null;
    const resolvedAt =
      [TicketStatus.READY_FOR_QA, TicketStatus.DONE].includes(status) && startedAt
        ? addHours(startedAt, 6 + Math.floor(Math.random() * 160))
        : null;
    const closedAt = status === TicketStatus.DONE && resolvedAt ? addHours(resolvedAt, 4 + Math.floor(Math.random() * 48)) : null;

    const code = isBug ? `BUG-${String(bugCounter++).padStart(6, '0')}` : `FEAT-${String(featCounter++).padStart(6, '0')}`;
    const title = isBug
      ? `Error en ${system.key}: ${['login', 'filtros', 'exportación', 'sincronización', 'notificaciones'][i % 5]}`
      : `Feature ${system.key}: ${['panel ejecutivo', 'mejora de búsqueda', 'workflow', 'integración', 'reportes'][i % 5]}`;

    const ticket = await prisma.ticket.create({
      data: {
        code,
        type,
        title,
        description: isBug
          ? 'Se detecta comportamiento inesperado con impacto visible en usuarios finales.'
          : 'Solicitud de mejora funcional priorizada por negocio.',
        priority,
        severity: isBug ? rand(severities) : null,
        status,
        systemId: system.id,
        createdByUserId: createdBy.id,
        assignedToUserId: assignedTo?.id ?? null,
        createdAt,
        updatedAt: closedAt ?? resolvedAt ?? startedAt ?? triagedAt ?? createdAt,
        triagedAt,
        startedAt,
        resolvedAt,
        closedAt,
        tags: isBug ? ['incident', system.key.toLowerCase()] : ['feature', 'roadmap', system.key.toLowerCase()],
        environment: rand(environments),
        reproducible: isBug ? Math.random() > 0.15 : true,
        stepsToReproduce: isBug ? '1. Ingresar al módulo\n2. Ejecutar acción\n3. Validar error' : null,
        expectedResult: isBug ? 'La acción debe completarse correctamente.' : null,
        actualResult: isBug ? 'Se presenta error o resultado inconsistente.' : null,
        rootCause: status === TicketStatus.DONE && isBug ? 'Condición no controlada en validación de backend.' : null,
        resolutionSummary: status === TicketStatus.DONE ? 'Se corrige lógica y se despliega a QA/PROD.' : null,
        blockedReason: status === TicketStatus.BLOCKED ? 'Dependencia externa pendiente / definición negocio.' : null
      }
    });

    const commentsCount = Math.floor(Math.random() * 4);
    for (let c = 0; c < commentsCount; c += 1) {
      const author = c % 2 === 0 ? createdBy : users.find((u) => u.role === Role.DEVELOPER) ?? createdBy;
      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          authorUserId: author.id,
          body:
            c === 0
              ? 'Se confirma el reporte y se agrega contexto.'
              : c === 1
                ? 'Análisis técnico en curso. Se identificaron componentes afectados.'
                : 'Actualización de seguimiento para dirección/QA.',
          createdAt: addHours(createdAt, 6 + c * 12)
        }
      });
    }
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
