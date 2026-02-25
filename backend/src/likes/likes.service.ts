import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Match } from '../matches/entities/match.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async createLike(
    fromUserId: string,
    toUserId: string,
  ): Promise<{ like: Like; isMatch: boolean; match?: Match }> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot like yourself');
    }

    // Check if already liked
    const existing = await this.likesRepository.findOne({
      where: { fromUserId, toUserId },
    });
    if (existing) {
      throw new ConflictException('Already liked this user');
    }

    // Create the like
    const like = this.likesRepository.create({ fromUserId, toUserId });
    await this.likesRepository.save(like);

    // Check if mutual like exists (match detection)
    const mutualLike = await this.likesRepository.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    if (mutualLike) {
      // It's a match! Ensure consistent ordering: smaller ID is userA
      const [userAId, userBId] = [fromUserId, toUserId].sort();

      // Check if match already exists
      const existingMatch = await this.matchesRepository.findOne({
        where: { userAId, userBId },
      });

      if (!existingMatch) {
        const match = this.matchesRepository.create({ userAId, userBId });
        const savedMatch = await this.matchesRepository.save(match);
        return { like, isMatch: true, match: savedMatch };
      }

      return { like, isMatch: true, match: existingMatch };
    }

    return { like, isMatch: false };
  }

  async getLikesGiven(userId: string): Promise<Like[]> {
    return this.likesRepository.find({
      where: { fromUserId: userId },
      relations: ['toUser'],
    });
  }

  async getLikesReceived(userId: string): Promise<Like[]> {
    return this.likesRepository.find({
      where: { toUserId: userId },
      relations: ['fromUser'],
    });
  }

  async hasLiked(fromUserId: string, toUserId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { fromUserId, toUserId },
    });
    return !!like;
  }
}
