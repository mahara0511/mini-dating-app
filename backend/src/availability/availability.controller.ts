import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto, AvailabilitySlotResponseDto, CommonSlotResponseDto, AvailabilityStatusResponseDto } from './dto';

@ApiTags('Availability')
@Controller('api/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Save availability slots for a user in a match' })
  @ApiResponse({ status: 201, description: 'Availability slots saved', type: [AvailabilitySlotResponseDto] })
  @ApiResponse({ status: 400, description: 'Validation error' })
  saveAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilityService.saveAvailability(
      createAvailabilityDto.userId,
      createAvailabilityDto.matchId,
      createAvailabilityDto.slots,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get availability slots for a user in a match' })
  @ApiQuery({ name: 'userId', description: 'User UUID' })
  @ApiQuery({ name: 'matchId', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'List of availability slots', type: [AvailabilitySlotResponseDto] })
  getAvailability(
    @Query('userId') userId: string,
    @Query('matchId') matchId: string,
  ) {
    return this.availabilityService.getAvailability(userId, matchId);
  }

  @Get('user/:userId/all')
  @ApiOperation({ summary: 'Get all availability slots for a user across all matches' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'All availability slots for the user', type: [AvailabilitySlotResponseDto] })
  getAllUserAvailability(@Param('userId') userId: string) {
    return this.availabilityService.getAllUserAvailability(userId);
  }

  @Get('common-slot/:matchId')
  @ApiOperation({ summary: 'Find overlapping time slot between two matched users' })
  @ApiParam({ name: 'matchId', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Common slot result (found or not)', type: CommonSlotResponseDto })
  findCommonSlot(@Param('matchId') matchId: string) {
    return this.availabilityService.findCommonSlot(matchId);
  }

  @Get('status/:matchId')
  @ApiOperation({ summary: 'Check availability status for both users in a match' })
  @ApiParam({ name: 'matchId', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Availability status for both users', type: AvailabilityStatusResponseDto })
  getMatchAvailabilityStatus(@Param('matchId') matchId: string) {
    return this.availabilityService.getMatchAvailabilityStatus(matchId);
  }
}
