# CampusIQ

A hackathon-ready Smart Campus Assistant for students and campus teams. The existing Campusdesk dashboard is preserved as the student-facing experience.

## Demo

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. This starts Vite and FastAPI together. The API runs at `http://localhost:8000`.

For the Python environment directly:

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

## What is demonstrated

- One student-facing entry point for academic, finance, facilities, certificates, and placement requests.
- Natural-language request composer with example prompts and keyboard submission.
- AI-assisted routing signal that sends unresolved requests to a responsible department.
- Request tracking with IDs, status, category, and timestamps.
- Campus pulse metric for administrators: first-response resolution and trend.
- Student privacy cue with campus SSO protection.
- Responsive desktop and mobile navigation.
- Quick-action modals for study rooms, issue reports, shuttles, and campus support.
- FastAPI + SQLite persistence for students, tickets, chat audit logs, and bookings.
- RAG-style answers grounded in files under `backend/knowledge/`.
- Admin analytics, placement assistant, scholarship data, notifications, and campus search APIs.

The UI uses local browser state for the signed-in student session, while operational records are persisted in SQLite at `backend/campus.db`. The assistant uses transparent local intent classification and knowledge-file retrieval; it does not claim to use an external LLM.

## API endpoints

- `GET /api/health`
- `GET /api/campus-overview`
- `POST /api/students/register`
- `POST /api/chat`
- `POST /api/tickets`, `GET /api/tickets`, `GET /api/tickets/{ticket_id}`, `PUT /api/tickets/{ticket_id}`
- `POST /api/study-room`, `POST /api/issues`, `POST /api/shuttle`, `POST /api/support`
- `GET /api/student-profile`, `GET /api/notifications`, `GET /api/placement`, `GET /api/scholarships`, `GET /api/search`, `GET /api/analytics`

## Product decisions

### Must-have MVP

1. Authenticated student profile and a single request interface.
2. Intent and department classification with confidence scoring.
3. Grounded answers from approved campus policy sources.
4. Human escalation when confidence is low, the request is sensitive, or a policy decision is required.
5. Request timeline, SLA, ownership, and notifications.
6. Admin analytics for volume, trends, unanswered intents, and department load.
7. Audit logs, role-based access, minimal data retention, and PII protection.

### Where AI adds genuine value

AI should interpret messy student language, extract entities such as semester or course code, classify the destination department, retrieve relevant approved policy passages, draft a concise answer, and summarize escalations for staff. It should never invent deadlines, approve exceptions, expose another student's data, or make a high-impact decision without a human.

### Recommended architecture

```text
Student web app
  |
  v
API gateway + campus SSO
  |
  +--> Request orchestrator --> intent/entity classifier
  |                              |
  |                              +--> policy retrieval (approved, versioned docs)
  |                              +--> confidence + safety checks
  |
  +--> Case service --> PostgreSQL + audit log
  |                 --> department queues / email / Teams
  |
  +--> Analytics events --> warehouse / admin dashboard
```

A retrieval-augmented generation layer keeps answers grounded in versioned university policies. The case service remains the source of truth for status and ownership. Every AI answer stores the source documents and model metadata used to produce it.

## What could go wrong

- Stale or conflicting policy documents produce a confident but wrong answer.
- Ambiguous requests route to the wrong department.
- Prompt injection or malicious uploads attempt to override campus policy.
- Sensitive student information appears in logs or analytics.
- Department queues are not staffed, creating invisible escalation delays.
- Students over-trust an automated answer for an exception or appeal.

Mitigations: source versioning and expiry, confidence thresholds, explicit uncertainty, human review, malware scanning, PII redaction, least-privilege access, immutable audit events, queue SLAs, and clear links to official policy owners.

## Testing strategy

- Unit tests for intent classification, entity extraction, confidence thresholds, routing, and status transitions.
- Retrieval evaluations using a curated set of real, anonymized student questions with expected sources.
- Red-team tests for prompt injection, data leakage, unsafe uploads, and cross-student access.
- Contract tests for SSO, case creation, notifications, and department integrations.
- Playwright tests for ask, submit, route confirmation, navigation, and mobile layouts.
- Production monitoring for citation rate, fallback rate, escalation SLA, unresolved intents, and user feedback.

## Differentiator

Campusdesk treats AI as a careful front door to campus operations, not as a free-form chatbot. The differentiator is a transparent confidence-to-human handoff: every answer either cites a trusted campus source or becomes a trackable case with an owner, SLA, and audit trail.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

