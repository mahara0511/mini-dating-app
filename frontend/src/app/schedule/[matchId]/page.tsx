'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getMatch,
  saveAvailability,
  getAvailability,
  findCommonSlot,
  getAvailabilityStatus,
  MatchData,
  AvailabilitySlot,
  CommonSlotResult,
} from '@/lib/api';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export default function SchedulePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finding, setFinding] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [mySlots, setMySlots] = useState<TimeSlot[]>([]);
  const [existingSlots, setExistingSlots] = useState<AvailabilitySlot[]>([]);
  const [commonSlotResult, setCommonSlotResult] = useState<CommonSlotResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    userAHasSlots: boolean;
    userBHasSlots: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentUserId');
    const name = localStorage.getItem('currentUserName');
    if (!id) {
      router.push('/login');
      return;
    }
    setCurrentUserId(id);
    setCurrentUserName(name);
    loadData(id);
  }, [matchId]);

  const loadData = async (userId: string) => {
    try {
      const [matchData, slots, status] = await Promise.all([
        getMatch(matchId),
        getAvailability(userId, matchId),
        getAvailabilityStatus(matchId),
      ]);
      setMatch(matchData);
      setExistingSlots(slots);
      setAvailabilityStatus(status);

      // If already have slots, convert to form state
      if (slots.length > 0) {
        setMySlots(slots.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })));
        setSaved(true);
      }

      // If match already has schedule, show it
      if (matchData.scheduledDate) {
        setCommonSlotResult({
          found: true,
          date: matchData.scheduledDate,
          startTime: matchData.scheduledTimeStart || '',
          endTime: matchData.scheduledTimeEnd || '',
          message: `✅ Hai bạn có date hẹn vào: ${formatDateStr(matchData.scheduledDate)} từ ${matchData.scheduledTimeStart} đến ${matchData.scheduledTimeEnd}`,
        });
      }
    } catch (err) {
      console.error('Failed to load schedule data', err);
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate next 3 weeks of dates
  const getNext3Weeks = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const addSlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMySlots([...mySlots, {
      date: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
    }]);
    setSaved(false);
  };

  const removeSlot = (index: number) => {
    setMySlots(mySlots.filter((_, i) => i !== index));
    setSaved(false);
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...mySlots];
    updated[index] = { ...updated[index], [field]: value };
    setMySlots(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!currentUserId || mySlots.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 slot thời gian', 'error');
      return;
    }

    // Validate slots
    for (const slot of mySlots) {
      if (slot.startTime >= slot.endTime) {
        showToast('Giờ bắt đầu phải nhỏ hơn giờ kết thúc', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await saveAvailability(currentUserId, matchId, mySlots);
      setSaved(true);
      showToast('✅ Đã lưu thời gian rảnh!', 'success');

      // Refresh status
      const status = await getAvailabilityStatus(matchId);
      setAvailabilityStatus(status);
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFindSlot = async () => {
    setFinding(true);
    try {
      const result = await findCommonSlot(matchId);
      setCommonSlotResult(result);

      if (result.found) {
        // Reload match data to get new schedule
        const updated = await getMatch(matchId);
        setMatch(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Có lỗi khi tìm slot', 'error');
    } finally {
      setFinding(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDateStr = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    });
  };

  const getPartner = () => {
    if (!match || !currentUserId) return null;
    return match.userAId === currentUserId ? match.userB : match.userA;
  };

  const partner = getPartner();
  const dates3Weeks = getNext3Weeks();

  const userIsA = match?.userAId === currentUserId;
  const myAvailabilitySet = userIsA ? availabilityStatus?.userAHasSlots : availabilityStatus?.userBHasSlots;
  const partnerAvailabilitySet = userIsA ? availabilityStatus?.userBHasSlots : availabilityStatus?.userAHasSlots;

  if (loading) {
    return (
      <>
        <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div className="spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
      <main className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            📅 Đề xuất lịch hẹn
          </h1>
          {partner && (
            <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
              Hẹn lịch với <strong style={{ color: '#f093fb' }}>{partner.name}</strong>
            </p>
          )}
        </div>

        {/* Availability Status */}
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.4)', marginBottom: '4px' }}>Bạn</p>
              <span style={{
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: myAvailabilitySet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: myAvailabilitySet ? '#6ee7b7' : '#fca5a5',
              }}>
                {myAvailabilitySet ? '✅ Đã chọn' : '⏳ Chưa chọn'}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'rgba(226, 232, 240, 0.2)' }}>💕</div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.4)', marginBottom: '4px' }}>{partner?.name}</p>
              <span style={{
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: partnerAvailabilitySet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: partnerAvailabilitySet ? '#6ee7b7' : '#fca5a5',
              }}>
                {partnerAvailabilitySet ? '✅ Đã chọn' : '⏳ Chưa chọn'}
              </span>
            </div>
          </div>
        </div>

        {/* If already scheduled */}
        {commonSlotResult?.found && (
          <div className="glass-card" style={{
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.08)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: '#6ee7b7',
            }}>
              Date đã được xác nhận!
            </h3>
            <p style={{ color: '#a7f3d0', fontSize: '1.05rem', lineHeight: 1.7 }}>
              {commonSlotResult.message}
            </p>
            <div style={{ marginTop: '20px' }}>
              <a href="/matches">
                <button className="btn-primary" style={{ padding: '12px 24px' }}>
                  ← Về trang Matches
                </button>
              </a>
            </div>
          </div>
        )}

        {/* No match found yet */}
        {commonSlotResult && !commonSlotResult.found && (
          <div className="glass-card" style={{
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'center',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            background: 'rgba(245, 158, 11, 0.08)',
          }}>
            <p style={{ color: '#fcd34d', fontSize: '0.95rem' }}>
              ⚠️ {commonSlotResult.message}
            </p>
          </div>
        )}

        {/* My Availability Form */}
        {!commonSlotResult?.found && (
          <>
            <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>
                  🕐 Thời gian rảnh của bạn
                </h3>
                <button
                  className="btn-primary"
                  onClick={addSlot}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  + Thêm slot
                </button>
              </div>

              {mySlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(226, 232, 240, 0.4)' }}>
                  <p style={{ marginBottom: '12px' }}>Chưa có slot nào. Nhấn &quot;+ Thêm slot&quot; để bắt đầu.</p>
                  <p style={{ fontSize: '0.8rem' }}>Chọn ngày và khoảng giờ bạn rảnh trong 3 tuần tới</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mySlots.map((slot, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: '1 1 160px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(226, 232, 240, 0.4)', display: 'block', marginBottom: '4px' }}>
                          Ngày
                        </label>
                        <select
                          className="select-field"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                          value={slot.date}
                          onChange={(e) => updateSlot(index, 'date', e.target.value)}
                        >
                          {dates3Weeks.map((d) => (
                            <option key={d} value={d}>
                              {formatShortDate(d)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: '0 1 120px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(226, 232, 240, 0.4)', display: 'block', marginBottom: '4px' }}>
                          Từ
                        </label>
                        <input
                          type="time"
                          className="input-field"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                        />
                      </div>

                      <div style={{ flex: '0 1 120px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(226, 232, 240, 0.4)', display: 'block', marginBottom: '4px' }}>
                          Đến
                        </label>
                        <input
                          type="time"
                          className="input-field"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => removeSlot(index)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                          color: '#fca5a5',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          alignSelf: 'flex-end',
                          marginTop: '16px',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {mySlots.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ flex: 1, padding: '14px' }}
                  >
                    {saving ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                        Đang lưu...
                      </span>
                    ) : saved ? (
                      '✅ Đã lưu'
                    ) : (
                      '💾 Lưu thời gian rảnh'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Find Common Slot Button */}
            {myAvailabilitySet && partnerAvailabilitySet && (
              <div className="glass-card" style={{
                padding: '28px',
                textAlign: 'center',
                borderColor: 'rgba(102, 126, 234, 0.3)',
                background: 'rgba(102, 126, 234, 0.08)',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#e2e8f0' }}>
                  🎯 Cả hai đều đã chọn thời gian!
                </h3>
                <p style={{ color: 'rgba(226, 232, 240, 0.5)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Nhấn nút bên dưới để tìm thời gian trùng nhau
                </p>
                <button
                  className="btn-secondary"
                  onClick={handleFindSlot}
                  disabled={finding}
                  style={{ padding: '14px 32px', fontSize: '1rem' }}
                >
                  {finding ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                      Đang tìm...
                    </span>
                  ) : (
                    '🔍 Tìm thời gian trùng'
                  )}
                </button>
              </div>
            )}

            {myAvailabilitySet && !partnerAvailabilitySet && (
              <div className="glass-card" style={{
                padding: '24px',
                textAlign: 'center',
                borderColor: 'rgba(245, 158, 11, 0.2)',
                background: 'rgba(245, 158, 11, 0.05)',
              }}>
                <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.9rem' }}>
                  ⏳ Đang chờ <strong style={{ color: '#f093fb' }}>{partner?.name}</strong> chọn thời gian rảnh...
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
