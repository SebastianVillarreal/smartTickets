import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttachmentRoleContext,
  Priority,
  Prisma,
  Role,
  TicketStatus,
  TicketType,
} from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
import { JwtUser } from '../shared/jwt-user.type';
import {
  CreateCommentDto,
  CreateTicketDto,
  TicketListQueryDto,
  UpdateTicketDto,
  WorkflowActionDto,
} from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextCode(type: TicketType): Promise<string> {
    const prefix = type === TicketType.BUG ? 'BUG' : 'FEAT';
    const last = await this.prisma.ticket.findFirst({
      where: { type },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const lastNum = last?.code ? Number(last.code.split('-')[1]) : 0;
    return `${prefix}-${String(lastNum + 1).padStart(6, '0')}`;
  }

  private canEditTicket(user: JwtUser, patch: UpdateTicketDto | WorkflowActionDto): void {
    const isAdmin = user.role === Role.ADMIN;
    const isManager = user.role === Role.MANAGER;
    const isDev = user.role === Role.DEVELOPER;

    if (isAdmin) return;

    if ('priority' in patch && patch.priority && !isManager && !isAdmin) {
      throw new ForbiddenException('Solo manager/admin puede cambiar prioridad');
    }
    if ('assignedToUserId' in patch && patch.assignedToUserId !== undefined && !isManager && !isAdmin) {
      throw new ForbiddenException('Solo manager/admin puede asignar tickets');
    }
    if ('status' in patch && patch.status && !isDev && !isManager && !isAdmin) {
      throw new ForbiddenException('No autorizado para cambiar status');
    }
    if ((patch.rootCause || patch.resolutionSummary) && !isDev && !isAdmin) {
      throw new ForbiddenException('Solo developer/admin puede editar resolución');
    }
  }

  async create(dto: CreateTicketDto, user: JwtUser) {
    if (dto.type === TicketType.BUG && !dto.severity) {
      throw new BadRequestException('severity es obligatorio para BUG');
    }
    if (dto.type === TicketType.FEATURE) {
      dto.severity = undefined;
    }
    const code = await this.nextCode(dto.type);
    return this.prisma.ticket.create({
      data: {
        code,
        ...dto,
        createdByUserId: user.sub,
        tags: dto.tags ?? [],
        status: TicketStatus.NEW,
      },
      include: {
        system: true,
        createdByUser: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async list(query: TicketListQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
    const where: Prisma.TicketWhereInput = {
      ...(query.systemId ? { systemId: query.systemId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedToUserId ? { assignedToUserId: query.assignedToUserId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { code: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          system: true,
          assignedToUser: { select: { id: true, name: true, role: true } },
          createdByUser: { select: { id: true, name: true, role: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        system: true,
        createdByUser: { select: { id: true, name: true, email: true, role: true } },
        assignedToUser: { select: { id: true, name: true, email: true, role: true } },
        attachments: {
          orderBy: { createdAt: 'asc' },
          include: { uploadedByUser: { select: { id: true, name: true, role: true } } },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            authorUser: { select: { id: true, name: true, role: true } },
            attachments: {
              orderBy: { createdAt: 'asc' },
              include: { uploadedByUser: { select: { id: true, name: true, role: true } } },
            },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtUser) {
    this.canEditTicket(user, dto);
    await this.ensureTicket(id);
    return this.prisma.ticket.update({
      where: { id },
      data: dto,
    });
  }

  async workflow(id: string, dto: WorkflowActionDto, user: JwtUser) {
    this.canEditTicket(user, dto);
    const ticket = await this.ensureTicket(id);
    const now = new Date();
    const data: Prisma.TicketUpdateInput = {};

    if (dto.assignedToUserId !== undefined) data.assignedToUser = dto.assignedToUserId ? { connect: { id: dto.assignedToUserId } } : { disconnect: true };
    if (dto.priority) data.priority = dto.priority;
    if (dto.rootCause !== undefined) data.rootCause = dto.rootCause;
    if (dto.resolutionSummary !== undefined) data.resolutionSummary = dto.resolutionSummary;
    if (dto.blockedReason !== undefined) data.blockedReason = dto.blockedReason;

    if (dto.status) {
      if (
        user.role === Role.DEVELOPER &&
        ![TicketStatus.IN_PROGRESS, TicketStatus.READY_FOR_QA, TicketStatus.DONE, TicketStatus.BLOCKED].includes(dto.status)
      ) {
        throw new ForbiddenException('Developer no puede mover a ese status');
      }
      data.status = dto.status;
      if (dto.status === TicketStatus.TRIAGED && !ticket.triagedAt) data.triagedAt = now;
      if (dto.status === TicketStatus.IN_PROGRESS && !ticket.startedAt) {
        data.startedAt = now;
        if (!ticket.triagedAt) data.triagedAt = now;
      }
      if ([TicketStatus.READY_FOR_QA, TicketStatus.DONE].includes(dto.status) && !ticket.resolvedAt) {
        data.resolvedAt = now;
        if (!ticket.startedAt) data.startedAt = now;
        if (!ticket.triagedAt) data.triagedAt = now;
      }
      if (dto.status === TicketStatus.DONE) {
        data.closedAt = now;
      }
    }

    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.prisma.ticket.delete({ where: { id } });
    return { success: true };
  }

  async addComment(ticketId: string, dto: CreateCommentDto, user: JwtUser) {
    await this.ensureTicket(ticketId);
    return this.prisma.comment.create({
      data: {
        ticketId,
        authorUserId: user.sub,
        body: dto.body,
      },
      include: { authorUser: { select: { id: true, name: true, role: true } } },
    });
  }

  async deleteComment(ticketId: string, commentId: string, user: JwtUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.ticketId !== ticketId) throw new NotFoundException('Comentario no encontrado');
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && comment.authorUserId !== user.sub) {
      throw new ForbiddenException('No autorizado para eliminar comentario');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async addTicketAttachments(ticketId: string, files: Express.Multer.File[], user: JwtUser) {
    await this.ensureTicket(ticketId);
    return this.persistAttachments(ticketId, null, files, user);
  }

  async addCommentAttachments(ticketId: string, commentId: string, files: Express.Multer.File[], user: JwtUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.ticketId !== ticketId) throw new NotFoundException('Comentario no encontrado');
    return this.persistAttachments(ticketId, commentId, files, user);
  }

  async deleteAttachment(ticketId: string, attachmentId: string, user: JwtUser) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) throw new NotFoundException('Adjunto no encontrado');
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && attachment.uploadedByUserId !== user.sub) {
      throw new ForbiddenException('No autorizado para eliminar adjunto');
    }
    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    return { success: true };
  }

  private async persistAttachments(
    ticketId: string,
    commentId: string | null,
    files: Express.Multer.File[],
    user: JwtUser,
  ) {
    if (!files.length) throw new BadRequestException('Debe subir al menos un archivo');
    const currentCount = await this.prisma.attachment.count({ where: { ticketId } });
    if (currentCount + files.length > 10) {
      throw new BadRequestException('Máximo 10 archivos por ticket (MVP)');
    }

    const roleContext =
      user.role === Role.REPORTER ? AttachmentRoleContext.REPORTER : AttachmentRoleContext.RESOLVER;

    return this.prisma.$transaction(
      files.map((file) =>
        this.prisma.attachment.create({
          data: {
            ticketId,
            commentId,
            uploadedByUserId: user.sub,
            roleContext,
            fileName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`,
          },
        }),
      ),
    );
  }

  private async ensureTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }
}
