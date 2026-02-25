import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class MatchDetailResponseDto {
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
