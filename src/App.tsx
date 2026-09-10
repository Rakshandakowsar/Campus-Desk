import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BedDouble,
  Bot,
  BusFront,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Paperclip,
  Pencil,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Siren,
  Sparkles,
  Headphones,
  WalletCards,
  X,
} from 'lucide-react'
import './App.css'
import HelpModal from './HelpModal'
import GenericFeaturePage from './CampusPages'
import { generateCaptcha, validateCaptcha } from './captcha'

type Student = {
  name: string
  rollNumber: string
}

type AssistantResponse = {
  answer: string
  category: string
  confidence: number
  source?: string | null
  escalated: boolean
  follow_up?: { label: string; url: string }
  ticket?: { ticket_id: string } | null
}

type CampusRequest = {
  id: string
  title: string
  category: string
  date: string
  status: string
  tone: 'review' | 'resolved'
}

type TicketSummary = {
  ticket_id: string
  subject: string
  category: string
  created_at: string
  status: string
}

function toCampusRequest(ticket: TicketSummary): CampusRequest {
  return { id: ticket.ticket_id, title: ticket.subject, category: ticket.category, date: new Date(ticket.created_at).toLocaleString(), status: ticket.status === 'Pending' ? 'In review' : ticket.status, tone: ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'resolved' : 'review' }
}

function RequestsPage({ requests, onAddRequest, onUpdateRequest }: { requests: CampusRequest[]; onAddRequest: (message: string) => Promise<void>; onUpdateRequest: (id: string, title: string) => void }) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onAddRequest(message.trim())
      setMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEditing(request: CampusRequest) {
    setEditingId(request.id)
    setEditingMessage(request.title)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingMessage('')
  }

  async function saveEdit(request: CampusRequest) {
    if (!editingMessage.trim() || isSavingEdit) return
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/tickets/${encodeURIComponent(request.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: editingMessage.trim(), description: editingMessage.trim() }) })
      if (!response.ok) throw new Error('Request could not be updated')
      onUpdateRequest(request.id, editingMessage.trim())
      cancelEditing()
    } finally {
      setIsSavingEdit(false)
    }
  }

  return <section className="requests-page reveal-one">
    <div className="requests-page-heading"><div><p className="eyebrow">REQUEST CENTER</p><h1>My requests<span>.</span></h1><p className="subtitle">Track your campus support requests and add a new one when you need help.</p></div><span className="request-count">{requests.length} total</span></div>
    <div className="request-create-panel"><div><p className="eyebrow">NEW REQUEST</p><h2>What do you need help with?</h2><p className="modal-copy">Tell us what you need and we will route it to the right campus team.</p></div><form className="request-create-form" onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="e.g. I need help applying for a bonafide certificate" rows={4} required /><button className="modal-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding request...' : 'Add request'}<Send size={16} /></button></form></div>
    <section className="requests-page-list"><div className="section-heading"><div><p className="eyebrow">REQUEST HISTORY</p><h2>All requests</h2></div><span className="request-list-count">{requests.length} {requests.length === 1 ? 'request' : 'requests'}</span></div>{requests.length ? <div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div className="request-symbol"><MessageSquareText size={17} /></div>{editingId === request.id ? <div className="request-edit"><textarea value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} rows={2} aria-label={`Edit ${request.title}`} /><div className="request-edit-actions"><button className="request-edit-save" onClick={() => void saveEdit(request)} disabled={isSavingEdit || !editingMessage.trim()} aria-label="Save request" title="Save request"><CheckCircle2 size={15} /></button><button className="request-edit-cancel" onClick={cancelEditing} disabled={isSavingEdit} aria-label="Cancel editing" title="Cancel editing"><X size={15} /></button></div></div> : <><div className="request-detail"><strong>{request.title}</strong><span>{request.id} · {request.category}</span></div><div className="request-meta"><span className={`status ${request.tone}`}><span />{request.status}</span><small>{request.date}</small></div><button className="request-edit-button" onClick={() => startEditing(request)} aria-label={`Edit ${request.title}`} title="Edit request"><Pencil size={14} /></button></>}</div>)}</div> : <div className="empty-requests"><MessageSquareText size={22} /><p>No requests yet</p><span>Add your first request above to get started.</span></div>}</section>
  </section>
}

