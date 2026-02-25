import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateLikeDto {
  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;
}
