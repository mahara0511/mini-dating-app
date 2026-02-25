import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto, CreateLikeResponseDto, LikeResponseDto } from './dto';

@ApiTags('Likes')
@Controller('api/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiOperation({ summary: 'Like a user (creates match if mutual)' })
  @ApiResponse({ status: 201, description: 'Like created. Returns match data if mutual like detected.', type: CreateLikeResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot like yourself' })
  @ApiResponse({ status: 409, description: 'Already liked this user' })
  createLike(@Body() createLikeDto: CreateLikeDto) {
    return this.likesService.createLike(
      createLikeDto.fromUserId,
      createLikeDto.toUserId,
    );
  }

  @Get('given/:userId')
  @ApiOperation({ summary: 'Get all likes given by a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of likes with liked user details', type: [LikeResponseDto] })
  getLikesGiven(@Param('userId') userId: string) {
    return this.likesService.getLikesGiven(userId);
  }

  @Get('received/:userId')
  @ApiOperation({ summary: 'Get all likes received by a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'List of likes with liker user details', type: [LikeResponseDto] })
  getLikesReceived(@Param('userId') userId: string) {
    return this.likesService.getLikesReceived(userId);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if a user has liked another user' })
  @ApiQuery({ name: 'fromUserId', description: 'Liker user UUID' })
  @ApiQuery({ name: 'toUserId', description: 'Liked user UUID' })
  @ApiResponse({ status: 200, description: 'Boolean result', type: Boolean })
  hasLiked(
    @Query('fromUserId') fromUserId: string,
    @Query('toUserId') toUserId: string,
  ) {
    return this.likesService.hasLiked(fromUserId, toUserId);
  }
}