function App() {
  const [student, setStudent] = useState<Student | null>(() => {
    const savedStudent = localStorage.getItem('campusdesk-student')
    return savedStudent ? JSON.parse(savedStudent) as Student : null
  })
  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [loginRollNumber, setLoginRollNumber] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [registrationNotice, setRegistrationNotice] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [supportCategory, setSupportCategory] = useState('Academic Support')
  const [feePickerOpen, setFeePickerOpen] = useState(false)
  const [feeType, setFeeType] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [requests, setRequests] = useState<CampusRequest[]>([])
  const [requestError, setRequestError] = useState('')

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
    { label: 'AI Campus Assistant', icon: Sparkles },
    { label: 'Academics', icon: GraduationCap, section: 'ACADEMICS' },
    { label: 'Exams', icon: CalendarDays },
    { label: 'Certificates', icon: FileCheck2 },
    { label: 'Fees', icon: WalletCards, section: 'STUDENT SERVICES' },
    { label: 'Hostel', icon: BedDouble },
    { label: 'Transport', icon: BusFront },
    { label: 'Placements', icon: BriefcaseBusiness },
    { label: 'Scholarships', icon: BadgeCheck },
    { label: 'Campus Services', icon: Building2, section: 'CAMPUS' },
    { label: 'Campus Guide', icon: CircleHelp },
    { label: 'Notifications', icon: Bell },
    { label: 'My Requests', icon: MessageSquareText, count: requests.length },
    { label: 'Admin Dashboard', icon: BarChart3, section: 'ADMIN' },
  ]

  const categories = [
    { label: 'Academics', icon: GraduationCap, tone: 'blue' },
    { label: 'Fees & finance', icon: WalletCards, tone: 'mint' },
    { label: 'Hostel & facilities', icon: BedDouble, tone: 'coral' },
    { label: 'Certificates', icon: FileCheck2, tone: 'yellow' },
    { label: 'Placements', icon: BriefcaseBusiness, tone: 'violet' },
  ]

  useEffect(() => {
    if (!student) return
    void fetch(`/api/tickets?student_id=${encodeURIComponent(student.rollNumber)}`)
      .then((response) => response.ok ? response.json() as Promise<{ tickets: TicketSummary[] }> : Promise.reject(new Error('Requests unavailable')))
      .then(({ tickets }) => setRequests(tickets.map(toCampusRequest)))
      .catch(() => setRequestError('Requests are temporarily unavailable.'))
  }, [student])

  async function addRequest(message: string) {
    if (!student) return
    const response = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: student.rollNumber, category: 'General', subject: message, description: message, department: 'Campus Support' }) })
    if (!response.ok) throw new Error('Request could not be created')
    const result = await response.json() as { ticket_id: string; subject: string; category: string; created_at: string; status: string }
    setRequests((current) => [{ id: result.ticket_id, title: result.subject, category: result.category, date: new Date(result.created_at).toLocaleString(), status: 'In review', tone: 'review' }, ...current])
    setActiveNav('My Requests')
    setRequestError('')
  }

  function updateRequest(id: string, title: string) {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, title } : request))
  }

  async function submitRequest() {
    if (!query.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitted(false)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, student_id: student?.rollNumber ?? 'demo-student' }),
      })
      if (!response.ok) throw new Error('Assistant unavailable')
      const result = await response.json() as AssistantResponse
      setAssistantResponse(result)
      setSubmitted(true)
    } catch {
      setAssistantResponse({ answer: 'The assistant is temporarily unavailable. Please create a support ticket or try again in a moment.', category: 'System', confidence: 0, escalated: true, follow_up: { label: 'Open campus support', url: '/api/campus-overview' } })
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetCaptcha() {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
  }

  function validateAuthCaptcha(): boolean {
    const isValid = validateCaptcha(captcha.question, Number(captchaAnswer))
    if (!isValid) {
      setRegistrationError('Please solve the captcha correctly to continue.')
      resetCaptcha()
    }
    return isValid
  }

  async function registerStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegistrationError('')
    setRegistrationNotice('')

    if (!validateAuthCaptcha()) return

    setIsRegistering(true)
    try {
      const response = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName, rollNumber }),
      })
      if (!response.ok) throw new Error('Registration failed')
      setLoginRollNumber('')
      setAuthMode('login')
      setRegistrationNotice('Account created successfully. Enter your roll number to sign in to Campusdesk.')
      resetCaptcha()
    } catch {
      setRegistrationError('Registration service is unavailable. Start the full-stack server and try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function loginStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegistrationError('')
    setRegistrationNotice('')

    if (!validateAuthCaptcha()) return

    setIsRegistering(true)
    try {
      const response = await fetch('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: loginRollNumber }),
      })
      const result = await response.json() as { student?: Student; detail?: string }
      if (!response.ok || !result.student) throw new Error(result.detail ?? 'Sign in failed')
      localStorage.setItem('campusdesk-student', JSON.stringify(result.student))
      setStudent(result.student)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Sign in failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  function logoutStudent() {
    localStorage.removeItem('campusdesk-student')
    setStudent(null)
    setProfileOpen(false)
    setAuthMode('login')
    setRegistrationError('')
    resetCaptcha()
  }

  async function submitQuickAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeAction || !student) return
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const endpoint = activeAction === 'room' ? '/api/study-room' : activeAction === 'issue' ? '/api/issues' : activeAction === 'shuttle' ? '/api/shuttle' : '/api/support'
    const body = activeAction === 'room'
      ? { ...values, students: Number(values.students), student_id: student.rollNumber }
      : activeAction === 'shuttle'
        ? { ...values, passengers: Number(values.passengers), student_id: student.rollNumber }
        : activeAction === 'support' && feeType
          ? { ...values, description: `Fee category: ${feeType}. ${values.description}`, student_id: student.rollNumber }
          : { ...values, category: activeNav === 'Hostel' && activeAction === 'issue' ? 'Hostel Maintenance' : values.category, student_id: student.rollNumber }
    setIsActionSubmitting(true)
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) throw new Error('Action failed')
      const result = await response.json() as { booking_id?: string; ticket?: TicketSummary }
      setActionNotice(result.booking_id ?? result.ticket?.ticket_id ?? 'Request confirmed')
      const createdTicket = result.ticket
      if (createdTicket) setRequests((current) => [toCampusRequest(createdTicket), ...current.filter((request) => request.id !== createdTicket.ticket_id)])
    } catch {
      setActionNotice('Unable to complete this request. Check that the API is running.')
    } finally {
      setIsActionSubmitting(false)
    }
  }

  function openCategoryAction(category: string) {
    if (category === 'Fees & finance') {
      setFeePickerOpen(true)
      return
    }
    const action = category === 'Hostel & facilities' ? 'issue' : category === 'Transport' ? 'shuttle' : 'support'
    const categoryMap: Record<string, string> = {
      Academics: 'Academic Support',
      'Fees & finance': 'Fees',
      Certificates: 'Certificates',
      Placements: 'Placements',
    }
    setSupportCategory(categoryMap[category] ?? 'Academic Support')
    setActionNotice('')
    setActiveAction(action)
  }

  function openFeeSupport(type: string) {
    setFeeType(type)
    setSupportCategory('Fees')
    setFeePickerOpen(false)
    setActionNotice('')
    setActiveAction('support')
  }

  if (!student) {
    return (
      <main className="registration-page">
        <div className="registration-decoration decoration-one" />
        <div className="registration-decoration decoration-two" />
        <section className="registration-card">
          <div className="registration-brand"><div className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></div><span>Campus<span>desk</span></span></div>
          <div className="registration-icon"><GraduationCap size={25} /></div>
          <div className="auth-tabs"><button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setRegistrationError(''); setRegistrationNotice(''); resetCaptcha() }}>Sign in</button><button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setRegistrationError(''); setRegistrationNotice(''); resetCaptcha() }}>Sign up</button></div>
          <p className="eyebrow">{authMode === 'login' ? 'RETURNING STUDENT' : 'NEW STUDENT ACCESS'}</p>
          <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}<span>.</span></h1>
          <p className="registration-copy">{authMode === 'login' ? 'Sign in to access your requests, campus answers, and support teams.' : 'Create your student workspace with your name and roll number.'}</p>
          {authMode === 'login' ? <form className="registration-form" onSubmit={loginStudent}><label htmlFor="login-roll-number">Roll number<input id="login-roll-number" value={loginRollNumber} onChange={(event) => setLoginRollNumber(event.target.value.toUpperCase())} placeholder="e.g. 23CS1042" autoComplete="username" required pattern="[A-Z0-9\-]{4,20}" /></label><div className="captcha-box"><div className="captcha-question-wrap"><span className="captcha-label">Verification</span><strong>{captcha.question}</strong></div><input id="login-captcha" type="number" inputMode="numeric" value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} placeholder="Enter answer" aria-label="Captcha answer" required /><button type="button" className="captcha-refresh" onClick={resetCaptcha} aria-label="Refresh captcha">Refresh</button></div>{registrationNotice && <p className="registration-notice">{registrationNotice}</p>}{registrationError && <p className="registration-error">{registrationError}</p>}<button className="registration-submit" type="submit" disabled={isRegistering}>{isRegistering ? 'Signing in...' : 'Sign in to Campusdesk'}<ChevronRight size={17} /></button></form> : <form className="registration-form" onSubmit={registerStudent}><label htmlFor="student-name">Full name<input id="student-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Arjun Sharma" autoComplete="name" required minLength={2} /></label><label htmlFor="roll-number">Roll number<input id="roll-number" value={rollNumber} onChange={(event) => setRollNumber(event.target.value.toUpperCase())} placeholder="e.g. 23CS1042" autoComplete="off" required pattern="[A-Z0-9\-]{4,20}" /></label><div className="captcha-box"><div className="captcha-question-wrap"><span className="captcha-label">Verification</span><strong>{captcha.question}</strong></div><input id="signup-captcha" type="number" inputMode="numeric" value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} placeholder="Enter answer" aria-label="Captcha answer" required /><button type="button" className="captcha-refresh" onClick={resetCaptcha} aria-label="Refresh captcha">Refresh</button></div>{registrationError && <p className="registration-error">{registrationError}</p>}<button className="registration-submit" type="submit" disabled={isRegistering}>{isRegistering ? 'Creating your workspace...' : 'Create student account'}<ChevronRight size={17} /></button></form>}
          <p className="registration-footnote"><ShieldCheck size={14} /> Your details stay protected by campus security.</p>
        </section>
      </main>
    )
  }

  const currentDateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).replace(',', ' ·')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></div><span>Campus<span>desk</span></span><button className="icon-button close-menu" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <div className="student-card"><div className="avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div><strong>{student.name}</strong><span>Student · {student.rollNumber}</span></div><ChevronRight size={15} className="muted-icon" /></div>
        <nav className="main-nav" aria-label="Main navigation">{navItems.map(({ label, icon: Icon, count, section }) => <div key={label}>{section && <span className="nav-label">{section}</span>}<button className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileMenuOpen(false) }}><Icon size={17} strokeWidth={activeNav === label ? 2.4 : 2} /><span>{label}</span>{count !== undefined && <em>{count}</em>}</button></div>)}</nav>
        <div className="sidebar-bottom"><div className="privacy-note"><ShieldCheck size={17} /><span>Your data is private<br /><small>Protected by campus SSO</small></span></div><button className={`nav-item ${profileOpen ? 'active' : ''}`} onClick={() => setProfileOpen((isOpen) => !isOpen)}><Settings2 size={18} /><span>Settings</span></button>{profileOpen && <div className="profile-panel"><div className="profile-panel-heading"><span className="profile-panel-avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><strong>{student.name}</strong><small>Student profile</small></div></div><div className="profile-detail"><span>Name</span><strong>{student.name}</strong></div><div className="profile-detail"><span>Roll number</span><strong>{student.rollNumber}</strong></div><button className="profile-logout" onClick={logoutStudent}>Log out</button></div>}<button className="nav-item" onClick={() => setShowHelp(true)}><CircleHelp size={18} /><span>Help</span></button></div>
      </aside>

      <main className="main-content"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button notification" onClick={() => setActiveNav('Notifications')} aria-label="Notifications"><Bell size={19} /><i /></button><button className="icon-button logout-button" onClick={logoutStudent} aria-label="Log out" title="Log out"><LogOut size={18} /></button><div className="top-avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div></div></header>
        <div className="page-content" onClick={(event) => { const target = event.target as HTMLElement; if (target.closest('button')?.textContent?.includes('View campus guide')) setActiveNav('Campus Guide') }}>
          {requestError && <p className="request-error">{requestError}</p>}
          {activeNav === 'My Requests' ? <RequestsPage requests={requests} onAddRequest={addRequest} onUpdateRequest={updateRequest} /> : activeNav !== 'Dashboard' ? <GenericFeaturePage page={activeNav} studentId={student.rollNumber} onOpenAction={setActiveAction} onNavigate={setActiveNav} /> : <>
          <section className="welcome-row reveal-one"><div><p className="eyebrow">{currentDateLabel}</p><h1>Welcome to Campusdesk<span>.</span></h1><p className="subtitle">Let’s get the campus stuff out of your way.</p></div></section>
          <section className="ask-panel reveal-two"><div className="ask-heading"><div className="bot-orb"><Bot size={22} /></div><div><h2>What can we sort out?</h2><p>Ask anything about your campus life. I’ll find the right answer or person.</p></div><span className="ai-label"><span /> AI assisted</span></div><div className="composer-wrap"><textarea id="request-input" value={query} onChange={(event) => { setQuery(event.target.value); setSubmitted(false) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submitRequest() } }} placeholder="e.g. Can I apply for a re-exam if I missed the registration deadline?" rows={2} /><div className="composer-actions"><button className="attach-button" aria-label="Attach a file" title="Attach a file"><Paperclip size={17} /></button><span>{isSubmitting ? 'Checking campus policy...' : 'Press Enter to submit'}</span><button className="send-button" onClick={() => void submitRequest()} aria-label="Submit request" title="Submit request" disabled={isSubmitting}><Send size={17} /></button></div></div>{submitted && assistantResponse && <div className={`assistant-response ${assistantResponse.escalated ? 'escalated' : ''}`}><div className="response-icon"><CheckCircle2 size={17} /></div><div><strong>{assistantResponse.escalated ? 'A support request was created' : 'Campusdesk answer'}</strong><p>{assistantResponse.answer}</p><small>{assistantResponse.category} · {Math.round(assistantResponse.confidence * 100)}% confidence{assistantResponse.source ? ` · Source: ${assistantResponse.source}` : ''}{assistantResponse.ticket ? ` · ${assistantResponse.ticket.ticket_id}` : ''}</small>{assistantResponse.follow_up && <a className="follow-up-link" href={assistantResponse.follow_up.url} target="_blank" rel="noreferrer">{assistantResponse.follow_up.label}<ArrowUpRight size={13} /></a>}</div><button onClick={() => setSubmitted(false)} aria-label="Dismiss response"><X size={15} /></button></div>}<div className="suggestions"><span>Try asking</span><button onClick={() => setQuery('How do I get a bonafide certificate?')}>How do I get a bonafide certificate?</button><button onClick={() => setQuery('Where can I pay my hostel fees?')}>Where can I pay my hostel fees?</button></div></section>
          <section className="section-block reveal-three"><div className="section-heading"><div><p className="eyebrow">BROWSE BY NEED</p><h2>Quick access</h2></div><button className="text-button">View campus guide <ArrowUpRight size={15} /></button></div><div className="category-grid">{categories.map(({ label, icon: Icon, tone }) => <button className="category-card" key={label} onClick={() => openCategoryAction(label)} aria-label={`Open ${label} support`}><span className={`category-icon ${tone}`}><Icon size={20} /></span><span>{label}</span><ChevronRight size={15} className="category-arrow" /></button>)}</div><div className="quick-actions"><button onClick={() => { setActiveAction('room'); setActionNotice('') }}><Search size={17} /><span><strong>Find a study room</strong><small>Check availability and book</small></span><ChevronRight size={15} /></button><button onClick={() => { setActiveAction('issue'); setActionNotice('') }}><Siren size={17} /><span><strong>Report an issue</strong><small>Send a campus support ticket</small></span><ChevronRight size={15} /></button><button onClick={() => { setActiveAction('shuttle'); setActionNotice('') }}><BusFront size={17} /><span><strong>Book a shuttle</strong><small>Reserve a campus route</small></span><ChevronRight size={15} /></button><button onClick={() => { setActiveAction('support'); setActionNotice('') }}><Headphones size={17} /><span><strong>Contact support</strong><small>Reach the right department</small></span><ChevronRight size={15} /></button></div></section>
          <footer className="footer-note"><span><Building2 size={15} /> Made for a more helpful campus</span><span>Campusdesk v1.0 · <a href="#privacy">Privacy</a></span></footer>
          </>}
        </div>
        {activeAction && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveAction(null) }}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="action-title"><button className="modal-close" onClick={() => setActiveAction(null)} aria-label="Close action form"><X size={18} /></button>{actionNotice ? <div className="action-success"><CheckCircle2 size={35} /><p className="eyebrow">REQUEST CONFIRMED</p><h2>{activeAction === 'room' || activeAction === 'shuttle' ? 'Your booking is confirmed' : 'Your support ticket is pending'}</h2><p>Save this reference for tracking:</p><strong>{actionNotice}</strong><button onClick={() => { setActionNotice(''); setActiveAction(null) }}>Done</button></div> : <><p className="eyebrow">CAMPUS SERVICES</p><h2 id="action-title">{activeAction === 'room' ? 'Find a study room' : activeAction === 'issue' ? 'Report an issue' : activeAction === 'shuttle' ? 'Book a shuttle' : 'Contact campus support'}</h2><p className="modal-copy">{activeAction === 'room' ? 'We will find a room that fits your group and schedule.' : activeAction === 'issue' ? 'Give the campus team enough detail to act quickly.' : activeAction === 'shuttle' ? 'Choose a route and we will reserve the next available shuttle.' : 'Tell us what you need and the right team will follow up.'}</p><form className="action-form" onSubmit={submitQuickAction}>{activeAction === 'room' && <><label>Date<input name="date" type="date" required /></label><div className="form-two"><label>Start time<input name="start_time" type="time" required /></label><label>End time<input name="end_time" type="time" required /></label></div><div className="form-two"><label>Building<select name="building" defaultValue="Central Library"><option>Central Library</option><option>Innovation Hub</option><option>Engineering Block</option></select></label><label>Students<input name="students" type="number" min="1" max="30" defaultValue="2" required /></label></div><label>Room type<select name="room_type" defaultValue="Quiet study"><option>Quiet study</option><option>Discussion room</option><option>Presentation room</option></select></label></>}{activeAction === 'issue' && <><label>Issue category<select name="category" defaultValue="Infrastructure"><option>Academic</option><option>Hostel</option><option>Transport</option><option>Infrastructure</option><option>IT</option><option>Security</option><option>Other</option></select></label><label>Location<input name="location" placeholder="e.g. Library east wing" required /></label><label>Description<textarea name="description" rows={3} placeholder="What needs attention?" required /></label><label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option></select></label></>}{activeAction === 'shuttle' && <><label>Route<select name="route" defaultValue="North Gate → Main Campus"><option>North Gate → Main Campus</option><option>Hostel Loop → Main Campus</option><option>South Gate → Engineering Block</option></select></label><div className="form-two"><label>Date<input name="date" type="date" required /></label><label>Time<input name="time" type="time" required /></label></div><label>Passengers<input name="passengers" type="number" min="1" max="8" defaultValue="1" required /></label></>}{activeAction === 'support' && <><label>Category<select name="category" value={supportCategory} onChange={(event) => setSupportCategory(event.target.value)}><option>Academic Support</option><option>Fees</option><option>Certificates</option><option>Hostel</option><option>Placements</option><option>General</option></select></label><label>Subject<input name="subject" placeholder="What do you need help with?" required /></label><label>Description<textarea name="description" rows={3} placeholder="Add relevant details" required /></label><label>Preferred contact<select name="contact_method" defaultValue="Portal"><option>Portal</option><option>Email</option><option>Phone</option></select></label></>}<button className="modal-submit" disabled={isActionSubmitting}>{isActionSubmitting ? 'Submitting...' : 'Submit request'}<Send size={16} /></button></form></>}</section></div>}
        {feePickerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFeePickerOpen(false) }}><section className="fee-picker-modal" role="dialog" aria-modal="true" aria-labelledby="fee-picker-title"><button className="modal-close" onClick={() => setFeePickerOpen(false)} aria-label="Close fee categories"><X size={18} /></button><p className="eyebrow">FEES & FINANCE</p><h2 id="fee-picker-title">What kind of fee help do you need?</h2><p className="modal-copy">Choose a category and we will open a pre-classified support request.</p><div className="fee-category-grid"><button onClick={() => openFeeSupport('College fee')}><Building2 size={18} /><span><strong>College fee</strong><small>Tuition and semester charges</small></span><ChevronRight size={15} /></button><button onClick={() => openFeeSupport('Hostel fee')}><BedDouble size={18} /><span><strong>Hostel fee</strong><small>Accommodation and mess charges</small></span><ChevronRight size={15} /></button><button onClick={() => openFeeSupport('Bus / transport fee')}><BusFront size={18} /><span><strong>Bus / transport fee</strong><small>Passes and route charges</small></span><ChevronRight size={15} /></button><button onClick={() => openFeeSupport('Branch / department fee')}><GraduationCap size={18} /><span><strong>Branch / department fee</strong><small>Department-specific charges</small></span><ChevronRight size={15} /></button></div></section></div>}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} onOpenAction={(action) => setActiveAction(action)} />}
      </main>
    </div>
  )
}

export default App
