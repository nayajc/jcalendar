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

export interface AppointmentRejectedProps {
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  widgetUrl?: string;
}

export default function AppointmentRejected({
  clientName,
  lawyerName,
  slotStartFormatted,
  slotEndFormatted,
  widgetUrl,
}: AppointmentRejectedProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>상담 예약이 거절되었습니다 — {lawyerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>상담 예약 거절</Heading>
          <Text style={text}>안녕하세요, {clientName}님.</Text>
          <Text style={text}>
            죄송합니다. <strong>{lawyerName}</strong>님의 사정으로 인해
            아래 예약 요청을 수락하기 어렵게 되었습니다.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>거절된 예약 정보</Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>담당 상담사:</strong> {lawyerName}
            </Text>
          </Section>

          {widgetUrl && (
            <Text style={text}>
              다른 일정으로 다시 예약하시려면{' '}
              <a href={widgetUrl} style={link}>
                여기
              </a>
              를 클릭하세요.
            </Text>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            불편을 드려 대단히 죄송합니다. 다른 일정으로 재예약을 부탁드립니다.
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
  color: '#dc2626',
  marginBottom: '16px',
};

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
};

const card: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #dc2626',
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
