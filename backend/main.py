from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import connection, initialize_database, row_to_dict
from .services.intent_classifier import classify
from .services.rag_service import KNOWLEDGE_PATH, answer_from_knowledge

initialize_database()
app = FastAPI(title="CampusIQ API", version="1.0.0")
configured_origins = os.getenv("ALLOWED_ORIGINS") or "http://localhost:5173,http://127.0.0.1:5173,https://rakshandakowsar.github.io"
allowed_origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

StudentId = str


class StudentRegistration(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    rollNumber: str = Field(min_length=4, max_length=20, pattern=r"^[A-Za-z0-9-]+$")


class StudentLogin(BaseModel):
    rollNumber: str = Field(min_length=4, max_length=20, pattern=r"^[A-Za-z0-9-]+$")


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    student_id: str = "demo-student"


class TicketRequest(BaseModel):
    student_id: str = "demo-student"
    category: str = Field(min_length=2, max_length=60)
    subject: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=3, max_length=2000)
    priority: Literal["Low", "Medium", "High"] = "Medium"
    department: str = "Campus Support"


class TicketUpdate(BaseModel):
    status: Literal["Pending", "Assigned", "In Progress", "Resolved", "Closed"] | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    subject: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, min_length=3, max_length=2000)


class RoomRequest(BaseModel):
    student_id: str = "demo-student"
    date: str
    start_time: str
    end_time: str
    building: str
    students: int = Field(ge=1, le=30)
    room_type: str


class IssueRequest(BaseModel):
    student_id: str = "demo-student"
    category: str
    location: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=3, max_length=2000)
    priority: Literal["Low", "Medium", "High"] = "Medium"


class ShuttleRequest(BaseModel):
    student_id: str = "demo-student"
    route: str
    date: str
    time: str
    passengers: int = Field(ge=1, le=8)


class SupportRequest(BaseModel):
    student_id: str = "demo-student"
    category: str
    subject: str
    description: str
    contact_method: Literal["Email", "Phone", "Portal"] = "Portal"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def next_id(prefix: str, table: str, column: str) -> str:
    year = datetime.now().year
    with connection() as database:
        count = database.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()["count"] + 1
    return f"{prefix}-{year}-{count:04d}"


def create_ticket(payload: TicketRequest) -> dict[str, Any]:
    ticket_id = next_id("CAM", "tickets", "ticket_id")
    timestamp = now()
    with connection() as database:
        database.execute(
            """INSERT INTO tickets(ticket_id, student_id, category, subject, description, priority, department, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)""",
            (ticket_id, payload.student_id, payload.category, payload.subject, payload.description, payload.priority, payload.department, timestamp, timestamp),
        )
    return get_ticket(ticket_id)


def get_ticket(ticket_id: str) -> dict[str, Any]:
    with connection() as database:
        ticket = row_to_dict(database.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone())
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "campusiq-api", "timestamp": now()}


@app.get("/api/campus-overview")
def campus_overview() -> dict[str, Any]:
    return {
        "campusName": "Northstar University",
        "safetyScore": 92,
        "activeAlerts": [{"title": "Library east wing closes at 8 PM today", "severity": "Info"}],
        "resourceSummary": {"studyRooms": 18, "labsOpen": 6, "shuttleRoutes": 4},
        "serviceCategories": ["Attendance", "Exams", "Fees", "Certificates", "Hostel", "Placements", "Scholarships"],
        "eventHighlights": [{"title": "Placement readiness clinic", "date": "20 Sep", "location": "Career Cell"}],
        "quickActions": ["Find a study room", "Report an issue", "Book a shuttle", "Contact campus support"],
    }


@app.post("/api/students/register", status_code=201)
def register_student(payload: StudentRegistration) -> dict[str, Any]:
    student = {"name": payload.name.strip(), "rollNumber": payload.rollNumber.upper(), "registeredAt": now()}
    with connection() as database:
        database.execute(
            "INSERT INTO students(roll_number, name, registered_at) VALUES (?, ?, ?) ON CONFLICT(roll_number) DO UPDATE SET name = excluded.name, registered_at = excluded.registered_at",
            (student["rollNumber"], student["name"], student["registeredAt"]),
        )
    return {"student": student}


