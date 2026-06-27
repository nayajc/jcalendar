# Deep Interview Spec: 변호사 상담 예약 캘린더 SaaS

## Metadata
- Interview ID: lawyer-booking-saas
- Rounds: 4
- Final Ambiguity Score: 13.6%
- Type: greenfield
- Generated: 2026-06-27
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.90 | 0.40 | 0.36 |
| Constraint Clarity | 0.90 | 0.30 | 0.27 |
| Success Criteria | 0.78 | 0.30 | 0.234 |
| **Total Clarity** | | | **0.864** |
| **Ambiguity** | | | **0.136** |

## Topology
| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| 인증 & 멀티테넌트 | active | 변호사별 로그인, 개별 캘린더 관리 | Firebase Auth, 수동 등록/초대(결제 없음) |
| Google Calendar 연동 | active | 가용 시간 조회, 겹침 방지, 확정 시 이벤트 생성 | 업무시간 − Google busy = 가용 슬롯 |
| 공개 예약 위젯 | active | 임베드 iframe/위젯 — 시간 선택 + 문의 폼 | iframe 임베드, 문의 내용·전화·이메일 |
| 예약 워크플로우 & 컨펌 | active | 변호사 이메일 알림, 승인/거절, 만료, 취소/재예약 | 이메일 기반, 컨펌 대기 만료 자동 해제 |
| 상담자 알림 | active | 대기중/확정 메시지 | 이메일만 (SMS/카카오 → v2 defer) |

## Goal
여러 변호사(멀티테넌트)가 각자 가입하여 자신의 Google Calendar와 연동된 상담 예약 캘린더를 관리하는 SaaS. 상담자는 변호사가 웹사이트에 임베드한 iframe 위젯을 통해, 변호사 업무시간에서 Google Calendar의 바쁜 시간을 제외한 가용 슬롯을 보고 예약하며 문의 내용·전화·이메일을 남긴다. 예약 시 변호사에게 이메일 알림이 가고 변호사가 승인/거절한다. 상담자는 예약 직후 "대기중", 컨펌 시 "확정" 알림을 이메일로 받는다. 이중예약은 방지되며 컨펌 대기는 일정 시간 후 자동 만료된다.

## Constraints
- 기술 스택: Next.js + Firebase (Auth, Firestore/DB), iframe 임베드
- 알림: 이메일 전용 (MVP)
- 결제/구독: 없음 (변호사 수동 등록/초대) — v2 defer
- 타임존: 다중 타임존 지원 (변호사별 설정, 해외 상담 대응)
- 멀티테넌트: 여러 변호사가 독립적으로 캘린더 관리
- 위젯: 외부 웹사이트에 iframe으로 삽입 가능

## Non-Goals
- SMS / 카카오톡 알림 (v2)
- 구독/결제 시스템 (v2)
- 셀프서비스 회원가입 자동화 (MVP는 수동 등록/초대 허용)

## Acceptance Criteria
- [ ] 변호사가 로그인하여 자신의 Google Calendar를 연결할 수 있다
- [ ] 변호사가 주간 업무시간, 상담 슬롯 길이, 슬롯 간 버퍼를 설정할 수 있다
- [ ] 위젯은 (업무시간 − Google busy − 기존 예약) 슬롯만 노출한다
- [ ] 상담자가 슬롯 선택 + 문의 내용·전화·이메일 입력으로 예약을 생성한다
- [ ] 한 슬롯이 대기중이면 다른 상담자가 동일 시간을 잡을 수 없다 (hold/이중예약 방지)
- [ ] 예약 생성 시 변호사에게 이메일 알림, 상담자에게 "대기중" 이메일 발송
- [ ] 변호사 승인 시 상담자에게 "확정" 이메일 발송 + Google Calendar 이벤트 생성
- [ ] 변호사가 N시간 내 컨펌하지 않으면 자동 만료 및 슬롯 해제
- [ ] 상담자/변호사가 확정 예약을 취소·재예약할 수 있다
- [ ] 위젯이 외부 사이트에 iframe으로 임베드되어 동작한다
- [ ] 타임존이 변호사별로 적용되어 상담자에게 올바른 현지 시간으로 표시된다

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 다중 변호사 SaaS는 결제 필요 | "MVP에 결제가 정말 필요한가?" | 결제 제거, 수동 등록/초대로 출시 가속 |
| 가용 시간 = Google 빈 시간 | 업무시간 개념 도입 여부 | 업무시간 − Google busy 모델 채택 |
| 단일 타임존(KST) 충분 | 해외 상담 가능성 | 다중 타임존 지원 결정 |

## Technical Context
- Greenfield. Next.js 프론트엔드 + Firebase 백엔드(Auth + Firestore).
- Google Calendar API: OAuth로 변호사 캘린더 연결, freebusy 조회, 확정 시 event insert.
- iframe 임베드 위젯: 변호사별 고유 임베드 URL/스니펫.
- 이메일 발송: 트랜잭셔널 이메일 (예: Firebase Extensions / SendGrid / Resend).
- 만료 처리: 스케줄드 작업(Cloud Functions cron) 또는 만료 시각 비교 로직.

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Lawyer (Tenant) | core domain | id, name, email, timezone, workingHours, slotLength, buffer, googleAuth | has many Appointments, has one WidgetConfig |
| Client | core domain | name, phone, email | makes Appointments |
| Appointment | core domain | id, slotStart, slotEnd, status(pending/confirmed/cancelled/expired), inquiry, holdExpiresAt | belongs to Lawyer, belongs to Client |
| AvailabilitySlot | supporting | start, end, available | derived from WorkingHours − GoogleBusy − Appointments |
| GoogleCalendar | external system | calendarId, oauthToken | linked to Lawyer |
| Inquiry | supporting | content, phone, email | part of Appointment |
| Notification | supporting | type(pending/confirmed/...), channel(email), recipient | triggered by Appointment events |
| WidgetConfig | supporting | embedUrl, lawyerId, theme | belongs to Lawyer |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 7 | 7 | - | - | N/A |
| 2 | 8 | 1 (Tenant) | - | 7 | 88% |
| 3 | 8 | 0 | 1 (WidgetConfig 명시) | 8 | 100% |
| 4 | 8 | 0 | 0 | 8 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (4 rounds)</summary>

### Round 0 (Topology)
**Q:** 5개 최상위 컴포넌트 topology 확인
**A:** 맞습니다 (5개)

### Round 1
**Q:** 예약 가능 시간은 어떻게 결정되나?
**A:** 업무시간 − Google 바쁜시간
**Ambiguity:** 64.5%

### Round 2
**Q:** 테넌시 범위 / 알림 채널
**A:** 다중 변호사 SaaS / 이메일만 (MVP)
**Ambiguity:** 48%

### Round 3
**Q:** 슬롯·컨펌 규칙 / 기술 스택
**A:** 슬롯 길이 변호사 설정 + 이중예약 방지 + 컨펌 만료 + 취소/재예약 / Next.js + Firebase + iframe
**Ambiguity:** 24.3%

### Round 4 (Contrarian)
**Q:** MVP에 결제 필요? / 타임존 범위
**A:** 결제 없음 + 다중 타임존
**Ambiguity:** 13.6%
</details>
