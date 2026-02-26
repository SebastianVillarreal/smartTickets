import { SubtaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SubtaskStatus)
  status?: SubtaskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  effortHours?: number;

  @IsOptional()
  @IsString()
  assignedToUserId?: string | null;
}

export class UpdateSubtaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(SubtaskStatus)
  status?: SubtaskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  effortHours?: number | null;

  @IsOptional()
  @IsString()
  assignedToUserId?: string | null;
}

export class CreateSubtaskCommentDto {
  @IsString()
  body!: string;
}