@app.post("/api/students/login")
def login_student(payload: StudentLogin) -> dict[str, Any]:
    roll_number = payload.rollNumber.upper()
    with connection() as database:
        student = row_to_dict(database.execute("SELECT name, roll_number AS rollNumber, registered_at AS registeredAt FROM students WHERE roll_number = ?", (roll_number,)).fetchone())
    if not student:
        raise HTTPException(status_code=401, detail="No student account found for this roll number. Sign up first.")
    return {"student": student}


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    result = classify(payload.question)
    answer, source = answer_from_knowledge(result.category, payload.question)
    escalation_words = ("permission", "exception", "not arrived", "appeal", "complaint", "urgent")
    should_escalate = answer is None or result.confidence < 0.68 or any(word in payload.question.lower() for word in escalation_words)
    ticket = None
    follow_up = {"label": f"Open {result.category} guide", "url": f"/api/knowledge/{result.category.lower().replace(' ', '-')}"} if source else {"label": "Open campus support", "url": "/api/campus-overview"}
    if should_escalate:
        ticket = create_ticket(TicketRequest(
            student_id=payload.student_id,
            category=result.category,
            subject=result.intent,
            description=payload.question,
            priority="High" if any(word in payload.question.lower() for word in ("urgent", "security")) else "Medium",
            department=result.department,
        ))
        final_answer = f"I couldn't confidently resolve this request automatically. I created {ticket['ticket_id']} and routed it to {result.department}."
        follow_up = {"label": f"Track {ticket['ticket_id']}", "url": f"/api/tickets/{ticket['ticket_id']}"}
    else:
        final_answer = answer
    with connection() as database:
        database.execute(
            "INSERT INTO chat_logs(student_id, question, category, confidence, escalated, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (payload.student_id, payload.question, result.category, result.confidence, int(should_escalate), now()),
        )
    return {"category": result.category, "intent": result.intent, "confidence": result.confidence, "answer": final_answer, "source": source, "escalated": should_escalate, "ticket": ticket, "follow_up": follow_up}


@app.get("/api/knowledge/{category}")
def knowledge_document(category: str) -> dict[str, str]:
    """Expose only approved knowledge documents as a follow-up destination."""
    safe_category = re.sub(r"[^a-z0-9-]", "", category.lower()).replace("-", "_")
    document = KNOWLEDGE_PATH / f"{safe_category}.txt"
    if not document.exists():
        raise HTTPException(status_code=404, detail="Knowledge guide not found")
    return {"category": category, "source": document.name, "content": document.read_text(encoding="utf-8")}


@app.post("/api/tickets", status_code=201)
def create_ticket_endpoint(payload: TicketRequest) -> dict[str, Any]:
    return create_ticket(payload)


@app.get("/api/tickets")
def list_tickets(student_id: str | None = Query(default=None)) -> dict[str, Any]:
    query = "SELECT * FROM tickets"
    parameters: tuple[str, ...] = ()
    if student_id:
        query += " WHERE student_id = ?"
        parameters = (student_id,)
    query += " ORDER BY created_at DESC"
    with connection() as database:
        tickets = [dict(row) for row in database.execute(query, parameters).fetchall()]
    return {"tickets": tickets}


@app.get("/api/tickets/{ticket_id}")
def ticket_detail(ticket_id: str) -> dict[str, Any]:
    return get_ticket(ticket_id)


@app.put("/api/tickets/{ticket_id}")
def update_ticket(ticket_id: str, payload: TicketUpdate) -> dict[str, Any]:
    current = get_ticket(ticket_id)
    status = payload.status or current["status"]
    priority = payload.priority or current["priority"]
    subject = payload.subject or current["subject"]
    description = payload.description or current["description"]
    with connection() as database:
        database.execute("UPDATE tickets SET subject = ?, description = ?, status = ?, priority = ?, updated_at = ? WHERE ticket_id = ?", (subject, description, status, priority, now(), ticket_id))
    return get_ticket(ticket_id)


@app.post("/api/study-room", status_code=201)
def find_study_room(payload: RoomRequest) -> dict[str, Any]:
    room = {"room": "Library 204", "building": payload.building or "Central Library", "floor": 2, "capacity": max(payload.students, 6), "room_type": payload.room_type, "available": True}
    booking_id = next_id("ROOM", "bookings", "booking_id")
    with connection() as database:
        database.execute("INSERT INTO bookings VALUES (?, ?, 'Study room', ?, 'Confirmed', ?)", (booking_id, payload.student_id, json.dumps({**payload.model_dump(), **room}), now()))
    ticket = create_ticket(TicketRequest(student_id=payload.student_id, category="Room Booking", subject=f"Study room booking at {payload.building}", description=json.dumps({**payload.model_dump(), **room}), department="Campus Facilities"))
    return {"booking_id": booking_id, "status": "Confirmed", "room": room, "ticket": ticket}


@app.post("/api/issues", status_code=201)
def report_issue(payload: IssueRequest) -> dict[str, Any]:
    department = "Hostel Office" if payload.category == "Hostel Maintenance" else "Campus Facilities"
    ticket = create_ticket(TicketRequest(student_id=payload.student_id, category=payload.category, subject=f"{payload.category} at {payload.location}", description=payload.description, priority=payload.priority, department=department))
    return {"ticket": ticket}


@app.post("/api/shuttle", status_code=201)
def book_shuttle(payload: ShuttleRequest) -> dict[str, Any]:
    booking_id = next_id("BUS", "bookings", "booking_id")
    details = payload.model_dump()
    details["vehicle"] = "Campus Shuttle 3"
    with connection() as database:
        database.execute("INSERT INTO bookings VALUES (?, ?, 'Shuttle', ?, 'Confirmed', ?)", (booking_id, payload.student_id, json.dumps(details), now()))
    ticket = create_ticket(TicketRequest(student_id=payload.student_id, category="Transport", subject=f"Shuttle booking: {payload.route}", description=json.dumps(details), department="Transport Office"))
    return {"booking_id": booking_id, "status": "Confirmed", "shuttle": details, "ticket": ticket}


