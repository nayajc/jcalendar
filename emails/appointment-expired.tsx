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

export interface AppointmentExpiredProps {
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  widgetUrl?: string;
}

export default function AppointmentExpired({
  clientName,
  lawyerName,
  slotStartFormatted,
  slotEndFormatted,
  widgetUrl,
}: AppointmentExpiredProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>상담 예약이 만료되었습니다 — 재예약 안내</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>상담 예약 만료</Heading>
          <Text style={text}>안녕하세요, {clientName}님.</Text>
          <Text style={text}>
            죄송합니다. <strong>{lawyerName}</strong>님의 승인이 24시간
            내 이루어지지 않아 아래 예약 요청이 자동 만료되었습니다.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>만료된 예약 정보</Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>담당 상담사:</strong> {lawyerName}
            </Text>
          </Section>

          {widgetUrl ? (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <a href={widgetUrl} style={button}>
                다시 예약하기
              </a>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            불편을 드려 죄송합니다. 다른 일정으로 재예약을 원하시면 위 버튼을
            이용해 주세요.
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
  color: '#d97706',
  marginBottom: '16px',
};

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
};

const card: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #d97706',
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

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#d97706',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '14px',
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
