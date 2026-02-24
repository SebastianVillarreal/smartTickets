import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Authenticated } from '../shared/authenticated.decorator';
import { Roles } from '../shared/roles.decorator';
import { CreateSystemDto, UpdateSystemDto } from './dto/system.dto';
import { SystemsService } from './systems.service';

@Authenticated()
@Controller('systems')
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Get()
  list() {
    return this.systemsService.list();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSystemDto) {
    return this.systemsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSystemDto) {
    return this.systemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.systemsService.remove(id);
  }
}
