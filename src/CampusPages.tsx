import { useState, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  FileCheck2,
  GraduationCap,
  Headphones,
  HeartPulse,
  Info,
  Library,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { campusInfo } from './data/campusInfo'

type CampusPageProps = {
  page: string
  studentId: string
  onOpenAction: (action: string) => void
  onNavigate: (page: string) => void
}

type ChatMessage = { role: 'student' | 'assistant'; text: string }

const pageMeta: Record<string, { eyebrow: string; title: string; subtitle: string; icon: typeof BookOpen }> = {
  'AI Campus Assistant': { eyebrow: 'INTELLIGENCE LAYER', title: 'AI Campus Assistant', subtitle: 'Ask anything about academics, campus services and student support.', icon: Sparkles },
  Academics: { eyebrow: 'ACADEMIC SUPPORT', title: 'Academic Support', subtitle: 'Keep your learning progress, attendance and faculty support in one place.', icon: GraduationCap },
  Exams: { eyebrow: 'ACADEMICS', title: 'Exams & Timetable', subtitle: 'Your upcoming examinations, reminders and important instructions.', icon: CalendarDays },
  Fees: { eyebrow: 'STUDENT SERVICES', title: 'Fees & Payments', subtitle: 'Review your fee summary and find the right support pathway.', icon: WalletCards },
  Certificates: { eyebrow: 'STUDENT SERVICES', title: 'Certificates & Documents', subtitle: 'Request and track official documents through a clear workflow.', icon: FileCheck2 },
  Hostel: { eyebrow: 'STUDENT SERVICES', title: 'Hostel Services', subtitle: 'Find accommodation information, support and maintenance pathways.', icon: Building2 },
  Transport: { eyebrow: 'STUDENT SERVICES', title: 'Campus Transport', subtitle: 'Review demo shuttle routes and book a campus ride.', icon: BriefcaseBusiness },
  Placements: { eyebrow: 'CAREER DEVELOPMENT', title: 'Placement Assistant', subtitle: 'Explore demo opportunities and prepare for your next conversation.', icon: Award },
  Scholarships: { eyebrow: 'STUDENT SERVICES', title: 'Scholarships', subtitle: 'Review demo scholarship opportunities and eligibility guidance.', icon: BadgeCheck },
  'Campus Services': { eyebrow: 'CAMPUS', title: 'Campus Services', subtitle: 'Find the places and teams that keep campus moving.', icon: Building2 },
  'Campus Guide': { eyebrow: 'CAMPUS', title: 'Campus Guide', subtitle: 'Explore campus facilities, demo information and verified support pathways.', icon: CircleHelp },
  Notifications: { eyebrow: 'CAMPUS', title: 'Notifications', subtitle: 'Stay current with academic, service and campus updates.', icon: CircleAlert },
  'Admin Dashboard': { eyebrow: 'ADMINISTRATION', title: 'Campus Intelligence', subtitle: 'Operational signals from the ticket and support data.', icon: BarChart3 },
  'Help & Campus Info': { eyebrow: 'SUPPORT', title: 'Help & Campus Info', subtitle: 'Verified pathways, demo campus information and student support.', icon: Info },
}

const demoCards = {
  Academics: [
    ['Deep Learning', '82%', 'Good', '24 / 29 classes'],
    ['Machine Learning', '68%', 'Attention Required', '19 / 28 classes'],
    ['Natural Language Processing', '91%', 'Good', '30 / 33 classes'],
  ],
  Exams: [
    ['Deep Learning', '20 September 2026', '10:00 AM', 'Room A-204'],
    ['Machine Learning', '24 September 2026', '2:00 PM', 'Room B-110'],
    ['NLP Lab Viva', '28 September 2026', '11:30 AM', 'Innovation Hub'],
  ],
}

function PageHeader({ page }: { page: string }) {
  const meta = pageMeta[page]
  const Icon = meta.icon
  return <div className="feature-header"><div className="feature-title-icon"><Icon size={22} /></div><div><p className="eyebrow">{meta.eyebrow}</p><h1>{meta.title}<span>.</span></h1><p className="subtitle">{meta.subtitle}</p></div></div>
}

function InfoCard({ icon: Icon, title, value, detail, tone = 'blue' }: { icon: typeof BookOpen; title: string; value: string; detail: string; tone?: string }) {
  return <article className={`feature-card metric-card ${tone}`}><span className="metric-icon"><Icon size={18} /></span><div><small>{title}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

function AIPage({ studentId }: { studentId: string }) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'student', text: 'How can I apply for a scholarship?' },
    { role: 'assistant', text: 'You can check available scholarships and their eligibility requirements in the Scholarships section.' },
    { role: 'student', text: 'When are my exams?' },
    { role: 'assistant', text: 'Your upcoming examination schedule is available in the Exams section.' },
  ])

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.trim() || isSending) return
    const question = input.trim()
    setInput('')
    setMessages((current) => [...current, { role: 'student', text: question }])
    setIsSending(true)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, student_id: studentId }) })
      const result = await response.json() as { answer?: string; category?: string; intent?: string; confidence?: number; escalated?: boolean; ticket?: { ticket_id: string } | null }
      const answer = result.answer ?? 'I do not have enough verified information to answer that accurately. Would you like me to create a support request?'
      const details = `${result.category ?? 'General Information'} | ${result.intent ?? 'General Question'} | ${Math.round((result.confidence ?? 0) * 100)}% confidence${result.ticket ? ` | ${result.ticket.ticket_id}` : ''}`
      setMessages((current) => [...current, { role: 'assistant', text: `${answer}\n${details}${result.escalated ? '\nI created a support request and routed it to the appropriate department.' : ''}` }])
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'I could not reach the campus service. Please try again or create a support request.' }])
    } finally {
      setIsSending(false)
    }
  }

  return <><PageHeader page="AI Campus Assistant" /><div className="ai-differentiator"><Sparkles size={20} /><div><strong>Answer or escalate</strong><p>CampusIQ retrieves verified knowledge, shows confidence, and creates a trackable ticket when the answer needs human help.</p></div><span>Grounded AI workflow</span></div><div className="ai-layout"><section className="feature-card chat-card"><div className="feature-section-heading"><div><p className="eyebrow">CAMPUSIQ ASSISTANT</p><h2>Ask with confidence</h2></div><span className="live-dot">Online</span></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'student' ? 'You' : 'CampusIQ'}</span><p>{message.text}</p></div>)}</div><form className="chat-composer" onSubmit={ask}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about attendance, exams, fees or campus support..." rows={2} /><button className="send-button" type="submit" disabled={isSending} aria-label="Ask CampusIQ" title="Ask CampusIQ"><Send size={17} /></button></form></section><aside className="feature-card intent-card"><p className="eyebrow">SUPPORTED ROUTES</p><h2>Intent-aware help</h2>{['Attendance', 'Exams', 'Fees', 'Certificates', 'Hostel', 'Transport', 'Placements', 'Scholarships', 'Academic Support', 'IT Support', 'Infrastructure', 'Security'].map((item) => <span key={item}><CheckCircle2 size={13} />{item}</span>)}</aside></div></>
}

