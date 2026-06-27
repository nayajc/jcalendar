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

export interface LawyerNotificationProps {
  lawyerName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  inquiry: string;
  dashboardUrl?: string;
}

export default function LawyerNotification({
  lawyerName,
  clientName,
  clientPhone,
  clientEmail,
  slotStartFormatted,
  slotEndFormatted,
  inquiry,
  dashboardUrl,
}: LawyerNotificationProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>새 상담 예약이 접수되었습니다 — {clientName}님</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>새 상담 예약 알림</Heading>
          <Text style={text}>안녕하세요, {lawyerName} 변호사님.</Text>
          <Text style={text}>
            새로운 상담 예약이 접수되었습니다. 대시보드에서 승인 또는 거절해
            주세요.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>예약 상세</Text>
            <Text style={cardRow}>
              <strong>상담자:</strong> {clientName}
            </Text>
            <Text style={cardRow}>
              <strong>전화번호:</strong> {clientPhone}
            </Text>
            <Text style={cardRow}>
              <strong>이메일:</strong> {clientEmail}
            </Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>문의 내용:</strong>
            </Text>
            <Text style={{ ...cardRow, whiteSpace: 'pre-wrap' }}>{inquiry}</Text>
          </Section>

          {dashboardUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <a href={dashboardUrl} style={button}>
                대시보드에서 확인하기
              </a>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            24시간 내 승인하지 않으면 예약이 자동 만료됩니다.
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
  color: '#111827',
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

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#3b82f6',
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
