import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async findMatchesForUser(userId: string): Promise<Match[]> {
    return this.matchesRepository.find({
      where: [{ userAId: userId }, { userBId: userId }],
      relations: ['userA', 'userB'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: ['userA', 'userB'],
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async updateSchedule(
    matchId: string,
    scheduledDate: string,
    scheduledTimeStart: string,
    scheduledTimeEnd: string,
  ): Promise<Match> {
    const match = await this.findOne(matchId);
    match.scheduledDate = scheduledDate;
    match.scheduledTimeStart = scheduledTimeStart;
    match.scheduledTimeEnd = scheduledTimeEnd;
    return this.matchesRepository.save(match);
  }
}