function FeeSchedulePage({ onOpenAction }: { onOpenAction: (action: string) => void }) {
  const schedules = [
    ['2025-26', '30 September 2025', 'Completed'],
    ['2026-27', '30 September 2026', 'Upcoming'],
    ['2027-28', '30 September 2027', 'Scheduled'],
    ['2028-29', '30 September 2028', 'Scheduled'],
  ]
  return <section className="fee-page"><PageHeader page="Fees" /><div className="fee-deadline-banner"><div><p className="eyebrow">NEXT PAYMENT DEADLINE</p><h2>30 September 2026</h2><p className="fee-deadline-copy">Final date for the 2026-27 academic year fee payment.</p></div><CalendarDays size={28} /></div><div className="metric-grid"><InfoCard icon={WalletCards} title="Total fee" value="Rs 50,000" detail="Demo fee summary" tone="blue" /><InfoCard icon={CheckCircle2} title="Paid" value="Rs 35,000" detail="Demo payment history" tone="green" /><InfoCard icon={CircleAlert} title="Pending" value="Rs 15,000" detail="Due 30 September 2026" tone="coral" /></div><FeatureSection title="Annual payment schedule" eyebrow="DEMO PAYMENT CALENDAR"><div className="fee-schedule-list">{schedules.map(([year, date, status]) => <article className="feature-card fee-schedule-row" key={year}><div><strong>{year} academic year</strong><span>Last scheduled fee-payment date</span></div><div className="fee-schedule-date"><CalendarDays size={14} />{date}</div><span className={`fee-status ${status === 'Completed' ? 'complete' : status === 'Upcoming' ? 'upcoming' : ''}`}>{status}</span></article>)}</div></FeatureSection><p className="demo-note"><Info size={15} /> These dates are demo schedule data. Confirm the official fee notice before making a payment.</p><div className="action-row"><button className="secondary-button"><ArrowUpRight size={15} /> Download receipt</button><button className="primary-button" onClick={() => onOpenAction('support')}><Headphones size={15} /> Fee-related support</button></div></section>
}

