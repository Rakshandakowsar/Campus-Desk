import { useEffect, useRef } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  BusFront,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileCheck2,
  Headphones,
  Laptop2,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  Trophy,
  WalletCards,
  X,
} from 'lucide-react'
import { campusInfo } from './data/campusInfo'

const supportOptions = [
  { label: 'Attendance Issues', icon: CalendarDays, action: 'support' },
  { label: 'Exam & Timetable', icon: BookOpen, action: 'support' },
  { label: 'Fee Queries', icon: WalletCards, action: 'support' },
  { label: 'Certificates', icon: FileCheck2, action: 'support' },
  { label: 'Hostel Issues', icon: Building2, action: 'issue' },
  { label: 'Transport', icon: BusFront, action: 'shuttle' },
  { label: 'Placement Support', icon: Trophy, action: 'support' },
  { label: 'Scholarship Support', icon: WalletCards, action: 'support' },
  { label: 'IT Support', icon: Laptop2, action: 'support' },
  { label: 'Report a Campus Issue', icon: CircleAlert, action: 'issue' },
]

function HelpModal({ onClose, onOpenAction }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSupportClick(action) {
    onClose()
    onOpenAction(action)
  }

  return (
    <div className="help-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <header className="help-header">
          <div className="help-heading-icon"><Sparkles size={20} /></div>
          <div><p className="eyebrow">CAMPUS RESOURCE CENTER</p><h2 id="help-modal-title">Help & Support</h2><p>Contact details, student support, useful links and emergency guidance.</p></div>
          <button ref={closeButtonRef} className="help-close" onClick={onClose} aria-label="Close Help and Support"><X size={19} /></button>
        </header>
        <div className="help-content">
          <section className="help-section"><div className="help-section-heading"><span className="help-section-icon info-coral"><Phone size={18} /></span><div><p className="eyebrow">CONTACT DETAILS</p><h3>Reach the right office</h3></div></div><div className="contact-grid">{campusInfo.contacts.map((contact) => <article className="help-card contact-card" key={contact.department}><h4>{contact.department}</h4><span><Phone size={12} /> {contact.phone}</span><span><Mail size={12} /> {contact.email}</span><span><MapPin size={12} /> {contact.location}</span><small>Placeholder contact · Confirm before publishing</small></article>)}</div></section>

          <section className="help-section"><div className="help-section-heading"><span className="help-section-icon info-lime"><Headphones size={18} /></span><div><p className="eyebrow">STUDENT SUPPORT</p><h3>How can we help?</h3></div></div><div className="support-grid">{supportOptions.map(({ label, icon: Icon, action }) => <button className="support-card" key={label} onClick={() => handleSupportClick(action)}><Icon size={16} /><span>{label}</span><ChevronRight size={14} /></button>)}</div></section>

          <section className="help-section"><div className="help-section-heading"><span className="help-section-icon info-violet"><ExternalLink size={18} /></span><div><p className="eyebrow">USEFUL LINKS</p><h3>Campus shortcuts</h3></div></div><div className="useful-links">{campusInfo.usefulLinks.map((link) => <a className="useful-link" href={link.url} key={link.label} onClick={(event) => { if (link.placeholder) event.preventDefault() }}><span><ExternalLink size={15} /><strong>{link.label}</strong><small>{link.detail}</small></span><ArrowUpRight size={14} /></a>)}</div></section>

          <section className="emergency-card"><div className="emergency-heading"><ShieldAlert size={20} /><div><p className="eyebrow">EMERGENCY & SAFETY</p><h3>Need urgent help?</h3></div></div><p>For urgent situations, contact official campus or local emergency services first. The details below are placeholders until the college publishes verified contacts.</p><div className="emergency-grid">{campusInfo.emergency.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.detail}</span></div>)}</div></section>
        </div>
      </section>
    </div>
  )
}

export default HelpModal
