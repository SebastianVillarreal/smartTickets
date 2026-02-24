import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Authenticated } from '../shared/authenticated.decorator';
import { Roles } from '../shared/roles.decorator';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { MetricsService } from './metrics.service';

@Authenticated()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  @Roles(Role.MANAGER, Role.ADMIN, Role.DEVELOPER, Role.REPORTER)
  dashboard(@Query() query: DashboardQueryDto) {
    return this.metricsService.dashboard(query);
  }
}