function ScholarshipPage() {
  const [openScholarship, setOpenScholarship] = useState<string | null>(null)
  const scholarships = [
    ['Merit Scholarship', 'Students meeting the required academic criteria.'],
    ['Access Scholarship', 'Need-based eligibility criteria to be confirmed from the official notice.'],
    ['Innovation Grant', 'Students with an approved innovation or project proposal.'],
  ]
  return <><PageHeader page="Scholarships" /><FeatureSection title="Available scholarships" eyebrow="DEMO OPPORTUNITIES"><div className="data-grid">{scholarships.map(([scholarship, criteria]) => <article className="feature-card scholarship-card" key={scholarship}><BadgeCheck size={19} /><div><h3>{scholarship}</h3><span>Deadline: 30 September 2026 · Status: Available</span>{openScholarship === scholarship && <p className="scholarship-criteria"><strong>Eligibility criteria</strong>{criteria}</p>}</div><button className="text-button" onClick={() => setOpenScholarship(openScholarship === scholarship ? null : scholarship)}>{openScholarship === scholarship ? 'Hide eligibility' : 'Check eligibility'} <ArrowUpRight size={14} /></button></article>)}</div></FeatureSection><p className="demo-note"><Info size={15} /> Eligibility criteria and deadlines are demo data. Confirm the official notice before applying.</p></>
}

