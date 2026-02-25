import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User name (2-50 characters)', example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  @Matches(/^[a-zA-ZÀ-ỹ\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  name: string;

  @ApiProperty({ description: 'User age (18-100)', example: 25, minimum: 18, maximum: 100 })
  @IsInt({ message: 'Age must be an integer' })
  @Min(18, { message: 'Age must be at least 18' })
  @Max(100, { message: 'Age must not exceed 100' })
  age: number;

  @ApiProperty({ description: 'Gender', enum: ['male', 'female', 'other'], example: 'male' })
  @IsString({ message: 'Gender must be a string' })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsIn(['male', 'female', 'other'], { message: 'Gender must be one of: male, female, other' })
  gender: string;

  @ApiPropertyOptional({ description: 'Short bio (max 500 characters)', example: 'Love traveling and coding' })
  @IsString({ message: 'Bio must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @ApiProperty({ description: 'Valid email address', example: 'john@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address (e.g. john@example.com)' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL (must be a valid URL)' })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}
