import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikeDto {
  @ApiProperty({ description: 'UUID of the user who is liking', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsNotEmpty({ message: 'fromUserId is required' })
  @IsUUID('4', { message: 'fromUserId must be a valid UUID' })
  fromUserId: string;

  @ApiProperty({ description: 'UUID of the user being liked', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsNotEmpty({ message: 'toUserId is required' })
  @IsUUID('4', { message: 'toUserId must be a valid UUID' })
  toUserId: string;
}
