// ========== Entity / Response Types ==========

export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface MatchData {
  id: string;
  userAId: string;
  userBId: string;
  userA: User;
  userB: User;
  scheduledDate?: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  createdAt: string;
}

export interface AvailabilitySlot {
  id?: string;
  matchId?: string;
  date: string;
  startTime: string;
  endTime: string;
}

// ========== API Response Wrappers ==========

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

export interface LikeResponse {
  like: Like;
  isMatch: boolean;
  match?: MatchData;
}

export interface CommonSlotResult {
  found: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  message: string;
}

export interface AvailabilityStatus {
  userAHasSlots: boolean;
  userBHasSlots: boolean;
  userASlots?: AvailabilitySlot[];
  userBSlots?: AvailabilitySlot[];
}

// ========== Request DTOs (mirrors backend DTOs) ==========

export interface CreateUserDto {
  name: string;
  age: number;
  gender: string;
  bio: string;
  email: string;
}

export interface CreateLikeDto {
  fromUserId: string;
  toUserId: string;
}

export interface CreateAvailabilityDto {
  userId: string;
  matchId: string;
  slots: AvailabilitySlotDto[];
}

export interface AvailabilitySlotDto {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Start time in HH:mm format */
  startTime: string;
  /** End time in HH:mm format */
  endTime: string;
}
