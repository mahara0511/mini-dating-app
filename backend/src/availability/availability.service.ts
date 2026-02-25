import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { Match } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';

export interface SlotResult {
  found: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  message: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private matchesService: MatchesService,
  ) {}

  async saveAvailability(
    userId: string,
    matchId: string,
    slots: { date: string; startTime: string; endTime: string }[],
  ): Promise<Availability[]> {
    // Validate match exists and user belongs to it
    const match = await this.matchesService.findOne(matchId);
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new BadRequestException('User does not belong to this match');
    }

    // Remove existing availability for this user+match combination
    await this.availabilityRepository.delete({ userId, matchId });

    // Save new slots
    const availabilities = slots.map((slot) =>
      this.availabilityRepository.create({
        userId,
        matchId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }),
    );

    return this.availabilityRepository.save(availabilities);
  }

  async getAvailability(
    userId: string,
    matchId: string,
  ): Promise<Availability[]> {
    return this.availabilityRepository.find({
      where: { userId, matchId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findCommonSlot(matchId: string): Promise<SlotResult> {
    const match = await this.matchesService.findOne(matchId);
    const userAId = match.userAId;
    const userBId = match.userBId;

    // Get availability for both users
    const slotsA = await this.availabilityRepository.find({
      where: { userId: userAId, matchId },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    const slotsB = await this.availabilityRepository.find({
      where: { userId: userBId, matchId },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    if (slotsA.length === 0 || slotsB.length === 0) {
      const missingUsers: string[] = [];
      if (slotsA.length === 0) missingUsers.push('User A');
      if (slotsB.length === 0) missingUsers.push('User B');
      return {
        found: false,
        message: `Waiting for ${missingUsers.join(' and ')} to set availability.`,
      };
    }

    // Find the first overlapping slot
    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        if (slotA.date === slotB.date) {
          const overlapStart = this.maxTime(slotA.startTime, slotB.startTime);
          const overlapEnd = this.minTime(slotA.endTime, slotB.endTime);

          if (this.timeToMinutes(overlapStart) < this.timeToMinutes(overlapEnd)) {
            // Found an overlapping slot! Update the match with the schedule
            await this.matchesService.updateSchedule(
              matchId,
              slotA.date,
              overlapStart,
              overlapEnd,
            );

            return {
              found: true,
              date: slotA.date,
              startTime: overlapStart,
              endTime: overlapEnd,
              message: `You have a date on: ${this.formatDate(slotA.date)} from ${overlapStart} to ${overlapEnd}`,
            };
          }
        }
      }
    }

    return {
      found: false,
      message: 'No overlapping time found. Please try again.',
    };
  }

  async getMatchAvailabilityStatus(matchId: string): Promise<{
    userAHasSlots: boolean;
    userBHasSlots: boolean;
    userASlots: Availability[];
    userBSlots: Availability[];
  }> {
    const match = await this.matchesService.findOne(matchId);
    const userASlots = await this.getAvailability(match.userAId, matchId);
    const userBSlots = await this.getAvailability(match.userBId, matchId);

    return {
      userAHasSlots: userASlots.length > 0,
      userBHasSlots: userBSlots.length > 0,
      userASlots,
      userBSlots,
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private maxTime(a: string, b: string): string {
    return this.timeToMinutes(a) >= this.timeToMinutes(b) ? a : b;
  }

  private minTime(a: string, b: string): string {
    return this.timeToMinutes(a) <= this.timeToMinutes(b) ? a : b;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
}
