import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'User age', example: 25 })
  age: number;

  @ApiProperty({ description: 'User gender', enum: ['male', 'female', 'other'], example: 'male' })
  gender: string;

  @ApiPropertyOptional({ description: 'User bio', example: 'Love traveling and coding' })
  bio?: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}
