'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getMatch,
  saveAvailability,
  getAvailability,
  getAllUserAvailability,
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
  const [otherMatchSlots, setOtherMatchSlots] = useState<AvailabilitySlot[]>([]);
  const [commonSlotResult, setCommonSlotResult] = useState<CommonSlotResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    userAHasSlots: boolean;
    userBHasSlots: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

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
      const [matchData, slots, status, allSlots] = await Promise.all([
        getMatch(matchId),
        getAvailability(userId, matchId),
        getAvailabilityStatus(matchId),
        getAllUserAvailability(userId),
      ]);
      setMatch(matchData);
      setExistingSlots(slots);
      setAvailabilityStatus(status);

      // Slots from other matches (not the current one)
      const otherSlots = allSlots.filter((s) => s.matchId !== matchId);
      setOtherMatchSlots(otherSlots);

      if (slots.length > 0) {
        setMySlots(slots.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })));
        setSaved(true);
      }

      if (matchData.scheduledDate) {
        setCommonSlotResult({
          found: true,
          date: matchData.scheduledDate,
          startTime: matchData.scheduledTimeStart || '',
          endTime: matchData.scheduledTimeEnd || '',
          message: `You have a date on: ${formatDateStr(matchData.scheduledDate)} from ${matchData.scheduledTimeStart} to ${matchData.scheduledTimeEnd}`,
        });
      }
    } catch (err) {
      console.error('Failed to load schedule data', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Date range: tomorrow to 3 weeks from today
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 21);
    return { minDate, maxDate };
  }, []);

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isDateInRange = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d >= dateRange.minDate && d <= dateRange.maxDate;
  };

  const slotsOnDate = (dateStr: string) => mySlots.filter((s) => s.date === dateStr);
  const otherSlotsOnDate = (dateStr: string) => otherMatchSlots.filter((s) => s.date === dateStr);

  const canGoToPrevMonth = () => {
    const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0);
    return lastDay >= dateRange.minDate;
  };

  const canGoToNextMonth = () => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    return next <= dateRange.maxDate;
  };

  // Overlap check for a specific date
  const hasOverlap = (slots: TimeSlot[], otherSlots: AvailabilitySlot[]): { hasOverlap: boolean; internalI: number; internalJ: number; externalI: number; externalOtherIdx: number } => {
    // Check internal overlaps
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].date === slots[j].date) {
          const startA = timeToMinutes(slots[i].startTime);
          const endA = timeToMinutes(slots[i].endTime);
          const startB = timeToMinutes(slots[j].startTime);
          const endB = timeToMinutes(slots[j].endTime);
          if (startA < endB && startB < endA) {
            return { hasOverlap: true, internalI: i, internalJ: j, externalI: -1, externalOtherIdx: -1 };
          }
        }
      }
    }
    // Check external overlaps
    for (let i = 0; i < slots.length; i++) {
      for (let k = 0; k < otherSlots.length; k++) {
        if (slots[i].date === otherSlots[k].date) {
          const startA = timeToMinutes(slots[i].startTime);
          const endA = timeToMinutes(slots[i].endTime);
          const startB = timeToMinutes(otherSlots[k].startTime);
          const endB = timeToMinutes(otherSlots[k].endTime);
          if (startA < endB && startB < endA) {
            return { hasOverlap: true, internalI: -1, internalJ: -1, externalI: i, externalOtherIdx: k };
          }
        }
      }
    }
    return { hasOverlap: false, internalI: -1, internalJ: -1, externalI: -1, externalOtherIdx: -1 };
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const addSlotForDate = (dateStr: string) => {
    setMySlots([...mySlots, { date: dateStr, startTime: '09:00', endTime: '12:00' }]);
    setSaved(false);
  };

  const removeSlot = (index: number) => {
    const removed = mySlots[index];
    const updated = mySlots.filter((_, i) => i !== index);
    setMySlots(updated);
    setSaved(false);
    // If no more slots on this date and it was selected, keep selection
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...mySlots];
    updated[index] = { ...updated[index], [field]: value };
    setMySlots(updated);
    setSaved(false);
  };

  const overlapResult = useMemo(() => hasOverlap(mySlots, otherMatchSlots), [mySlots, otherMatchSlots]);

  const handleSave = async () => {
    if (!currentUserId || mySlots.length === 0) {
      showToast('Please add at least 1 time slot', 'error');
      return;
    }

    for (const slot of mySlots) {
      if (slot.startTime >= slot.endTime) {
        showToast('Start time must be before end time', 'error');
        return;
      }
    }

    if (overlapResult.hasOverlap) {
      showToast('You have overlapping time slots. Please fix them first.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveAvailability({ userId: currentUserId, matchId, slots: mySlots });
      setSaved(true);
      showToast('Availability saved!', 'success');

      const status = await getAvailabilityStatus(matchId);
      setAvailabilityStatus(status);
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
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
        const updated = await getMatch(matchId);
        setMatch(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Error finding slot', 'error');
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPartner = () => {
    if (!match || !currentUserId) return null;
    return match.userAId === currentUserId ? match.userB : match.userA;
  };

  const partner = getPartner();

  const userIsA = match?.userAId === currentUserId;
  const myAvailabilitySet = userIsA ? availabilityStatus?.userAHasSlots : availabilityStatus?.userBHasSlots;
  const partnerAvailabilitySet = userIsA ? availabilityStatus?.userBHasSlots : availabilityStatus?.userAHasSlots;

  const selectedDateSlots = selectedDate ? mySlots.filter((s) => s.date === selectedDate) : [];
  const selectedDateOtherSlots = selectedDate ? otherMatchSlots.filter((s) => s.date === selectedDate) : [];

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

  // Calendar render
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
      <main className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Back button */}
        <a
          href="/matches"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(226, 232, 240, 0.5)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            marginBottom: '20px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(226, 232, 240, 0.5)')}
        >
          ← Back to Matches
        </a>

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
            Schedule a Date
          </h1>
          {partner && (
            <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
              Schedule with <strong style={{ color: '#f093fb' }}>{partner.name}</strong>
            </p>
          )}
        </div>

        {/* Availability Status */}
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.4)', marginBottom: '4px' }}>You</p>
              <span style={{
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: myAvailabilitySet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: myAvailabilitySet ? '#6ee7b7' : '#fca5a5',
              }}>
                {myAvailabilitySet ? 'Selected' : 'Not selected'}
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
                {partnerAvailabilitySet ? 'Selected' : 'Not selected'}
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
              Date confirmed!
            </h3>
            <p style={{ color: '#a7f3d0', fontSize: '1.05rem', lineHeight: 1.7 }}>
              {commonSlotResult.message}
            </p>
            <div style={{ marginTop: '20px' }}>
              <a href="/matches">
                <button className="btn-primary" style={{ padding: '12px 24px' }}>
                  ← Back to Matches
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

        {/* Calendar + Slots Form */}
        {!commonSlotResult?.found && (
          <>
            <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '20px' }}>
                Pick your available dates & times
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(226, 232, 240, 0.4)', marginBottom: '20px' }}>
                Select a date on the calendar, then add your available time slots. Dates are limited to the next 3 weeks.
              </p>

              {/* Calendar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '20px',
                marginBottom: '24px',
              }}>
                {/* Month nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    disabled={!canGoToPrevMonth()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canGoToPrevMonth() ? '#e2e8f0' : 'rgba(226, 232, 240, 0.15)',
                      fontSize: '1.2rem',
                      cursor: canGoToPrevMonth() ? 'pointer' : 'not-allowed',
                      padding: '4px 10px',
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>{monthName}</span>
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    disabled={!canGoToNextMonth()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canGoToNextMonth() ? '#e2e8f0' : 'rgba(226, 232, 240, 0.15)',
                      fontSize: '1.2rem',
                      cursor: canGoToNextMonth() ? 'pointer' : 'not-allowed',
                      padding: '4px 10px',
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Weekday headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
                  {weekDays.map((d) => (
                    <div key={d} style={{
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'rgba(226, 232, 240, 0.35)',
                      padding: '4px 0',
                    }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {/* Empty cells for first row offset */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = toDateStr(new Date(year, month, day));
                    const inRange = isDateInRange(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const slotCount = slotsOnDate(dateStr).length;
                    const otherCount = otherSlotsOnDate(dateStr).length;

                    return (
                      <button
                        key={day}
                        disabled={!inRange}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid #4facfe'
                            : slotCount > 0
                            ? '2px solid rgba(16, 185, 129, 0.4)'
                            : otherCount > 0
                            ? '2px solid rgba(245, 158, 11, 0.3)'
                            : '1px solid transparent',
                          background: isSelected
                            ? 'rgba(79, 172, 254, 0.18)'
                            : slotCount > 0
                            ? 'rgba(16, 185, 129, 0.1)'
                            : otherCount > 0
                            ? 'rgba(245, 158, 11, 0.06)'
                            : inRange
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'transparent',
                          color: !inRange
                            ? 'rgba(226, 232, 240, 0.15)'
                            : isSelected
                            ? '#4facfe'
                            : '#e2e8f0',
                          cursor: inRange ? 'pointer' : 'default',
                          fontSize: '0.85rem',
                          fontWeight: isSelected || slotCount > 0 || otherCount > 0 ? 700 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day}
                        {slotCount > 0 && (
                          <span style={{
                            fontSize: '0.55rem',
                            color: '#6ee7b7',
                            marginTop: '1px',
                          }}>
                            {slotCount} slot{slotCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {otherCount > 0 && slotCount === 0 && (
                          <span style={{
                            fontSize: '0.55rem',
                            color: '#fbbf24',
                            marginTop: '1px',
                          }}>
                            {otherCount} busy
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected date info + add slot */}
              {selectedDate && (
                <div style={{
                  background: 'rgba(79, 172, 254, 0.06)',
                  border: '1px solid rgba(79, 172, 254, 0.15)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4facfe' }}>
                      📅 {formatDateStr(selectedDate)}
                    </h4>
                    <button
                      className="btn-primary"
                      onClick={() => addSlotForDate(selectedDate)}
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      + Add time slot
                    </button>
                  </div>

                  {selectedDateSlots.length === 0 ? (
                    <p style={{ color: 'rgba(226, 232, 240, 0.35)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
                      No time slots for this date. Click &quot;+ Add time slot&quot; above.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedDateSlots.map((slot) => {
                        const globalIndex = mySlots.findIndex(
                          (s) => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime
                        );
                        const isOverlapping =
                          (overlapResult.hasOverlap && (globalIndex === overlapResult.internalI || globalIndex === overlapResult.internalJ || globalIndex === overlapResult.externalI));

                        return (
                          <div
                            key={globalIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px',
                              background: isOverlapping
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                              border: isOverlapping
                                ? '1px solid rgba(239, 68, 68, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div style={{ flex: '1' }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(226, 232, 240, 0.4)', display: 'block', marginBottom: '4px' }}>
                                From
                              </label>
                              <input
                                type="time"
                                lang="en"
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                value={slot.startTime}
                                onChange={(e) => updateSlot(globalIndex, 'startTime', e.target.value)}
                              />
                            </div>
                            <div style={{ flex: '1' }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(226, 232, 240, 0.4)', display: 'block', marginBottom: '4px' }}>
                                To
                              </label>
                              <input
                                type="time"
                                lang="en"
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                value={slot.endTime}
                                onChange={(e) => updateSlot(globalIndex, 'endTime', e.target.value)}
                              />
                            </div>
                            <button
                              onClick={() => removeSlot(globalIndex)}
                              title="Remove slot"
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: '#fca5a5',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                alignSelf: 'flex-end',
                                marginTop: '14px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}

                      {isOverlappingOnDate(selectedDate) && (
                        <p style={{
                          color: '#fca5a5',
                          fontSize: '0.8rem',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          ⚠️ You have overlapping time slots on this date
                        </p>
                      )}
                    </div>
                  )}

                  {/* Other match slots (read-only) */}
                  {selectedDateOtherSlots.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24', marginBottom: '8px' }}>
                        🔒 Busy from other matches ({selectedDateOtherSlots.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {selectedDateOtherSlots.map((slot, i) => (
                          <div
                            key={`other-${i}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: 'rgba(245, 158, 11, 0.06)',
                              borderRadius: '10px',
                              border: '1px solid rgba(245, 158, 11, 0.15)',
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.5)' }}>
                              Other match
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary of all slots */}
              {mySlots.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(226, 232, 240, 0.6)', marginBottom: '10px' }}>
                    All your time slots ({mySlots.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[...mySlots]
                      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                      .map((slot, i) => {
                        const gIdx = mySlots.indexOf(slot);
                        const isOvr = overlapResult.hasOverlap && (gIdx === overlapResult.internalI || gIdx === overlapResult.internalJ || gIdx === overlapResult.externalI);
                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedDate(slot.date)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 14px',
                              background: isOvr ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '10px',
                              border: isOvr ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                          >
                            <span style={{ fontSize: '0.83rem', color: isOvr ? '#fca5a5' : '#e2e8f0' }}>
                              {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '0.83rem', color: isOvr ? '#fca5a5' : 'rgba(226, 232, 240, 0.6)' }}>
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Overlap warning */}
              {overlapResult.hasOverlap && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '16px',
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '0.85rem' }}>
                    ⚠️ {overlapResult.internalI !== -1 
                        ? 'You have overlapping time slots. Please fix them before saving.'
                        : 'One of your time slots conflicts with another match. Please fix it before saving.'}
                  </p>
                </div>
              )}

              {/* Save button */}
              {mySlots.length > 0 && (
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || overlapResult.hasOverlap}
                  style={{
                    width: '100%',
                    padding: '14px',
                    opacity: overlapResult.hasOverlap ? 0.5 : 1,
                  }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                       Saving...
                    </span>
                  ) : saved ? (
                    '✓ Saved'
                  ) : (
                    'Save availability'
                  )}
                </button>
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
                  Both of you have selected your times!
                </h3>
                <p style={{ color: 'rgba(226, 232, 240, 0.5)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Click the button below to find overlapping times
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
                       Finding...
                    </span>
                  ) : (
                    'Find overlapping times'
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
                  Waiting for <strong style={{ color: '#f093fb' }}>{partner?.name}</strong> to select their availability...
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

  function isOverlappingOnDate(dateStr: string): boolean {
    const slotsForDate = mySlots.filter((s) => s.date === dateStr);
    const otherSlotsForDate = otherMatchSlots.filter((s) => s.date === dateStr);

    for (let i = 0; i < slotsForDate.length; i++) {
      for (let j = i + 1; j < slotsForDate.length; j++) {
        const startA = timeToMinutes(slotsForDate[i].startTime);
        const endA = timeToMinutes(slotsForDate[i].endTime);
        const startB = timeToMinutes(slotsForDate[j].startTime);
        const endB = timeToMinutes(slotsForDate[j].endTime);
        if (startA < endB && startB < endA) return true;
      }
      for (let k = 0; k < otherSlotsForDate.length; k++) {
        const startA = timeToMinutes(slotsForDate[i].startTime);
        const endA = timeToMinutes(slotsForDate[i].endTime);
        const startB = timeToMinutes(otherSlotsForDate[k].startTime);
        const endB = timeToMinutes(otherSlotsForDate[k].endTime);
        if (startA < endB && startB < endA) return true;
      }
    }
    return false;
  }
}
