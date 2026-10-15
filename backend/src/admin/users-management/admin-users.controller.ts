import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query, Req, Res } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Request, Response } from 'express';
import { AuthenticatedUser, CurrentUser, Roles } from '../../auth/decorators';
import { PlayerFilter } from '../../users/player-directory';
import { UserRole, UserStatus } from '../../users/user.enums';
import { adminContext, sendCsv } from '../admin-http';
import { IReportExport } from '../reports/report-export';
import { IUserManagement } from './user-management';

const PLAYER_FILTERS: PlayerFilter[] = ['all', 'active', 'inactive', 'new7d'];

export class AdminUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(PLAYER_FILTERS)
  filter: PlayerFilter = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class AdminUsersExportQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(PLAYER_FILTERS)
  filter: PlayerFilter = 'all';
}

export class UpdateUserStatusDto {
  @IsIn([UserStatus.ACTIVE, UserStatus.INACTIVE])
  status: UserStatus;
}

/** Contrato de API §9.2 — AdminUsersScreen. */
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminUsers: IUserManagement,
    private readonly exports: IReportExport,
  ) {}

  @Get()
  list(@Query() query: AdminUsersQueryDto) {
    return this.adminUsers.list(query.filter, query.search, query.page, query.limit);
  }

  /** Declarada antes de :id para que "export" no se tome como un id. */
  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Req() req: Request, @Query() query: AdminUsersExportQueryDto, @Res({ passthrough: true }) res: Response) {
    return sendCsv(res, await this.exports.exportUsers(adminContext(user, req), query.filter, query.search));
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.detail(id);
  }

  @Get(':id/activity')
  activity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.activity(id);
  }

  @Patch(':id/status')
  setStatus(@CurrentUser() user: AuthenticatedUser, @Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminUsers.setStatus(adminContext(user, req), id, dto.status);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminUsers.delete(adminContext(user, req), id);
  }
}
