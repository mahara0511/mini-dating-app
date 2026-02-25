import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { MatchDetailResponseDto } from './dto/match-response.dto';

@ApiTags('Matches')
@Controller('api/matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all matches for a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of matches with partner details', type: [MatchDetailResponseDto] })
  findMatchesForUser(@Param('userId') userId: string) {
    return this.matchesService.findMatchesForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Match details with both user info', type: MatchDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Match not found' })
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }
}
