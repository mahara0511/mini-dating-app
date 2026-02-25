import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Whether the request was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({ description: 'ISO timestamp', example: '2026-02-25T05:08:35.949Z' })
  timestamp: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'Always false for errors', example: false })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error message', example: 'Validation failed' })
  message: string;

  @ApiProperty({ description: 'Validation error details (if any)', nullable: true, example: ['age must not be less than 18'] })
  errors: string[] | null;

  @ApiProperty({ description: 'ISO timestamp' })
  timestamp: string;
}
