import { IsString, IsNumber, IsEmail, IsOptional, Min, Max, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;

  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
