import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto';

@Controller('api/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  createLike(@Body() createLikeDto: CreateLikeDto) {
    return this.likesService.createLike(
      createLikeDto.fromUserId,
      createLikeDto.toUserId,
    );
  }

  @Get('given/:userId')
  getLikesGiven(@Param('userId') userId: string) {
    return this.likesService.getLikesGiven(userId);
  }

  @Get('received/:userId')
  getLikesReceived(@Param('userId') userId: string) {
    return this.likesService.getLikesReceived(userId);
  }

  @Get('check')
  hasLiked(
    @Query('fromUserId') fromUserId: string,
    @Query('toUserId') toUserId: string,
  ) {
    return this.likesService.hasLiked(fromUserId, toUserId);
  }
}