@app.post("/api/support", status_code=201)
def contact_support(payload: SupportRequest) -> dict[str, Any]:
    ticket = create_ticket(TicketRequest(student_id=payload.student_id, category=payload.category, subject=payload.subject, description=f"{payload.description} Preferred contact: {payload.contact_method}", department="Campus Support"))
    return {"ticket": ticket}


@app.get("/api/student-profile")
def student_profile(student_id: str = "demo-student") -> dict[str, Any]:
    with connection() as database:
        student = row_to_dict(database.execute("SELECT * FROM students WHERE roll_number = ?", (student_id,)).fetchone())
        pending = database.execute("SELECT COUNT(*) AS count FROM tickets WHERE student_id = ? AND status NOT IN ('Resolved', 'Closed')", (student_id,)).fetchone()["count"]
    return {"student": student or {"name": "Demo Student", "rollNumber": student_id, "department": "Computer Science", "year": 3, "semester": 5}, "attendance": 82, "upcomingExams": ["Data Structures · 24 Sep", "Operating Systems · 28 Sep"], "pendingTickets": pending, "placementEligibility": "Eligible for most drives", "scholarshipOpportunities": 3, "feeStatus": "₹18,000 pending · due 30 Sep"}


@app.get("/api/notifications")
def notifications() -> dict[str, Any]:
    return {"notifications": [{"title": "Attendance Alert", "text": "Your Computer Networks attendance is at 76%.", "type": "warning"}, {"title": "Exam Reminder", "text": "Data Structures exam is on 24 Sep.", "type": "info"}, {"title": "Scholarship Deadline", "text": "Merit scholarship applications close 30 Sep.", "type": "success"}]}


@app.get("/api/placement")
def placement(branch: str = "Computer Science", cgpa: float = 7.5, backlogs: int = 0) -> dict[str, Any]:
    companies = [{"name": "Nexa Systems", "eligible": cgpa >= 7 and backlogs == 0, "reason": "Meets CGPA and backlog criteria" if cgpa >= 7 and backlogs == 0 else "Requires CGPA 7.0 and no active backlogs"}, {"name": "Orbit Labs", "eligible": branch.lower() in {"computer science", "information technology"} and cgpa >= 8, "reason": "CS/IT and CGPA 8.0+ required"}]
    return {"branch": branch, "cgpa": cgpa, "backlogs": backlogs, "companies": companies, "preparation": {"technical": ["Arrays and hashing", "SQL joins", "REST API design"], "hr": ["Project walkthrough", "Conflict resolution"], "aptitude": ["Percentages", "Logical reasoning"]}}


@app.get("/api/scholarships")
def scholarships() -> dict[str, Any]:
    return {"scholarships": [{"name": "Merit Support Grant", "eligibility": "CGPA 8.0+", "deadline": "30 Sep 2025", "status": "Open"}, {"name": "Access Scholarship", "eligibility": "Need-based support", "deadline": "15 Oct 2025", "status": "Open"}]}


@app.get("/api/search")
def campus_search(query: str = "") -> dict[str, Any]:
    places = [{"name": "Central Library", "type": "Library", "building": "Knowledge Commons", "floor": "Ground–3", "hours": "7 AM–10 PM"}, {"name": "Placement Cell", "type": "Administrative office", "building": "Admin Block", "floor": "2", "hours": "9 AM–5 PM"}, {"name": "Medical Center", "type": "Medical center", "building": "Wellness Block", "floor": "Ground", "hours": "24 hours"}, {"name": "North Cafeteria", "type": "Cafeteria", "building": "Student Commons", "floor": "Ground", "hours": "8 AM–9 PM"}]
    filtered = [place for place in places if not query or query.lower() in json.dumps(place).lower()]
    return {"results": filtered}


@app.get("/api/analytics")
def analytics() -> dict[str, Any]:
    with connection() as database:
        total = database.execute("SELECT COUNT(*) AS count FROM tickets").fetchone()["count"]
        pending = database.execute("SELECT COUNT(*) AS count FROM tickets WHERE status NOT IN ('Resolved', 'Closed')").fetchone()["count"]
        resolved = database.execute("SELECT COUNT(*) AS count FROM tickets WHERE status IN ('Resolved', 'Closed')").fetchone()["count"]
        escalated = database.execute("SELECT COUNT(*) AS count FROM chat_logs WHERE escalated = 1").fetchone()["count"]
        by_category = [dict(row) for row in database.execute("SELECT category AS name, COUNT(*) AS value FROM tickets GROUP BY category ORDER BY value DESC").fetchall()]
    return {"totalRequests": total, "resolvedRequests": resolved, "pendingRequests": pending, "escalatedRequests": escalated, "averageResolutionTime": "4h 12m", "aiResolutionRate": 78, "requestsByCategory": by_category or [{"name": "Attendance", "value": 42}, {"name": "Hostel", "value": 28}, {"name": "Fees", "value": 21}], "insights": ["Attendance-related requests increased this week.", "Hostel complaints have the highest average resolution time.", "78% of queries were resolved automatically."]}
