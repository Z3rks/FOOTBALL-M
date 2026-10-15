import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { IsOptional, Matches } from 'class-validator';
import { Request, Response } from 'express';
import { AuthenticatedUser, CurrentUser, Roles } from '../../auth/decorators';
import { UserRole } from '../../users/user.enums';
import { adminContext, sendCsv } from '../admin-http';
import { AdminReportsService } from './admin-reports.service';
import { IReportExport } from './report-export';

export class ReportMonthQueryDto {
  /** YYYY-MM; por defecto el mes actual. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be YYYY-MM' })
  month?: string;
}

/** Contrato de API §9.4 — AdminReportsScreen. */
@Roles(UserRole.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly reports: AdminReportsService,
    private readonly exports: IReportExport,
  ) {}

  @Get('summary')
  summary(@Query() query: ReportMonthQueryDto) {
    return this.reports.summary(query.month);
  }

  @Get('top-players')
  topPlayers(@Query() query: ReportMonthQueryDto) {
    return this.reports.topPlayers(query.month);
  }

  @Get('category-performance')
  categoryPerformance(@Query() query: ReportMonthQueryDto) {
    return this.reports.categoryPerformance(query.month);
  }

  @Get('peak-hours')
  peakHours(@Query() query: ReportMonthQueryDto) {
    return this.reports.peakHours(query.month);
  }

  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Req() req: Request, @Query() query: ReportMonthQueryDto, @Res({ passthrough: true }) res: Response) {
    return sendCsv(res, await this.exports.exportMonthlyReport(adminContext(user, req), query.month));
  }
}
