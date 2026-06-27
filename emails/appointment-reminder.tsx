import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface AppointmentReminderProps {
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  kind: '24h' | '1h';
  manageUrl?: string;
}

export default function AppointmentReminder({
  clientName,
  lawyerName,
  slotStartFormatted,
  slotEndFormatted,
  kind,
  manageUrl,
}: AppointmentReminderProps) {
  const kindLabel = kind === '24h' ? '24시간 전' : '1시간 전';
  const kindDescription =
    kind === '24h'
      ? '내일 예정된 상담 일정을 안내드립니다. 준비사항을 미리 확인해 주세요.'
      : '1시간 후 상담이 시작됩니다. 잊지 말고 준비해 주세요.';

  return (
    <Html lang="ko">
      <Head />
      <Preview>
        [{kindLabel} 알림] {lawyerName} 변호사 상담 예정 — {slotStartFormatted}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>상담 일정 리마인더 ({kindLabel})</Heading>
          <Text style={text}>안녕하세요, {clientName}님.</Text>
          <Text style={text}>{kindDescription}</Text>

          <Section style={card}>
            <Text style={cardTitle}>상담 예약 정보</Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>담당 변호사:</strong> {lawyerName}
            </Text>
          </Section>

          {manageUrl && (
            <Section style={buttonSection}>
              <Link href={manageUrl} style={button}>
                예약 확인/취소하기
              </Link>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            본 메일은 자동 발송된 리마인더입니다. 일정 변경이 필요하시면 담당
            변호사에게 직접 연락해 주세요.
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
  color: '#1e3a5f',
  marginBottom: '16px',
};

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
};

const card: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #1e3a5f',
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

const buttonSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
};

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1e3a5f',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
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
