import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilitySlotResponseDto {
  @ApiProperty({ description: 'Slot UUID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Match ID' })
  matchId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)', example: '2026-03-10' })
  date: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '12:00' })
  endTime: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}

export class CommonSlotResponseDto {
  @ApiProperty({ description: 'Whether a common slot was found', example: true })
  found: boolean;

  @ApiPropertyOptional({ description: 'Overlapping date (YYYY-MM-DD)', example: '2026-03-10' })
  date?: string;

  @ApiPropertyOptional({ description: 'Overlapping start time', example: '11:00' })
  startTime?: string;

  @ApiPropertyOptional({ description: 'Overlapping end time', example: '14:00' })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Result message', example: 'You have a date on: Monday, March 10, 2026 from 11:00 to 14:00' })
  message?: string;
}

export class AvailabilityStatusResponseDto {
  @ApiProperty({ description: 'Whether User A has set availability', example: true })
  userAHasSlots: boolean;

  @ApiProperty({ description: 'Whether User B has set availability', example: false })
  userBHasSlots: boolean;
}
