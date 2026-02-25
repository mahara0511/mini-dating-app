import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto';

@Controller('api/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  saveAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilityService.saveAvailability(
      createAvailabilityDto.userId,
      createAvailabilityDto.matchId,
      createAvailabilityDto.slots,
    );
  }

  @Get('user')
  getAvailability(
    @Query('userId') userId: string,
    @Query('matchId') matchId: string,
  ) {
    return this.availabilityService.getAvailability(userId, matchId);
  }

  @Get('common-slot/:matchId')
  findCommonSlot(@Param('matchId') matchId: string) {
    return this.availabilityService.findCommonSlot(matchId);
  }

  @Get('status/:matchId')
  getMatchAvailabilityStatus(@Param('matchId') matchId: string) {
    return this.availabilityService.getMatchAvailabilityStatus(matchId);
  }
}
