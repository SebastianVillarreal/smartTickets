import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateSystemDto, UpdateSystemDto } from './dto/system.dto';

@Injectable()
export class SystemsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.system.findMany({
      orderBy: { key: 'asc' },
      include: {
        _count: { select: { tickets: true } },
      },
    });
  }

  create(dto: CreateSystemDto) {
    return this.prisma.system.create({ data: dto });
  }

  update(id: string, dto: UpdateSystemDto) {
    return this.prisma.system.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.system.delete({ where: { id } });
    return { success: true };
  }
}
