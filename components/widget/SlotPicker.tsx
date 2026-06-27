'use client';

import { useState, useCallback } from 'react';
import type { AvailabilitySlot } from '@/types';

interface SlotPickerProps {
  lawyerId: string;
  primaryColor?: string;
  onSlotSelected: (slot: AvailabilitySlot) => void;
}

function formatSlotTime(isoString: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
}

function formatDateLabel(isoString: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(isoString));
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function SlotPicker({ lawyerId, primaryColor = '#1A3050', onSlotSelected }: SlotPickerProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(today));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchSlots = useCallback(
    async (date: string) => {
      setLoading(true);
      setError(null);
      setSlots([]);
      setSelectedSlot(null);

      try {
        const params = new URLSearchParams({ date, timezone: clientTimezone });
        const res = await fetch(`/api/availability/${lawyerId}?${params.toString()}`);
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? '슬롯 조회 실패');
        }
        const data = (await res.json()) as { slots: AvailabilitySlot[] };
        setSlots(data.slots);
      } catch (e) {
        setError(e instanceof Error ? e.message : '슬롯을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [lawyerId, clientTimezone]
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate) {
      void fetchSlots(newDate);
    }
  };

  const handleSlotClick = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    onSlotSelected(slot);
  };

  const minDate = toLocalDateString(today);

  return (
    <div>
      {/* Date picker */}
      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="slot-date"
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748B',
            marginBottom: '8px',
          }}
        >
          날짜 선택
        </label>
        <input
          id="slot-date"
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={handleDateChange}
          style={{
            border: '1px solid #C8D3E3',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '14px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: '#0F1923',
            background: '#fff',
            outline: 'none',
            accentColor: primaryColor,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3D5A80';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,90,128,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#C8D3E3';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#64748B', padding: '32px 0' }}>
          <div
            style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              border: '2px solid #E8EDF4',
              borderTopColor: '#1A3050',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '10px', fontSize: '13px' }}>가용 시간을 불러오는 중...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* No slots */}
      {!loading && !error && slots.length === 0 && selectedDate && (
        <div
          style={{
            textAlign: 'center',
            color: '#64748B',
            padding: '32px 0',
            fontSize: '14px',
            background: '#F8FAFC',
            border: '1px dashed #C8D3E3',
            borderRadius: '8px',
          }}
        >
          선택한 날짜에 가용 시간이 없습니다.
          <br />
          <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
            다른 날짜를 선택해보세요.
          </span>
        </div>
      )}

      {/* Slots grid */}
      {!loading && slots.length > 0 && (
        <div>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#1A3050',
              marginBottom: '12px',
            }}
          >
            {formatDateLabel(slots[0]!.start)}
          </p>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
            현지 시각({clientTimezone}) 기준 · {slots.length}개 가용 슬롯
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: '8px',
            }}
          >
            {slots.map((slot) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <button
                  key={slot.start}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    padding: '12px 8px',
                    border: `2px solid ${isSelected ? primaryColor : '#C8D3E3'}`,
                    borderRadius: '8px',
                    background: isSelected ? primaryColor : '#fff',
                    color: isSelected ? '#fff' : '#0F1923',
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    fontFamily: 'inherit',
                    letterSpacing: '0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#3D5A80';
                      e.currentTarget.style.background = '#EDF1F7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#C8D3E3';
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  {formatSlotTime(slot.start)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
