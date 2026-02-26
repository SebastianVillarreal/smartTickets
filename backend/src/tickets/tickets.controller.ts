import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, isAbsolute, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Authenticated } from '../shared/authenticated.decorator';
import { CurrentUser } from '../shared/current-user.decorator';
import { JwtUser } from '../shared/jwt-user.type';
import { Roles } from '../shared/roles.decorator';
import {
  CreateCommentDto,
  CreateTicketDto,
  TicketListQueryDto,
  UpdateTicketDto,
  WorkflowActionDto,
} from './dto/ticket.dto';
import {
  CreateSubtaskCommentDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
} from './dto/subtask.dto';
import { TicketsService } from './tickets.service';

function getUploadDir(): string {
  const base = process.env.UPLOAD_DIR ?? './uploads';
  const full = isAbsolute(base) ? base : join(process.cwd(), base);
  if (!existsSync(full)) mkdirSync(full, { recursive: true });
  return full;
}

function imageUploadInterceptor() {
  return FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: getUploadDir(),
      filename: (_, file, cb) => {
        const uniqueName = `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_, file, cb) => {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
        cb(new BadRequestException('Solo se permiten imágenes png/jpg/webp'), false);
        return;
      }
      cb(null, true);
    },
  });
}

@Authenticated()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list(@Query() query: TicketListQueryDto) {
    return this.ticketsService.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @Roles(Role.REPORTER, Role.DEVELOPER, Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtUser) {
    return this.ticketsService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: JwtUser) {
    return this.ticketsService.update(id, dto, user);
  }

  @Patch(':id/workflow')
  workflow(@Param('id') id: string, @Body() dto: WorkflowActionDto, @CurrentUser() user: JwtUser) {
    return this.ticketsService.workflow(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @CurrentUser() user: JwtUser) {
    return this.ticketsService.addComment(id, dto, user);
  }

  @Get(':id/subtasks')
  listSubtasks(@Param('id') id: string) {
    return this.ticketsService.listSubtasks(id);
  }

  @Post(':id/subtasks')
  createSubtask(@Param('id') id: string, @Body() dto: CreateSubtaskDto, @CurrentUser() user: JwtUser) {
    return this.ticketsService.createSubtask(id, dto, user);
  }

  @Patch(':id/subtasks/:subtaskId')
  updateSubtask(
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.updateSubtask(id, subtaskId, dto, user);
  }

  @Delete(':id/subtasks/:subtaskId')
  deleteSubtask(
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.deleteSubtask(id, subtaskId, user);
  }

  @Post(':id/subtasks/:subtaskId/comments')
  addSubtaskComment(
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: CreateSubtaskCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.addSubtaskComment(id, subtaskId, dto, user);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string, @CurrentUser() user: JwtUser) {
    return this.ticketsService.deleteComment(id, commentId, user);
  }

  @Post(':id/attachments')
  @UseInterceptors(imageUploadInterceptor())
  uploadTicketAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.addTicketAttachments(id, files ?? [], user);
  }

  @Post(':id/comments/:commentId/attachments')
  @UseInterceptors(imageUploadInterceptor())
  uploadCommentAttachments(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.addCommentAttachments(id, commentId, files ?? [], user);
  }

  @Delete(':id/attachments/:attachmentId')
  deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.ticketsService.deleteAttachment(id, attachmentId, user);
  }
}
