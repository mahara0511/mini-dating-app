import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class LikeResponseDto {
  @ApiProperty({ description: 'Like UUID' })
  id: string;

  @ApiProperty({ description: 'ID of the user who liked' })
  fromUserId: string;

  @ApiProperty({ description: 'ID of the user who was liked' })
  toUserId: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'The liked user details', type: () => UserResponseDto })
  toUser?: UserResponseDto;

  @ApiPropertyOptional({ description: 'The liker user details', type: () => UserResponseDto })
  fromUser?: UserResponseDto;
}

export class MatchResponseDto {
  @ApiProperty({ description: 'Match UUID' })
  id: string;

  @ApiProperty({ description: 'User A ID' })
  userAId: string;

  @ApiProperty({ description: 'User B ID' })
  userBId: string;

  @ApiPropertyOptional({ description: 'User A details', type: () => UserResponseDto })
  userA?: UserResponseDto;

  @ApiPropertyOptional({ description: 'User B details', type: () => UserResponseDto })
  userB?: UserResponseDto;

  @ApiPropertyOptional({ description: 'Scheduled date (YYYY-MM-DD)', example: '2026-03-10' })
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Scheduled start time (HH:mm)', example: '11:00' })
  scheduledTimeStart?: string;

  @ApiPropertyOptional({ description: 'Scheduled end time (HH:mm)', example: '14:00' })
  scheduledTimeEnd?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

export class CreateLikeResponseDto {
  @ApiProperty({ description: 'The created like', type: LikeResponseDto })
  like: LikeResponseDto;

  @ApiProperty({ description: 'Whether this like resulted in a match', example: false })
  isMatch: boolean;

  @ApiPropertyOptional({ description: 'Match data if isMatch is true', type: () => MatchResponseDto })
  match?: MatchResponseDto;
}

export class HasLikedResponseDto {
  @ApiProperty({ description: 'Whether the user has liked the other user', example: true })
  liked: boolean;
}
