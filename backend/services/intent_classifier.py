from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IntentResult:
    category: str
    intent: str
    department: str
    confidence: float


INTENTS: list[tuple[str, str, str, tuple[str, ...]]] = [
    ("Attendance", "Attendance Issue", "Academic Services", ("attendance", "absent", "shortage", "condonation")),
    ("Exams", "Exam Schedule", "Examination Cell", ("exam", "examination", "re-exam", "hall ticket", "result")),
    ("Fees", "Fee Payment", "Finance Office", ("fee", "fees", "payment", "refund", "receipt", "due date")),
    ("Certificates", "Certificate Request", "Academic Services", ("certificate", "bonafide", "transcript", "document")),
    ("Hostel", "Hostel Support", "Hostel Office", ("hostel", "room", "mess", "warden")),
    ("Transport", "Transport Request", "Transport Office", ("shuttle", "bus", "transport", "route")),
    ("Placements", "Placement Eligibility", "Career Cell", ("placement", "internship", "job", "career", "resume")),
    ("Scholarships", "Scholarship Support", "Scholarships Office", ("scholarship", "stipend", "financial aid")),
    ("IT Support", "IT Issue", "IT Helpdesk", ("wifi", "password", "login", "portal", "software")),
    ("Infrastructure", "Infrastructure Issue", "Campus Facilities", ("classroom", "projector", "maintenance", "repair", "facility")),
    ("Security", "Security Issue", "Campus Security", ("security", "lost", "emergency", "unsafe")),
]


def classify(question: str) -> IntentResult:
    normalized = question.lower()
    best: tuple[int, tuple[str, str, str, tuple[str, ...]]] | None = None
    for intent in INTENTS:
        score = sum(1 for keyword in intent[3] if keyword in normalized)
        if score and (best is None or score > best[0]):
            best = (score, intent)
    if best is None:
        return IntentResult("General Campus Information", "General Question", "Campus Support", 0.42)
    category, intent, department, _keywords = best[1]
    confidence = min(0.96, 0.68 + (best[0] * 0.1))
    return IntentResult(category, intent, department, confidence)
