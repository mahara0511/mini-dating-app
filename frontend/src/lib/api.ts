const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

// ========== USERS ==========
export async function createUser(data: {
  name: string;
  age: number;
  gender: string;
  bio: string;
  email: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create user');
  }
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await fetch(`${API_BASE}/api/users/by-email?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data || null;
}

export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

// ========== LIKES ==========
export async function createLike(fromUserId: string, toUserId: string): Promise<LikeResponse> {
  const res = await fetch(`${API_BASE}/api/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUserId, toUserId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to like');
  }
  return res.json();
}

export async function checkLiked(fromUserId: string, toUserId: string): Promise<boolean> {
  const res = await fetch(
    `${API_BASE}/api/likes/check?fromUserId=${fromUserId}&toUserId=${toUserId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to check like');
  return res.json();
}

// ========== MATCHES ==========
export async function getMatches(userId: string): Promise<MatchData[]> {
  const res = await fetch(`${API_BASE}/api/matches/user/${userId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function getMatch(matchId: string): Promise<MatchData> {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch match');
  return res.json();
}

// ========== AVAILABILITY ==========
export async function saveAvailability(
  userId: string,
  matchId: string,
  slots: AvailabilitySlot[],
): Promise<AvailabilitySlot[]> {
  const res = await fetch(`${API_BASE}/api/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId, slots }),
  });
  if (!res.ok) throw new Error('Failed to save availability');
  return res.json();
}

export async function getAvailability(userId: string, matchId: string): Promise<AvailabilitySlot[]> {
  const res = await fetch(
    `${API_BASE}/api/availability/user?userId=${userId}&matchId=${matchId}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function findCommonSlot(matchId: string): Promise<CommonSlotResult> {
  const res = await fetch(`${API_BASE}/api/availability/common-slot/${matchId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to find common slot');
  return res.json();
}

export async function getAvailabilityStatus(matchId: string): Promise<{
  userAHasSlots: boolean;
  userBHasSlots: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/availability/status/${matchId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch availability status');
  return res.json();
}
