import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface AppointmentCancelledProps {
  recipientName: string;
  cancelledBy: 'lawyer' | 'client';
  lawyerName: string;
  clientName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  widgetUrl?: string;
}

export default function AppointmentCancelled({
  recipientName,
  cancelledBy,
  lawyerName,
  clientName,
  slotStartFormatted,
  slotEndFormatted,
  widgetUrl,
}: AppointmentCancelledProps) {
  const cancellerLabel = cancelledBy === 'lawyer' ? `${lawyerName} 변호사` : `${clientName}님`;

  return (
    <Html lang="ko">
      <Head />
      <Preview>상담 예약이 취소되었습니다 — {slotStartFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>상담 예약 취소</Heading>
          <Text style={text}>안녕하세요, {recipientName}님.</Text>
          <Text style={text}>
            <strong>{cancellerLabel}</strong>에 의해 아래 상담 예약이
            취소되었습니다.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>취소된 예약 정보</Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>담당 변호사:</strong> {lawyerName}
            </Text>
            <Text style={cardRow}>
              <strong>상담자:</strong> {clientName}
            </Text>
          </Section>

          {cancelledBy === 'lawyer' && widgetUrl && (
            <Text style={text}>
              새 예약을 원하시면{' '}
              <a href={widgetUrl} style={link}>
                여기
              </a>
              에서 다시 예약해 주세요.
            </Text>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            문의 사항은 담당 변호사에게 직접 연락해 주세요.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  fontFamily: "'Noto Sans KR', sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#6b7280',
  marginBottom: '16px',
};

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
};

const card: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
};

const cardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '12px',
};

const cardRow: React.CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  margin: '6px 0',
};

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  lineHeight: '1.5',
};

const link: React.CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
