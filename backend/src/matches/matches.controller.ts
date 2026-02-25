import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('Matches')
@Controller('api/matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('user/:userId')
  findMatchesForUser(@Param('userId') userId: string) {
    return this.matchesService.findMatchesForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }
}
