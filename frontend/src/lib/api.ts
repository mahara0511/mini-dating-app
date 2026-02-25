const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ========== Types ==========

export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface LikeResponse {
  like: {
    id: string;
    fromUserId: string;
    toUserId: string;
  };
  isMatch: boolean;
  match?: MatchData;
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
  date: string;
  startTime: string;
  endTime: string;
}

export interface CommonSlotResult {
  found: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ========== Helper ==========

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();

  if (!res.ok) {
    // Error responses from HttpExceptionFilter
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  // Unwrap the { success, data, timestamp } envelope
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  // Fallback for backward compatibility
  return json as T;
}

// ========== USERS ==========

export async function createUser(data: {
  name: string;
  age: number;
  gender: string;
  bio: string;
  email: string;
}): Promise<User> {
  return apiRequest<User>(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>(`${API_BASE}/api/users`, { cache: 'no-store' });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const data = await apiRequest<User | null>(
    `${API_BASE}/api/users/by-email?email=${encodeURIComponent(email)}`,
    { cache: 'no-store' },
  );
  return data || null;
}

export async function getUserById(id: string): Promise<User> {
  return apiRequest<User>(`${API_BASE}/api/users/${id}`, { cache: 'no-store' });
}

// ========== LIKES ==========

export async function createLike(fromUserId: string, toUserId: string): Promise<LikeResponse> {
  return apiRequest<LikeResponse>(`${API_BASE}/api/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUserId, toUserId }),
  });
}

export async function checkLiked(fromUserId: string, toUserId: string): Promise<boolean> {
  return apiRequest<boolean>(
    `${API_BASE}/api/likes/check?fromUserId=${fromUserId}&toUserId=${toUserId}`,
    { cache: 'no-store' },
  );
}

// ========== MATCHES ==========

export async function getMatches(userId: string): Promise<MatchData[]> {
  return apiRequest<MatchData[]>(`${API_BASE}/api/matches/user/${userId}`, {
    cache: 'no-store',
  });
}

export async function getMatch(matchId: string): Promise<MatchData> {
  return apiRequest<MatchData>(`${API_BASE}/api/matches/${matchId}`, {
    cache: 'no-store',
  });
}

// ========== AVAILABILITY ==========

export async function saveAvailability(
  userId: string,
  matchId: string,
  slots: AvailabilitySlot[],
): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(`${API_BASE}/api/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId, slots }),
  });
}

export async function getAvailability(userId: string, matchId: string): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(
    `${API_BASE}/api/availability/user?userId=${userId}&matchId=${matchId}`,
    { cache: 'no-store' },
  );
}

export async function findCommonSlot(matchId: string): Promise<CommonSlotResult> {
  return apiRequest<CommonSlotResult>(
    `${API_BASE}/api/availability/common-slot/${matchId}`,
    { cache: 'no-store' },
  );
}

export async function getAvailabilityStatus(matchId: string): Promise<{
  userAHasSlots: boolean;
  userBHasSlots: boolean;
}> {
  return apiRequest<{ userAHasSlots: boolean; userBHasSlots: boolean }>(
    `${API_BASE}/api/availability/status/${matchId}`,
    { cache: 'no-store' },
  );
}
