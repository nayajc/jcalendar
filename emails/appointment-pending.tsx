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

export interface AppointmentPendingProps {
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  inquiry: string;
  widgetUrl?: string;
  manageUrl?: string;
}

export default function AppointmentPending({
  clientName,
  lawyerName,
  slotStartFormatted,
  slotEndFormatted,
  inquiry,
  widgetUrl,
  manageUrl,
}: AppointmentPendingProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>
        {lawyerName} 상담 예약이 접수되었습니다 — 승인 대기 중
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>상담 예약 접수 완료</Heading>
          <Text style={text}>안녕하세요, {clientName}님.</Text>
          <Text style={text}>
            <strong>{lawyerName}</strong>님께 상담 예약이 정상적으로
            접수되었습니다. 담당 상담사의 승인 후 확정 안내 메일을 보내드립니다.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>예약 정보</Text>
            <Text style={cardRow}>
              <strong>일시:</strong> {slotStartFormatted} – {slotEndFormatted}
            </Text>
            <Text style={cardRow}>
              <strong>담당 상담사:</strong> {lawyerName}
            </Text>
            <Text style={cardRow}>
              <strong>문의 내용:</strong> {inquiry}
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
            예약 승인까지 최대 24시간이 소요될 수 있습니다.
            {widgetUrl && (
              <>
                {' '}
                예약을 변경하시려면{' '}
                <a href={widgetUrl} style={link}>
                  여기
                </a>
                에서 새로 예약해 주세요.
              </>
            )}
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

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
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

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  lineHeight: '1.5',
};

const link: React.CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
