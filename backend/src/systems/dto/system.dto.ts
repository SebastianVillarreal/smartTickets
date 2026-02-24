import { IsOptional, IsString, Length } from 'class-validator';

export class CreateSystemDto {
  @IsString()
  @Length(2, 20)
  key!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  ownerTeam!: string;
}

export class UpdateSystemDto {
  @IsOptional()
  @IsString()
  @Length(2, 20)
  key?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ownerTeam?: string;
}