function GenericFeaturePage({ page, studentId, onOpenAction, onNavigate }: CampusPageProps) {
  if (page === 'AI Campus Assistant') return <AIPage studentId={studentId} />
  if (page === 'Fees') return <FeeSchedulePage onOpenAction={onOpenAction} />
  if (page === 'Scholarships') return <ScholarshipPage />
  if (page === 'Academics') return <><PageHeader page={page} /><div className="profile-strip feature-card"><div><p className="eyebrow">DEMO STUDENT PROFILE</p><h2>AI & Machine Learning</h2><p>4th Year · 7th Semester · Computer Science department</p></div><button className="primary-button" onClick={() => onNavigate('AI Campus Assistant')}><Sparkles size={15} /> Ask AI about my academics</button></div><div className="metric-grid"><InfoCard icon={BookOpen} title="Current semester" value="7th" detail="Demo academic record" /><InfoCard icon={GraduationCap} title="Program" value="AI & ML" detail="Demo program data" /><InfoCard icon={CalendarDays} title="Academic calendar" value="2026" detail="Official dates to be confirmed" /></div><FeatureSection title="Subject attendance" eyebrow="LEARNING PROGRESS"><div className="data-grid">{demoCards.Academics.map(([subject, attendance, status, classes]) => <article className="feature-card subject-card" key={subject}><div><h3>{subject}</h3><span>{classes}</span></div><strong>{attendance}</strong><div className="progress-bar"><span style={{ width: attendance }} /></div><small className={status === 'Good' ? 'good-text' : 'attention-text'}>{status}</small></article>)}</div></FeatureSection><FeatureSection title="Faculty and academic calendar" eyebrow="DEMO INFORMATION"><div className="two-column-list"><div><strong>Faculty information</strong><p>Faculty office hours and contact details will be added from verified college data.</p></div><div><strong>Academic calendar</strong><p>Use the official academic notice for holidays, registration and semester deadlines.</p></div></div></FeatureSection></>
  if (page === 'Exams') return <><PageHeader page={page} /><div className="metric-grid"><InfoCard icon={CalendarDays} title="Upcoming exams" value="3" detail="Demo timetable records" /><InfoCard icon={Clock3} title="Next exam" value="20 Sep" detail="Deep Learning · 10:00 AM" /><InfoCard icon={Info} title="Instructions" value="Ready" detail="Check official examination notices" /></div><FeatureSection title="Upcoming exams" eyebrow="DEMO TIMETABLE"><div className="data-grid">{demoCards.Exams.map(([subject, date, time, room]) => <article className="feature-card exam-card" key={subject}><CalendarDays size={18} /><div><h3>{subject}</h3><p>{date} · {time}</p><span>{room} · End Semester Examination</span></div><BadgeCheck size={17} className="good-icon" /></article>)}</div></FeatureSection><div className="action-row"><button className="secondary-button"><CalendarDays size={15} /> Exam reminders</button><button className="secondary-button"><ArrowUpRight size={15} /> Download timetable</button><button className="secondary-button" onClick={() => onNavigate('Help & Campus Info')}><Info size={15} /> Important instructions</button></div></>
  if (page === 'Fees') return <><PageHeader page={page} /><div className="metric-grid"><InfoCard icon={WalletCards} title="Total fee" value="Rs 50,000" detail="Demo fee summary" tone="blue" /><InfoCard icon={CheckCircle2} title="Paid" value="Rs 35,000" detail="Demo payment history" tone="green" /><InfoCard icon={CircleAlert} title="Pending" value="Rs 15,000" detail="Due date: demo data" tone="coral" /></div><FeatureSection title="Payment history" eyebrow="DEMO DATA"><div className="table-list"><div><span>Semester 6 tuition</span><strong>Paid · Rs 20,000</strong></div><div><span>Semester 7 tuition</span><strong>Paid · Rs 15,000</strong></div><div><span>Pending semester fee</span><strong className="attention-text">Due date to be confirmed</strong></div></div></FeatureSection><div className="action-row"><button className="secondary-button"><ArrowUpRight size={15} /> Download receipt</button><button className="primary-button" onClick={() => onOpenAction('support')}><Headphones size={15} /> Fee-related support</button></div></>
  if (page === 'Certificates') return <><PageHeader page={page} /><FeatureSection title="Request a certificate" eyebrow="DOCUMENT SERVICES"><div className="certificate-grid">{['Bonafide Certificate', 'Study Certificate', 'Transfer Certificate', 'Course Completion Certificate', 'ID Card', 'Other Documents'].map((document) => <button className="feature-card selectable-card" key={document} onClick={() => onOpenAction('support')}><FileCheck2 size={18} /><span><strong>{document}</strong><small>Create a support request for this document</small></span><ChevronRight size={15} /></button>)}</div></FeatureSection><FeatureSection title="Recent certificate requests" eyebrow="DEMO TRACKING"><div className="table-list"><div><span>CERT-2026-1023 · Bonafide Certificate</span><strong className="attention-text">Processing</strong></div><div><span>CERT-2026-1008 · ID Card</span><strong className="good-text">Ready</strong></div></div></FeatureSection></>
  if (page === 'Hostel') return <><PageHeader page={page} /><div className="metric-grid"><InfoCard icon={Building2} title="Room" value="B-204" detail="Demo accommodation record" /><InfoCard icon={HeartPulse} title="Mess" value="Open" detail="Current availability is demo data" /><InfoCard icon={Headphones} title="Warden" value="Placeholder" detail="Official contact to be confirmed" /></div><FeatureSection title="Hostel information" eyebrow="DEMO INFORMATION"><div className="two-column-list"><div><strong>Hostel rules</strong><p>Refer to the official hostel handbook for timings, visitors, safety and conduct rules.</p></div><div><strong>Maintenance</strong><p>Report a maintenance issue with location and description so the facilities team can follow up.</p></div></div></FeatureSection><div className="action-row"><button className="primary-button" onClick={() => onOpenAction('issue')}><CircleAlert size={15} /> Report hostel issue</button><button className="secondary-button" onClick={() => onOpenAction('issue')}><Building2 size={15} /> Request maintenance</button><button className="secondary-button" onClick={() => onOpenAction('support')}><Headphones size={15} /> Contact hostel office</button></div></>
  if (page === 'Transport') return <><PageHeader page={page} /><div className="metric-grid"><InfoCard icon={BriefcaseBusiness} title="Active shuttles" value="4" detail="Demo route availability" /><InfoCard icon={MapPin} title="Pickup points" value="8" detail="Locations to be confirmed" /><InfoCard icon={Clock3} title="Next route" value="08:30 AM" detail="Demo schedule" /></div><FeatureSection title="Shuttle routes" eyebrow="DEMO SCHEDULE"><div className="table-list"><div><span>North Gate to Main Campus</span><strong>08:30 AM · Available</strong></div><div><span>Hostel Loop to Main Campus</span><strong>09:00 AM · Available</strong></div><div><span>South Gate to Engineering Block</span><strong>09:30 AM · Limited</strong></div></div></FeatureSection><button className="primary-button" onClick={() => onOpenAction('shuttle')}><BriefcaseBusiness size={15} /> Book a shuttle</button></>
  if (page === 'Placements') return <><PageHeader page={page} /><div className="profile-strip feature-card"><div><p className="eyebrow">STUDENT PROFILE</p><h2>AI & Machine Learning · Year 4</h2><p>Skills: Python, SQL, machine learning · Academic percentage: 78% · Backlogs: 0</p></div><span className="eligibility-badge"><CheckCircle2 size={15} /> Eligible</span></div><FeatureSection title="Upcoming drives" eyebrow="DEMO OPPORTUNITIES"><div className="data-grid">{['Nexa Systems · ML Engineer', 'Orbit Labs · AI Intern', 'Vertex Data · Data Analyst'].map((drive) => <article className="feature-card drive-card" key={drive}><BriefcaseBusiness size={18} /><div><h3>{drive}</h3><p>Application deadline: Demo date to be confirmed</p><span>Required skills: Python, SQL, communication</span></div><BadgeCheck size={16} className="good-icon" /></article>)}</div></FeatureSection><div className="action-row"><button className="primary-button" onClick={() => onNavigate('AI Campus Assistant')}><Sparkles size={15} /> Prepare for interview</button><button className="secondary-button" onClick={() => onOpenAction('support')}><Headphones size={15} /> Placement support</button></div></>
  if (page === 'Campus Services') return <><PageHeader page={page} /><div className="service-grid">{campusInfo.facilities.map((service) => <article className="feature-card service-card" key={service.name}><div className="service-icon"><Building2 size={17} /></div><div><h3>{service.name}</h3><p>{service.description}</p><span><MapPin size={11} /> {service.location}</span><span><Clock3 size={11} /> {service.hours}</span><small>Contact: placeholder until verified</small></div></article>)}</div></>
  if (page === 'Notifications') return <><PageHeader page={page} /><div className="notification-list">{[['Exam Reminder', 'Your Deep Learning exam is tomorrow at 10:00 AM.', CalendarDays], ['Placement Alert', 'A new AI Engineer opportunity matches your profile.', BriefcaseBusiness], ['Fee Reminder', 'Your pending semester fee is due soon.', WalletCards], ['Campus Announcement', 'Library usage is highest between 11 AM and 1 PM.', Library]].map(([title, text, Icon]) => <article className="feature-card notification-card" key={title as string}><span className="notification-icon"><Icon size={17} /></span><div><strong>{title as string}</strong><p>{text as string}</p><small>Demo notification · Today</small></div><ChevronRight size={15} /></article>)}</div></>
  if (page === 'Admin Dashboard') return <AdminPage />
  return <HelpPage title={page === 'Campus Guide' ? 'Campus Guide' : undefined} onOpenAction={page === 'Campus Guide' ? onOpenAction : undefined} />
}

