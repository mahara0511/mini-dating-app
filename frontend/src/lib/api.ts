import type {
  User,
  LikeResponse,
  MatchData,
  AvailabilitySlot,
  CommonSlotResult,
  AvailabilityStatus,
  CreateUserDto,
  CreateLikeDto,
  CreateAvailabilityDto,
} from './types';

// Re-export types for convenience
export type { User, LikeResponse, MatchData, AvailabilitySlot, CommonSlotResult, AvailabilityStatus };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ========== Helper ==========

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();

  if (!res.ok) {
    // If backend returns detailed validation errors, show them
    if (json.errors && Array.isArray(json.errors)) {
      throw new Error(json.errors.join('\n'));
    }
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  // Unwrap the { success, data, timestamp } envelope
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

// ========== USERS ==========

export async function createUser(data: CreateUserDto): Promise<User> {
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

export async function createLike(data: CreateLikeDto): Promise<LikeResponse> {
  return apiRequest<LikeResponse>(`${API_BASE}/api/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

export async function saveAvailability(data: CreateAvailabilityDto): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(`${API_BASE}/api/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getAvailability(userId: string, matchId: string): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(
    `${API_BASE}/api/availability/user?userId=${userId}&matchId=${matchId}`,
    { cache: 'no-store' },
  );
}

export async function getAllUserAvailability(userId: string): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(
    `${API_BASE}/api/availability/user/${userId}/all`,
    { cache: 'no-store' },
  );
}

export async function findCommonSlot(matchId: string): Promise<CommonSlotResult> {
  return apiRequest<CommonSlotResult>(
    `${API_BASE}/api/availability/common-slot/${matchId}`,
    { cache: 'no-store' },
  );
}

export async function getAvailabilityStatus(matchId: string): Promise<AvailabilityStatus> {
  return apiRequest<AvailabilityStatus>(
    `${API_BASE}/api/availability/status/${matchId}`,
    { cache: 'no-store' },
  );
}
