import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AvailabilitySlotDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2026-03-10' })
  @IsString({ message: 'Date must be a string' })
  @IsNotEmpty({ message: 'Date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format (e.g. 2026-03-10)' })
  date: string;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsString({ message: 'Start time must be a string' })
  @IsNotEmpty({ message: 'Start time is required' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Start time must be in HH:mm format (e.g. 09:00)' })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '12:00' })
  @IsString({ message: 'End time must be a string' })
  @IsNotEmpty({ message: 'End time is required' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must be in HH:mm format (e.g. 12:00)' })
  endTime: string;
}

export class CreateAvailabilityDto {
  @ApiProperty({ description: 'User UUID' })
  @IsNotEmpty({ message: 'userId is required' })
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;

  @ApiProperty({ description: 'Match UUID' })
  @IsNotEmpty({ message: 'matchId is required' })
  @IsUUID('4', { message: 'matchId must be a valid UUID' })
  matchId: string;

  @ApiProperty({ description: 'Array of time slots (1-20 slots)', type: [AvailabilitySlotDto] })
  @IsArray({ message: 'Slots must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 time slot is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 time slots allowed' })
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
