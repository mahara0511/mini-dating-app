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

    // Validate: dates must be within the next 3 weeks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);

    for (const slot of slots) {
      const slotDate = new Date(slot.date + 'T00:00:00');
      if (slotDate <= today || slotDate > maxDate) {
        throw new BadRequestException(
          `Date ${slot.date} must be within the next 3 weeks (from tomorrow to ${maxDate.toISOString().split('T')[0]})`,
        );
      }
    }

    // Validate: startTime must be before endTime
    for (const slot of slots) {
      if (this.timeToMinutes(slot.startTime) >= this.timeToMinutes(slot.endTime)) {
        throw new BadRequestException(
          `Start time (${slot.startTime}) must be before end time (${slot.endTime})`,
        );
      }
    }

    // Validate: no overlapping slots within the submitted slots (same date)
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].date === slots[j].date) {
          const startA = this.timeToMinutes(slots[i].startTime);
          const endA = this.timeToMinutes(slots[i].endTime);
          const startB = this.timeToMinutes(slots[j].startTime);
          const endB = this.timeToMinutes(slots[j].endTime);

          if (startA < endB && startB < endA) {
            throw new BadRequestException(
              `Time slots overlap on ${slots[i].date}: ${slots[i].startTime}-${slots[i].endTime} and ${slots[j].startTime}-${slots[j].endTime}`,
            );
          }
        }
      }
    }

    // Validate: no overlapping slots with OTHER matches of this user
    const existingSlotsFromOtherMatches = await this.availabilityRepository.find({
      where: { userId },
    });
    // Filter out slots from the current match (since we will replace them)
    const otherMatchSlots = existingSlotsFromOtherMatches.filter(
      (s) => s.matchId !== matchId,
    );

    for (const newSlot of slots) {
      for (const existing of otherMatchSlots) {
        if (newSlot.date === existing.date) {
          const newStart = this.timeToMinutes(newSlot.startTime);
          const newEnd = this.timeToMinutes(newSlot.endTime);
          const existStart = this.timeToMinutes(existing.startTime);
          const existEnd = this.timeToMinutes(existing.endTime);

          if (newStart < existEnd && existStart < newEnd) {
            throw new BadRequestException(
              `Time slot ${newSlot.date} ${newSlot.startTime}-${newSlot.endTime} conflicts with an existing slot (${existing.startTime}-${existing.endTime}) from another match`,
            );
          }
        }
      }
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

  async getAllUserAvailability(userId: string): Promise<Availability[]> {
    return this.availabilityRepository.find({
      where: { userId },
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

    // Find the first overlapping slot using Two Pointers O(N + M)
    let i = 0;
    let j = 0;

    while (i < slotsA.length && j < slotsB.length) {
      const slotA = slotsA[i];
      const slotB = slotsB[j];

      // Nếu ngày khác nhau → move pointer sớm hơn
      if (slotA.date < slotB.date) {
        i++;
        continue;
      }

      if (slotA.date > slotB.date) {
        j++;
        continue;
      }

      // Cùng ngày → check overlap
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

      // Move pointer có endTime nhỏ hơn
      if (this.timeToMinutes(slotA.endTime) < this.timeToMinutes(slotB.endTime)) {
        i++;
      } else {
        j++;
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