function FeatureSection({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <section className="feature-section"><div className="feature-section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}</section>
}

function AdminPage() {
  const [analytics, setAnalytics] = useState<{ totalRequests: number; pendingRequests: number; resolvedRequests: number; escalatedRequests: number; aiResolutionRate: number; averageResolutionTime: string; requestsByCategory: Array<{ name: string; value: number }>; insights: string[] } | null>(null)
  useState(() => { void fetch('/api/analytics').then((response) => response.json()).then(setAnalytics).catch(() => setAnalytics(null)) })
  const stats = analytics ?? { totalRequests: 42, pendingRequests: 12, resolvedRequests: 24, escalatedRequests: 6, aiResolutionRate: 78, averageResolutionTime: '4h 12m', requestsByCategory: [{ name: 'Academic', value: 18 }, { name: 'Fees', value: 9 }, { name: 'Hostel', value: 7 }], insights: ['Attendance-related requests increased this week.', 'Hostel complaints have the highest average resolution time.', 'Most student requests are related to academics.'] }
  return <><PageHeader page="Admin Dashboard" /><div className="metric-grid admin-metrics"><InfoCard icon={MessageSquareText} title="Total requests" value={String(stats.totalRequests)} detail="All student requests" /><InfoCard icon={Clock3} title="Pending" value={String(stats.pendingRequests)} detail="Awaiting action" /><InfoCard icon={CheckCircle2} title="Resolved" value={String(stats.resolvedRequests)} detail="Closed successfully" tone="green" /><InfoCard icon={CircleAlert} title="Escalated" value={String(stats.escalatedRequests)} detail="Human assistance required" tone="coral" /></div><div className="admin-grid"><section className="feature-card"><div className="feature-section-heading"><div><p className="eyebrow">OPERATIONS</p><h2>Requests by category</h2></div><BarChart3 size={18} /></div><div className="bar-chart">{stats.requestsByCategory.map((item) => <div className="bar-row" key={item.name}><span>{item.name}</span><div><i style={{ width: `${Math.max(12, Math.min(100, item.value * 5))}%` }} /></div><strong>{item.value}</strong></div>)}</div></section><section className="feature-card"><p className="eyebrow">AI PERFORMANCE</p><h2>{stats.aiResolutionRate}% resolved automatically</h2><div className="large-stat">{stats.averageResolutionTime}</div><p className="muted-copy">Average resolution time</p><div className="insight-list">{stats.insights.map((insight) => <p key={insight}><Sparkles size={13} />{insight}</p>)}</div></section></div></>
}

function HelpPage({ title = 'Help & Campus Info', onOpenAction }: { title?: string; onOpenAction?: (action: string) => void }) {
  return <><PageHeader page={title} /><div className="help-page-grid"><section className="feature-card help-copy"><p className="eyebrow">ABOUT MIC COLLEGE</p><h2>MIC College</h2><p>{campusInfo.description}</p><span className="demo-note"><Info size={14} /> Demo information. Replace with approved official content.</span><div className="help-facts"><div><strong>Vision</strong><span>{campusInfo.vision}</span></div><div><strong>Mission</strong><span>{campusInfo.mission}</span></div><div><strong>Academic programs</strong><span>{campusInfo.academicPrograms}</span></div></div></section>{onOpenAction && <CampusGuideSupport onOpenAction={onOpenAction} />}</div><FeatureSection title="Campus facilities" eyebrow="DEMO DIRECTORY"><div className="service-grid compact">{campusInfo.facilities.slice(0, 9).map((service) => <article className="feature-card service-card" key={service.name}><Library size={17} /><div><h3>{service.name}</h3><span>{service.location}</span><small>{service.hours}</small></div></article>)}</div></FeatureSection><div className="demo-note"><ShieldCheck size={15} /> Contact details, useful links and emergency numbers remain placeholders until official information is provided.</div></>
}

function CampusGuideSupport({ onOpenAction }: { onOpenAction: (action: string) => void }) {
  const supportOptions = ['Attendance Issues', 'Exam Issues', 'Fee Queries', 'Certificate Requests', 'Hostel Issues', 'Transport Support', 'Placement Support', 'Scholarship Support', 'IT Support', 'Report Campus Issue']
  return <section className="feature-card campus-guide-support"><div className="feature-section-heading"><div><p className="eyebrow">STUDENT SUPPORT</p><h2>Connect to support</h2></div></div><div className="support-button-grid">{supportOptions.map((label) => <button key={label} onClick={() => onOpenAction(label.includes('Hostel') || label.includes('Issue') ? 'issue' : label.includes('Transport') ? 'shuttle' : 'support')}><Headphones size={14} />{label}<ChevronRight size={13} /></button>)}</div></section>
}

export default GenericFeaturePage
