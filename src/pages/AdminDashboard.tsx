import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { 
  getEventsService, 
  subscribeEventsService,
  createEventService, 
  updateEventService, 
  deleteEventService,
  subscribeIdeaRequestsService, 
  updateIdeaStatusService,
  createOpportunityService,
  getAllRegistrationsService,
  subscribeAllRegistrationsService,
  updateRegistrationPaymentStatusService,
  updateClubSettingsService,
  subscribeClubSettingsService
} from '../services/dataService';
import { EventItem, IdeaHubRequest, EventRegistration, EventWinner, ClubSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { QRCheckinModal } from '../components/QRCheckinModal';

export const AdminDashboard: React.FC = () => {
  const { role } = useAuth();
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaHubRequest[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);

  // Main Dashboard Navigation & Drawer
  const [adminNavTab, setAdminNavTab] = useState<'payments' | 'events' | 'ideas' | 'overview'>('payments');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEventIdForPayments, setSelectedEventIdForPayments] = useState<string>('all');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modals & Panels
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showNewOppModal, setShowNewOppModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [viewingRegistrationsEvent, setViewingRegistrationsEvent] = useState<EventItem | null>(null);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'present' | 'absent' | 'vardhaman' | 'other' | 'paid_pending' | 'paid_approved' | 'free'>('all');
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);

  // New Event Form State
  const [evtTitle, setEvtTitle] = useState('');
  const [evtCategory, setEvtCategory] = useState<'workshop' | 'hackathon' | 'speaker'>('workshop');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtImage, setEvtImage] = useState('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80');
  const [evtDate, setEvtDate] = useState('Nov 20, 2026 • 5:00 PM');
  const [evtLocation, setEvtLocation] = useState('Lab 304');
  const [evtMinTeam, setEvtMinTeam] = useState(1);
  const [evtMaxTeam, setEvtMaxTeam] = useState(4);
  const [evtSeats, setEvtSeats] = useState(100);
  const [evtIsInterCollege, setEvtIsInterCollege] = useState(true);
  const [evtStartTime, setEvtStartTime] = useState('2026-08-01T00:00:00');
  const [evtEndTime, setEvtEndTime] = useState('2026-11-19T23:59:59');

  // Hosting Type & External URL State
  const [evtHostingType, setEvtHostingType] = useState<'in-house' | 'external'>('in-house');
  const [evtExternalUrl, setEvtExternalUrl] = useState('');
  const [evtOrganizerName, setEvtOrganizerName] = useState('');

  // Landing Page Feature Flags State
  const [clubSettings, setClubSettings] = useState<ClubSettings>({ showHackathonMatrix: false });

  // New Opportunity Form State
  const [oppTitle, setOppTitle] = useState('');
  const [oppOrg, setOppOrg] = useState('');
  const [oppCategory, setOppCategory] = useState<'hackathon' | 'internship' | 'opensource' | 'hiring'>('hackathon');
  const [oppTags, setOppTags] = useState('#Hackathon, #Remote');
  const [oppDesc, setOppDesc] = useState('');
  const [oppUrl, setOppUrl] = useState('');
  const [oppDeadline, setOppDeadline] = useState('2026-12-31T23:59:59');

  useEffect(() => {
    const unsubEvents = subscribeEventsService(setEvents);
    const unsubRegs = subscribeAllRegistrationsService(setRegistrations);
    const unsubIdeas = subscribeIdeaRequestsService(setIdeas);
    const unsubSettings = subscribeClubSettingsService(setClubSettings);
    return () => {
      unsubEvents();
      unsubRegs();
      unsubIdeas();
      unsubSettings();
    };
  }, []);

  const handleToggleHackathonMatrix = async () => {
    const nextVal = !clubSettings.showHackathonMatrix;
    setClubSettings(prev => ({ ...prev, showHackathonMatrix: nextVal }));
    await updateClubSettingsService({ showHackathonMatrix: nextVal });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtDescription.trim()) return;

    try {
      const created = await createEventService({
        title: evtTitle,
        category: evtCategory,
        description: evtDescription,
        status: 'open',
        image: evtImage,
        date: evtDate,
        location: evtLocation,
        registration_start_time: new Date(evtStartTime).toISOString(),
        registration_end_time: new Date(evtEndTime).toISOString(),
        is_inter_college: evtIsInterCollege,
        min_team_size: Number(evtMinTeam),
        max_team_size: Number(evtMaxTeam),
        max_seats: Number(evtSeats),
        attendance_count: 0,
        hostingType: evtHostingType,
        externalRegistrationUrl: evtHostingType === 'external' ? (evtExternalUrl.trim() || undefined) : undefined,
        organizerName: evtHostingType === 'external' ? (evtOrganizerName.trim() || undefined) : undefined
      });

      setEvents([created, ...events]);
      setShowNewEventModal(false);
      // Reset form
      setEvtTitle('');
      setEvtDescription('');
      setEvtHostingType('in-house');
      setEvtExternalUrl('');
      setEvtOrganizerName('');
    } catch (e) {
      console.error('Error creating event', e);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppTitle.trim() || !oppUrl.trim()) return;

    try {
      await createOpportunityService({
        title: oppTitle,
        organization: oppOrg,
        category: oppCategory,
        tags: oppTags.split(',').map(t => t.trim()),
        description: oppDesc,
        externalUrl: oppUrl,
        deadline: new Date(oppDeadline).toISOString()
      });
      setShowNewOppModal(false);
      setOppTitle('');
      setOppUrl('');
    } catch (e) {
      console.error('Error creating opportunity', e);
    }
  };

  const handleApproveProposal = async (idea: IdeaHubRequest) => {
    // Immediately and permanently remove from pending moderation panel
    setIdeas(prev => prev.filter(i => i.id !== idea.id));
    await updateIdeaStatusService(idea.id, 'approved');
    // Pre-fill new event modal from idea
    setEvtTitle(idea.title);
    setEvtDescription(idea.description);
    setEvtCategory(idea.category as any || 'workshop');
    setShowNewEventModal(true);
  };

  const handleRejectProposal = async (ideaId: string) => {
    // Immediately and permanently remove from pending moderation panel
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    await updateIdeaStatusService(ideaId, 'rejected');
  };

  const handleExportExcel = (eventId: string, eventTitle: string) => {
    const eventRegs = registrations.filter(r => r.eventId === eventId);
    if (eventRegs.length === 0) {
      alert(`No registrations found for ${eventTitle}.`);
      return;
    }

    const isVardhaman = (college: string) => {
      const c = (college || '').toLowerCase().trim();
      return c.includes('vardhaman') || c.includes('vce');
    };

    // ── Helper to auto-fit columns and freeze header row ─────────────────
    const formatWorksheet = (ws: XLSX.WorkSheet, defaultWidths: Record<string, number> = {}) => {
      if (!ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      const colWidths: { wch: number }[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 10;
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        const headerText = headerCell ? String(headerCell.v || '') : '';
        if (defaultWidths[headerText]) {
          maxLen = defaultWidths[headerText];
        } else if (headerText.length > maxLen) {
          maxLen = headerText.length;
        }
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const valStr = String(cell.v);
            if (valStr.length > maxLen) {
              maxLen = valStr.length;
            }
          }
        }
        colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 65) });
      }
      ws['!cols'] = colWidths;
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    };

    // ── 1. Master Registrations Sheet ────────────────────────────────────
    const masterRows = eventRegs.map((r, idx) => {
      const checkedInDate = r.checkedInAt ? new Date(r.checkedInAt) : null;
      const regDate = r.createdAt ? new Date(r.createdAt) : null;
      const isVce = isVardhaman(r.collegeName);
      
      const memberCount = r.registrationType === 'team'
        ? (1 + (r.teamMembers ? r.teamMembers.length : 0))
        : 1;

      const membersFormatted = r.teamMembers && r.teamMembers.length > 0
        ? r.teamMembers.map(m => `${m.name} (${m.rollNumber}) - ${m.email}`).join(' ; ')
        : 'N/A (Solo)';

      return {
        'S.No': idx + 1,
        'Registration ID': r.id,
        'Participant Name': r.userName || 'N/A',
        'Roll Number': String(r.rollNumber || 'N/A').toUpperCase(),
        'Email Address': r.userEmail || 'N/A',
        'Phone Number': String(r.phoneNumber || 'N/A'),
        'College Name': r.collegeName || 'N/A',
        'College Affiliation': isVce ? 'Vardhaman College (Internal)' : 'External College',
        'Registration Mode': r.registrationType === 'team' ? 'Team' : 'Solo',
        'Team Name': r.teamName || (r.registrationType === 'team' ? 'Unnamed Squad' : 'N/A'),
        'Team Code': r.teamCode || 'N/A',
        'Total Team Size': memberCount,
        'Team Members Details': membersFormatted,
        'Pass Type': r.passType === 'paid' ? 'Paid Workshop Pass' : 'Free Pass',
        'Amount Paid (₹)': r.amountPaid !== undefined ? r.amountPaid : (r.passType === 'paid' ? 99 : 0),
        'UTR / Reference Number': r.utrNumber || 'N/A',
        'Payment Status': (r.paymentStatus || (r.passType === 'paid' ? 'pending_review' : 'free_verified')).toUpperCase(),
        'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
        'Registration Status': (r.status || 'confirmed').toUpperCase(),
        'Check-In Date': checkedInDate ? checkedInDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Checked In',
        'Check-In Time': checkedInDate ? checkedInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A',
        'Registration Date': regDate ? regDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
      };
    });

    // ── 2. Individual Students Roster Sheet (All individual attendees expanded) ──
    const individualRows: any[] = [];
    let studentIndex = 1;

    eventRegs.forEach((r) => {
      const isVce = isVardhaman(r.collegeName);
      const checkedInDate = r.checkedInAt ? new Date(r.checkedInAt) : null;
      const checkInFormatted = checkedInDate 
        ? `${checkedInDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${checkedInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
        : 'Not Checked In';

      // Add Team Leader / Solo student
      individualRows.push({
        'S.No': studentIndex++,
        'Student Full Name': r.userName,
        'Roll Number': String(r.rollNumber || '').toUpperCase(),
        'Email Address': r.userEmail,
        'Phone / WhatsApp': String(r.phoneNumber || 'N/A'),
        'College Name': r.collegeName,
        'Affiliation': isVce ? 'Vardhaman College' : 'External',
        'Student Role': r.registrationType === 'team' ? 'Team Leader' : 'Solo Participant',
        'Team Name': r.teamName || (r.registrationType === 'team' ? 'Team' : 'N/A'),
        'Team Code': r.teamCode || 'N/A',
        'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
        'Verified Check-In': checkInFormatted
      });

      // Add teammate rows if team registration
      if (r.registrationType === 'team' && r.teamMembers && r.teamMembers.length > 0) {
        r.teamMembers.forEach((member) => {
          individualRows.push({
            'S.No': studentIndex++,
            'Student Full Name': member.name,
            'Roll Number': String(member.rollNumber || '').toUpperCase(),
            'Email Address': member.email || 'N/A',
            'Phone / WhatsApp': 'Linked to Team Leader',
            'College Name': r.collegeName,
            'Affiliation': isVce ? 'Vardhaman College' : 'External',
            'Student Role': 'Team Member',
            'Team Name': r.teamName || 'Team',
            'Team Code': r.teamCode || 'N/A',
            'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
            'Verified Check-In': checkInFormatted
          });
        });
      }
    });

    // ── 3. Vardhaman College HOD Submission Sheet ───────────────────────
    const vceRegs = eventRegs.filter(r => isVardhaman(r.collegeName));
    const vceRows = vceRegs.map((r, idx) => {
      const checkedInDate = r.checkedInAt ? new Date(r.checkedInAt) : null;
      return {
        'S.No': idx + 1,
        'Roll Number': String(r.rollNumber || '').toUpperCase(),
        'Full Name': r.userName,
        'Phone / WhatsApp': String(r.phoneNumber || 'N/A'),
        'Email Address': r.userEmail,
        'Registration Mode': r.registrationType === 'team' ? `Team (${r.teamCode || 'Code'})` : 'Solo',
        'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
        'Check-In Timestamp': checkedInDate ? checkedInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Not Checked In',
        'Registration Status': (r.status || 'confirmed').toUpperCase()
      };
    });

    // ── 4. External Colleges Sheet ───────────────────────────────────────
    const extRegs = eventRegs.filter(r => !isVardhaman(r.collegeName));
    const extRows = extRegs.map((r, idx) => {
      const checkedInDate = r.checkedInAt ? new Date(r.checkedInAt) : null;
      return {
        'S.No': idx + 1,
        'College / University Name': r.collegeName,
        'Roll / Student ID': String(r.rollNumber || '').toUpperCase(),
        'Full Name': r.userName,
        'Phone / WhatsApp': String(r.phoneNumber || 'N/A'),
        'Email Address': r.userEmail,
        'Registration Mode': r.registrationType === 'team' ? `Team (${r.teamCode || 'Code'})` : 'Solo',
        'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
        'Check-In Timestamp': checkedInDate ? checkedInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Not Checked In'
      };
    });

    // ── 5. Executive Statistics & Summary Sheet ──────────────────────────
    const totalRegs = eventRegs.length;
    const totalPresent = eventRegs.filter(r => r.checkedIn).length;
    const totalAbsent = totalRegs - totalPresent;
    const overallRate = totalRegs > 0 ? +((totalPresent / totalRegs) * 100).toFixed(2) : 0;

    const vcePresent = vceRegs.filter(r => r.checkedIn).length;
    const vceAbsent = vceRegs.length - vcePresent;
    const vceRate = vceRegs.length > 0 ? +((vcePresent / vceRegs.length) * 100).toFixed(2) : 0;

    const extPresent = extRegs.filter(r => r.checkedIn).length;
    const extAbsent = extRegs.length - extPresent;
    const extRate = extRegs.length > 0 ? +((extPresent / extRegs.length) * 100).toFixed(2) : 0;

    const soloCount = eventRegs.filter(r => r.registrationType === 'solo').length;
    const teamCount = eventRegs.filter(r => r.registrationType === 'team').length;

    const summaryData = [
      { 'Report Metric': 'Event Title', 'Value': eventTitle },
      { 'Report Metric': 'Report Generated At', 'Value': new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' }) },
      { 'Report Metric': 'Total Registrations', 'Value': totalRegs },
      { 'Report Metric': 'Total Individual Students Accounted', 'Value': individualRows.length },
      { 'Report Metric': 'Total Attendees Present', 'Value': totalPresent },
      { 'Report Metric': 'Total Attendees Absent', 'Value': totalAbsent },
      { 'Report Metric': 'Overall Attendance Percentage (%)', 'Value': `${overallRate}%` },
      { 'Report Metric': '----------------------------------------', 'Value': '----------------------------------------' },
      { 'Report Metric': 'Vardhaman College - Total Registrations', 'Value': vceRegs.length },
      { 'Report Metric': 'Vardhaman College - Present Count', 'Value': vcePresent },
      { 'Report Metric': 'Vardhaman College - Absent Count', 'Value': vceAbsent },
      { 'Report Metric': 'Vardhaman College - Attendance Rate (%)', 'Value': `${vceRate}%` },
      { 'Report Metric': '----------------------------------------', 'Value': '----------------------------------------' },
      { 'Report Metric': 'External Colleges - Total Registrations', 'Value': extRegs.length },
      { 'Report Metric': 'External Colleges - Present Count', 'Value': extPresent },
      { 'Report Metric': 'External Colleges - Absent Count', 'Value': extAbsent },
      { 'Report Metric': 'External Colleges - Attendance Rate (%)', 'Value': `${extRate}%` },
      { 'Report Metric': '----------------------------------------', 'Value': '----------------------------------------' },
      { 'Report Metric': 'Solo Registrations Count', 'Value': soloCount },
      { 'Report Metric': 'Team Registrations Count', 'Value': teamCount },
      { 'Report Metric': 'Certification Authority', 'Value': 'Student Developers Club (SDC) • Vardhaman College of Engineering' }
    ];

    // ── Create Workbook & Append Sheets ──────────────────────────────────
    const workbook = XLSX.utils.book_new();

    const masterSheet = XLSX.utils.json_to_sheet(masterRows);
    formatWorksheet(masterSheet);
    XLSX.utils.book_append_sheet(workbook, masterSheet, 'Master Roster');

    const individualSheet = XLSX.utils.json_to_sheet(individualRows);
    formatWorksheet(individualSheet);
    XLSX.utils.book_append_sheet(workbook, individualSheet, 'All Individual Students');

    const vceSheet = XLSX.utils.json_to_sheet(vceRows.length > 0 ? vceRows : [{ 'Message': 'No Vardhaman College registrations recorded for this event.' }]);
    formatWorksheet(vceSheet);
    XLSX.utils.book_append_sheet(workbook, vceSheet, 'VCE Attendance (HOD)');

    const extSheet = XLSX.utils.json_to_sheet(extRows.length > 0 ? extRows : [{ 'Message': 'No external college registrations recorded for this event.' }]);
    formatWorksheet(extSheet);
    XLSX.utils.book_append_sheet(workbook, extSheet, 'External Colleges');

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    formatWorksheet(summarySheet, { 'Report Metric': 40, 'Value': 50 });
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `${safeTitle}_Official_Attendance_Roster.xlsx`);
  };

  // Backwards compatibility alias
  const handleExportCSV = handleExportExcel;

  const handleExportAllClubExcel = () => {
    if (registrations.length === 0) {
      alert('No registrations found in the database.');
      return;
    }

    const isVardhaman = (college: string) => {
      const c = (college || '').toLowerCase().trim();
      return c.includes('vardhaman') || c.includes('vce');
    };

    const formatWorksheet = (ws: XLSX.WorkSheet) => {
      if (!ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      const colWidths: { wch: number }[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const valStr = String(cell.v);
            if (valStr.length > maxLen) {
              maxLen = valStr.length;
            }
          }
        }
        colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 65) });
      }
      ws['!cols'] = colWidths;
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    };

    const masterRows = registrations.map((r, idx) => {
      const checkedInDate = r.checkedInAt ? new Date(r.checkedInAt) : null;
      const regDate = r.createdAt ? new Date(r.createdAt) : null;
      const isVce = isVardhaman(r.collegeName);
      return {
        'S.No': idx + 1,
        'Event Title': r.eventTitle || 'SDC Event',
        'Registration ID': r.id,
        'Participant Name': r.userName,
        'Roll Number': String(r.rollNumber || '').toUpperCase(),
        'Email Address': r.userEmail,
        'Phone Number': String(r.phoneNumber || 'N/A'),
        'College Name': r.collegeName,
        'College Affiliation': isVce ? 'Vardhaman College' : 'External College',
        'Registration Mode': r.registrationType === 'team' ? 'Team' : 'Solo',
        'Team Name': r.teamName || 'N/A',
        'Team Code': r.teamCode || 'N/A',
        'Pass Type': r.passType === 'paid' ? 'Paid Workshop Pass' : 'Free Pass',
        'Amount Paid (₹)': r.amountPaid !== undefined ? r.amountPaid : (r.passType === 'paid' ? 99 : 0),
        'UTR / Reference Number': r.utrNumber || 'N/A',
        'Payment Status': (r.paymentStatus || (r.passType === 'paid' ? 'pending_review' : 'free_verified')).toUpperCase(),
        'Attendance Status': r.checkedIn ? 'PRESENT' : 'ABSENT',
        'Check-In Date': checkedInDate ? checkedInDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Checked In',
        'Check-In Time': checkedInDate ? checkedInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A',
        'Registration Date': regDate ? regDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
      };
    });

    const workbook = XLSX.utils.book_new();
    const masterSheet = XLSX.utils.json_to_sheet(masterRows);
    formatWorksheet(masterSheet);
    XLSX.utils.book_append_sheet(workbook, masterSheet, 'All Club Registrations');

    XLSX.writeFile(workbook, `SDC_All_Events_Master_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownloadHODReport = (event: EventItem) => {
    const eventRegs = registrations.filter(r => r.eventId === event.id);
    const presentRegs = eventRegs.filter(r => r.checkedIn);
    const absentRegs = eventRegs.filter(r => !r.checkedIn);

    const isVardhaman = (r: EventRegistration) => 
      r.collegeName.toLowerCase().includes('vardhaman') || r.userEmail.toLowerCase().includes('vardhaman');

    const vPresent = presentRegs.filter(isVardhaman);
    const oPresent = presentRegs.filter(r => !isVardhaman(r));
    const vAbsent = absentRegs.filter(isVardhaman);
    const oAbsent = absentRegs.filter(r => !isVardhaman(r));

    const total = eventRegs.length;
    const presentCount = presentRegs.length;
    const absentCount = absentRegs.length;
    const percent = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';

    let txt = `========================================================================================\n`;
    txt += `            STUDENT DEVELOPERS CLUB (SDC) - VARDHAMAN COLLEGE OF ENGINEERING\n`;
    txt += `                     OFFICIAL EVENT ATTENDANCE REPORT FOR HOD\n`;
    txt += `========================================================================================\n`;
    txt += `Event Title          : ${event.title}\n`;
    txt += `Category             : ${event.category.toUpperCase()}\n`;
    txt += `Scheduled Date       : ${event.date}\n`;
    txt += `Report Generated On  : ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString()}\n`;
    txt += `Total Registered     : ${total}\n`;
    txt += `Total Presentees     : ${presentCount} (${percent}%)\n`;
    txt += `Total Absentees      : ${absentCount}\n`;
    txt += `========================================================================================\n\n`;

    txt += `SUMMARY BY INSTITUTION:\n`;
    txt += `- Vardhaman College of Engineering : ${vPresent.length + vAbsent.length} Registered | ${vPresent.length} Present | ${vAbsent.length} Absent\n`;
    txt += `- External / Other Colleges        : ${oPresent.length + oAbsent.length} Registered | ${oPresent.length} Present | ${oAbsent.length} Absent\n`;
    txt += `========================================================================================\n\n`;

    txt += `----------------------------------------------------------------------------------------\n`;
    txt += `[SECTION 1: PRESENTEES LIST - ATTENDED AND VERIFIED AT EVENT]\n`;
    txt += `----------------------------------------------------------------------------------------\n\n`;

    txt += `>>> 1.1 VARDHAMAN COLLEGE OF ENGINEERING - PRESENTEES (${vPresent.length})\n`;
    txt += `No.  | Roll Number   | Full Name                     | Phone / WhatsApp | Email                        | Team / Mode  | Check-in Time\n`;
    txt += `-----+---------------+-------------------------------+------------------+------------------------------+--------------+---------------------\n`;
    if (vPresent.length === 0) {
      txt += `     (No present attendees recorded from Vardhaman College)\n`;
    } else {
      vPresent.forEach((r, i) => {
        const no = String(i + 1).padEnd(4);
        const roll = r.rollNumber.padEnd(13);
        const name = r.userName.padEnd(29).substring(0, 29);
        const phone = (r.phoneNumber || 'N/A').padEnd(16);
        const email = r.userEmail.padEnd(28).substring(0, 28);
        const team = (r.registrationType === 'team' ? (r.teamCode || 'Team') : 'Solo').padEnd(12);
        const time = r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : 'Verified';
        txt += `${no} | ${roll} | ${name} | ${phone} | ${email} | ${team} | ${time}\n`;
      });
    }
    txt += `\n`;

    txt += `>>> 1.2 EXTERNAL / OTHER COLLEGES - PRESENTEES (${oPresent.length})\n`;
    txt += `No.  | College Name                  | Roll ID       | Full Name             | Phone            | Email                 | Check-in Time\n`;
    txt += `-----+-------------------------------+---------------+-----------------------+------------------+-----------------------+---------------------\n`;
    if (oPresent.length === 0) {
      txt += `     (No present attendees recorded from external colleges)\n`;
    } else {
      oPresent.forEach((r, i) => {
        const no = String(i + 1).padEnd(4);
        const clg = r.collegeName.padEnd(29).substring(0, 29);
        const roll = r.rollNumber.padEnd(13);
        const name = r.userName.padEnd(21).substring(0, 21);
        const phone = (r.phoneNumber || 'N/A').padEnd(16);
        const email = r.userEmail.padEnd(21).substring(0, 21);
        const time = r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : 'Verified';
        txt += `${no} | ${clg} | ${roll} | ${name} | ${phone} | ${email} | ${time}\n`;
      });
    }
    txt += `\n\n`;

    txt += `----------------------------------------------------------------------------------------\n`;
    txt += `[SECTION 2: ABSENTEES LIST - REGISTERED BUT NOT ATTENDED]\n`;
    txt += `----------------------------------------------------------------------------------------\n\n`;

    txt += `>>> 2.1 VARDHAMAN COLLEGE OF ENGINEERING - ABSENTEES (${vAbsent.length})\n`;
    txt += `No.  | Roll Number   | Full Name                     | Phone / WhatsApp | Email                        | Team / Mode\n`;
    txt += `-----+---------------+-------------------------------+------------------+------------------------------+--------------\n`;
    if (vAbsent.length === 0) {
      txt += `     (Zero absentees! 100% attendance from Vardhaman College)\n`;
    } else {
      vAbsent.forEach((r, i) => {
        const no = String(i + 1).padEnd(4);
        const roll = r.rollNumber.padEnd(13);
        const name = r.userName.padEnd(29).substring(0, 29);
        const phone = (r.phoneNumber || 'N/A').padEnd(16);
        const email = r.userEmail.padEnd(28).substring(0, 28);
        const team = (r.registrationType === 'team' ? (r.teamCode || 'Team') : 'Solo').padEnd(12);
        txt += `${no} | ${roll} | ${name} | ${phone} | ${email} | ${team}\n`;
      });
    }
    txt += `\n`;

    txt += `>>> 2.2 EXTERNAL / OTHER COLLEGES - ABSENTEES (${oAbsent.length})\n`;
    txt += `No.  | College Name                  | Roll ID       | Full Name             | Phone            | Email\n`;
    txt += `-----+-------------------------------+---------------+-----------------------+------------------+-----------------------\n`;
    if (oAbsent.length === 0) {
      txt += `     (Zero absentees from external colleges)\n`;
    } else {
      oAbsent.forEach((r, i) => {
        const no = String(i + 1).padEnd(4);
        const clg = r.collegeName.padEnd(29).substring(0, 29);
        const roll = r.rollNumber.padEnd(13);
        const name = r.userName.padEnd(21).substring(0, 21);
        const phone = (r.phoneNumber || 'N/A').padEnd(16);
        const email = r.userEmail.padEnd(21).substring(0, 21);
        txt += `${no} | ${clg} | ${roll} | ${name} | ${phone} | ${email}\n`;
      });
    }
    txt += `\n========================================================================================\n`;
    txt += `Official Attendance Ledger Certified by Student Developers Club (SDC)\n`;
    txt += `Vardhaman College of Engineering • Autonomous Institution Affiliated to JNTUH\n`;
    txt += `========================================================================================\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_HOD_Attendance_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleCheckIn = async (reg: EventRegistration) => {
    const newStatus = !reg.checkedIn;
    const checkInTime = newStatus ? new Date().toISOString() : undefined;
    const updated: EventRegistration = { ...reg, checkedIn: newStatus, checkedInAt: checkInTime };

    setRegistrations(prev => prev.map(r => r.id === reg.id ? updated : r));

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'event_registrations', reg.id), {
          checkedIn: newStatus,
          checkedInAt: checkInTime || null
        });
        const eventRef = doc(db, 'events', reg.eventId);
        await updateDoc(eventRef, { attendance_count: increment(newStatus ? 1 : -1) });
      } catch (e) {
        console.warn('Firestore toggle check-in error', e);
      }
    }
  };

  const handleApprovePayment = async (reg: EventRegistration) => {
    try {
      await updateRegistrationPaymentStatusService(reg.id, 'approved');
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paymentStatus: 'approved', status: 'confirmed' } : r));
    } catch (e) {
      console.warn('Error approving pass payment:', e);
      alert('Failed to approve payment. Please check console.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPaymentIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedPaymentIds) {
        await updateRegistrationPaymentStatusService(id, 'approved');
      }
      setRegistrations(prev => prev.map(r => selectedPaymentIds.includes(r.id) ? { ...r, paymentStatus: 'approved', status: 'confirmed' } : r));
      setSelectedPaymentIds([]);
    } catch (e) {
      console.error('Bulk approve error:', e);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPaymentIds.length === 0) return;
    if (!confirm(`Are you sure you want to reject ${selectedPaymentIds.length} selected payment(s)?`)) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedPaymentIds) {
        await updateRegistrationPaymentStatusService(id, 'rejected');
      }
      setRegistrations(prev => prev.map(r => selectedPaymentIds.includes(r.id) ? { ...r, paymentStatus: 'rejected', status: 'cancelled' } : r));
      setSelectedPaymentIds([]);
    } catch (e) {
      console.error('Bulk reject error:', e);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleRejectPayment = async (reg: EventRegistration) => {
    if (!confirm(`Are you sure you want to reject the payment for ${reg.userName} (UTR: ${reg.utrNumber || 'N/A'})?`)) {
      return;
    }
    try {
      await updateRegistrationPaymentStatusService(reg.id, 'rejected');
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paymentStatus: 'rejected', status: 'cancelled' } : r));
    } catch (e) {
      console.warn('Error rejecting pass payment:', e);
    }
  };

  if (role !== 'admin') {
    return (
      <main className="flex-grow pt-32 pb-section-gap px-container-padding text-center">
        <h2 className="text-white text-2xl font-bold mb-4 font-headline-lg">Access Denied</h2>
        <p className="text-on-surface-variant font-code-sm">
          You need Admin privileges to access the SDC Command Center. Please sign in with an authorized Administrator account.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-background relative pt-20">
      {/* Header with 3-Line Menu Button */}
      <header className="flex items-center justify-between px-container-padding py-3 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md z-20 sticky top-16">
        <div className="flex items-center gap-3">
          {/* 3-Line Menu Button (Admin Navigation Drawer) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-neon-purple/20 border border-white/15 hover:border-neon-purple/50 text-white flex items-center justify-center transition-all shadow-soft-ui cursor-pointer group"
            title="Open Admin Navigation Menu"
          >
            <span className="material-symbols-outlined text-xl text-white/80 group-hover:text-neon-purple group-hover:scale-110 transition-transform">
              menu
            </span>
          </button>

          <h1 className="font-headline-lg text-lg md:text-xl text-on-surface flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-neon-purple text-xl">admin_panel_settings</span>
            <span>Command Center</span>
          </h1>

          {/* Active Tab Chip Indicator */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono font-bold text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse"></span>
            <span>
              {adminNavTab === 'payments' ? 'UPI Verification' : adminNavTab === 'events' ? 'Events & Roster' : adminNavTab === 'ideas' ? 'Idea Hub Moderation' : 'System Settings'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/80 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live</span>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[99999] flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#080d1a] border-r border-white/15 p-5 flex flex-col shadow-2xl z-10 animate-slideRight overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="font-headline-lg text-white font-bold text-sm leading-tight">Command Center</h3>
                  <p className="text-[10px] font-mono text-white/40">Admin Navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Section Label: Views */}
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2 px-1">Views</p>

            {/* Navigation Items — Ordered: Events → UPI Verification → Idea Hub → System */}
            <nav className="space-y-1.5 mb-6">
              {/* 1. Events & Attendance */}
              <button
                type="button"
                onClick={() => { setAdminNavTab('events'); setIsDrawerOpen(false); }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adminNavTab === 'events'
                    ? 'bg-neon-purple/15 border-neon-purple/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-neon-purple">event_available</span>
                  <div>
                    <div className="text-xs font-bold">Events & Attendance</div>
                    <div className="text-[10px] text-white/40">Manage seats, roster & exports</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-mono">
                  {events.length}
                </span>
              </button>

              {/* 2. UPI & Screenshot Review */}
              <button
                type="button"
                onClick={() => { setAdminNavTab('payments'); setIsDrawerOpen(false); }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adminNavTab === 'payments'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-amber-400">receipt_long</span>
                  <div>
                    <div className="text-xs font-bold">UPI & Screenshot Review</div>
                    <div className="text-[10px] text-white/40">Verify UTR & entry passes</div>
                  </div>
                </div>
                {registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'pending_review').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold animate-pulse">
                    {registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'pending_review').length}
                  </span>
                )}
              </button>

              {/* 3. Idea Hub Moderation */}
              <button
                type="button"
                onClick={() => { setAdminNavTab('ideas'); setIsDrawerOpen(false); }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adminNavTab === 'ideas'
                    ? 'bg-electric-cyan/15 border-electric-cyan/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-electric-cyan">how_to_vote</span>
                  <div>
                    <div className="text-xs font-bold">Idea Hub Moderation</div>
                    <div className="text-[10px] text-white/40">Community workshop proposals</div>
                  </div>
                </div>
                {ideas.filter(i => i.status === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-electric-cyan/20 text-electric-cyan text-[10px] font-mono font-bold">
                    {ideas.filter(i => i.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* 4. System & Settings */}
              <button
                type="button"
                onClick={() => { setAdminNavTab('overview'); setIsDrawerOpen(false); }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  adminNavTab === 'overview'
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-white/60">settings</span>
                  <div>
                    <div className="text-xs font-bold">System & Settings</div>
                    <div className="text-[10px] text-white/40">Matrix toggles & status</div>
                  </div>
                </div>
              </button>
            </nav>

            {/* Section Label: Quick Actions */}
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2 px-1">Quick Actions</p>

            <div className="space-y-1.5 mb-auto">
              <button
                type="button"
                onClick={() => { setShowNewEventModal(true); setIsDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-neon-purple">add_circle</span>
                <span>Create New Event</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowQRScanner(true); setIsDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-white/70">qr_code_scanner</span>
                <span>QR Badge Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowNewOppModal(true); setIsDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-electric-cyan/70">hub</span>
                <span>Publish Opportunity</span>
              </button>

              <button
                type="button"
                onClick={() => { handleExportAllClubExcel(); setIsDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-emerald-400/70">table_view</span>
                <span>Export All Data (.xlsx)</span>
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-white/10 pt-3 mt-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>Firestore</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-container-padding space-y-8 max-w-7xl mx-auto w-full">

        {/* Top Row: System Status & Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="soft-ui-card rounded-3xl p-5 relative overflow-hidden group border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div className="font-label-caps text-[10px] text-amber-400 tracking-widest uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">hourglass_top</span>
                <span>PENDING REVIEWS</span>
              </div>
            </div>
            <div className="text-2xl font-bold font-headline-xl text-amber-300 mb-1">
              {registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'pending_review').length}
            </div>
            <p className="text-[11px] text-white/50">Unverified UPI UTR submissions</p>
          </div>

          <div className="soft-ui-card rounded-3xl p-5 relative overflow-hidden group border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div className="font-label-caps text-[10px] text-emerald-400 tracking-widest uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>APPROVED PASSES</span>
              </div>
            </div>
            <div className="text-2xl font-bold font-headline-xl text-emerald-300 mb-1">
              {registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'approved').length}
            </div>
            <p className="text-[11px] text-white/50">Verified entry QR tickets issued</p>
          </div>

          <div className="soft-ui-card rounded-3xl p-5 relative overflow-hidden group border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div className="font-label-caps text-[10px] text-electric-cyan tracking-widest uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">group</span>
                <span>TOTAL REGISTRATIONS</span>
              </div>
            </div>
            <div className="text-2xl font-bold font-headline-xl text-white mb-1">
              {registrations.length}
            </div>
            <p className="text-[11px] text-white/50">Across all platform workshops</p>
          </div>

          <div className="soft-ui-card rounded-3xl p-5 relative overflow-hidden group border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div className="font-label-caps text-[10px] text-neon-purple tracking-widest uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">payments</span>
                <span>TOTAL REVENUE (EST)</span>
              </div>
            </div>
            <div className="text-2xl font-bold font-headline-xl text-white mb-1">
              ₹{registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'approved').reduce((acc, curr) => acc + (curr.amountPaid || 99), 0)}
            </div>
            <p className="text-[11px] text-white/50">0% fees, directly into club account</p>
          </div>
        </section>

        {/* TAB 1: DEDICATED UPI & SCREENSHOT VERIFICATION TERMINAL */}
        {adminNavTab === 'payments' && (
          <section className="space-y-6 animate-fadeIn">
            {/* Action & Filter Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl bg-[#090f1e]/90 border border-amber-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                  </div>
                  <h2 className="text-white font-bold text-lg tracking-tight font-headline-lg">
                    UPI Payment & Screenshot Review Terminal
                  </h2>
                </div>
                <p className="text-xs text-white/60 max-w-xl leading-relaxed">
                  Verify student 12-digit UPI UTR numbers against your club bank account / Google Pay statement and inspect payment screenshots to instantly issue verified entry passes.
                </p>
              </div>

              {/* Status Filter Badges */}
              <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentFilterStatus('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    paymentFilterStatus === 'pending'
                      ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">hourglass_top</span>
                  <span>Pending ({registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'pending_review').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilterStatus('approved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    paymentFilterStatus === 'approved'
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Approved ({registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'approved').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilterStatus('rejected')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    paymentFilterStatus === 'rejected'
                      ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">cancel</span>
                  <span>Rejected ({registrations.filter(r => r.passType === 'paid' && r.paymentStatus === 'rejected').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilterStatus('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    paymentFilterStatus === 'all'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>All ({registrations.filter(r => r.passType === 'paid').length})</span>
                </button>
              </div>
            </div>

            {/* Event Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Event Selector Dropdown */}
              <div className="md:col-span-1">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-purple text-lg pointer-events-none">
                    event
                  </span>
                  <select
                    value={selectedEventIdForPayments}
                    onChange={(e) => setSelectedEventIdForPayments(e.target.value)}
                    className="w-full bg-[#0a1020] border border-white/15 rounded-2xl pl-10 pr-8 py-3 text-white text-xs font-bold focus:outline-none focus:border-neon-purple transition-all appearance-none cursor-pointer shadow-soft-ui"
                  >
                    <option value="all" className="bg-[#0a1020] text-white">
                      All Events ({events.length})
                    </option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id} className="bg-[#0a1020] text-white">
                        {evt.title} ({registrations.filter(r => r.eventId === evt.id && r.passType === 'paid').length} Paid)
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                    unfold_more
                  </span>
                </div>
              </div>

              {/* Search Bar for UTR / Student Name / Roll Number */}
              <div className="md:col-span-2 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search by 12-digit UTR Number, Student Name, Roll Number, or Email..."
                  value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                  className="w-full bg-[#0a1020] border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-500/60 focus:bg-white/[0.07] transition-all shadow-soft-ui"
                />
                {paymentSearchQuery && (
                  <button
                    onClick={() => setPaymentSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {(() => {
              const pendingRegs = registrations.filter(r => {
                if (r.passType !== 'paid' || r.paymentStatus !== 'pending_review') return false;
                if (selectedEventIdForPayments !== 'all' && r.eventId !== selectedEventIdForPayments) return false;
                return true;
              });

              const allVisiblePaidIds = registrations.filter(r => {
                if (r.passType !== 'paid') return false;
                if (selectedEventIdForPayments !== 'all' && r.eventId !== selectedEventIdForPayments) return false;
                if (paymentFilterStatus === 'pending' && r.paymentStatus !== 'pending_review') return false;
                if (paymentFilterStatus === 'approved' && r.paymentStatus !== 'approved') return false;
                if (paymentFilterStatus === 'rejected' && r.paymentStatus !== 'rejected') return false;
                return true;
              }).map(r => r.id);

              const isAllSelected = allVisiblePaidIds.length > 0 && allVisiblePaidIds.every(id => selectedPaymentIds.includes(id));

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPaymentIds(allVisiblePaidIds);
                          } else {
                            setSelectedPaymentIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Select All Visible ({allVisiblePaidIds.length})</span>
                    </label>

                    {selectedPaymentIds.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                        {selectedPaymentIds.length} Selected
                      </span>
                    )}
                  </div>

                  {selectedPaymentIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBulkApprove}
                        disabled={isBulkProcessing}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold font-mono shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">done_all</span>
                        <span>{isBulkProcessing ? 'Approving...' : `Approve (${selectedPaymentIds.length}) Passes`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleBulkReject}
                        disabled={isBulkProcessing}
                        className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        <span>Reject Selected</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentIds([])}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                      >
                        Deselect
                      </button>
                    </div>
                  ) : (
                    pendingRegs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const ids = pendingRegs.map(r => r.id);
                          setSelectedPaymentIds(ids);
                        }}
                        className="text-amber-300 hover:text-amber-200 text-xs font-mono font-bold underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">checklist</span>
                        <span>Select All {pendingRegs.length} Pending Passes</span>
                      </button>
                    )
                  )}
                </div>
              );
            })()}

            {/* List of Payments for Review */}
            {(() => {
              const paidList = registrations.filter(r => {
                if (r.passType !== 'paid') return false;
                if (selectedEventIdForPayments !== 'all' && r.eventId !== selectedEventIdForPayments) return false;
                if (paymentFilterStatus === 'pending' && r.paymentStatus !== 'pending_review') return false;
                if (paymentFilterStatus === 'approved' && r.paymentStatus !== 'approved') return false;
                if (paymentFilterStatus === 'rejected' && r.paymentStatus !== 'rejected') return false;

                if (paymentSearchQuery.trim()) {
                  const q = paymentSearchQuery.toLowerCase();
                  const matchUtr = (r.utrNumber || '').toLowerCase().includes(q);
                  const matchName = (r.userName || '').toLowerCase().includes(q);
                  const matchRoll = (r.rollNumber || '').toLowerCase().includes(q);
                  const matchEmail = (r.userEmail || '').toLowerCase().includes(q);
                  const matchEvent = (r.eventTitle || '').toLowerCase().includes(q);
                  return matchUtr || matchName || matchRoll || matchEmail || matchEvent;
                }
                return true;
              });

              if (paidList.length === 0) {
                return (
                  <div className="py-16 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">task_alt</span>
                    </div>
                    <h3 className="text-white font-bold text-base">No Payments Under This Filter</h3>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      {paymentFilterStatus === 'pending'
                        ? 'All submitted UPI payments have been reviewed! New submissions will show up here in real time.'
                        : 'No records matching your search query.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paidList.map((reg) => {
                    const isPending = reg.paymentStatus === 'pending_review';
                    const isApproved = reg.paymentStatus === 'approved';
                    const isRejected = reg.paymentStatus === 'rejected';
                    const isSelected = selectedPaymentIds.includes(reg.id);

                    return (
                      <div
                        key={reg.id}
                        className={`rounded-3xl p-5 border flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-amber-400 bg-amber-500/10 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                            : isPending
                            ? 'bg-gradient-to-b from-[#181a10] to-[#0c0d0a] border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                            : isApproved
                            ? 'bg-gradient-to-b from-[#091a14] to-[#050e0a] border-emerald-500/30'
                            : 'bg-white/[0.02] border-white/10'
                        }`}
                      >
                        {/* Status Header Strip with Checkbox */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPaymentIds(prev => [...prev, reg.id]);
                                } else {
                                  setSelectedPaymentIds(prev => prev.filter(id => id !== reg.id));
                                }
                              }}
                              className="w-4 h-4 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-white/70">
                              {reg.eventTitle || 'Event Pass'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono uppercase flex items-center gap-1 animate-pulse">
                                <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                <span>Pending Review</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>Verified Pass Issued</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">close</span>
                                <span>Rejected</span>
                              </span>
                            )}
                            <span className="text-xs font-bold text-white font-mono px-2 py-0.5 rounded bg-white/10">
                              ₹{reg.amountPaid || 99}
                            </span>
                          </div>
                        </div>

                        {/* Student Details & Transaction Info */}
                        <div className="space-y-3 text-xs">
                          {/* Student Info */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-bold text-sm tracking-tight">{reg.userName}</h4>
                              <div className="text-white/60 text-[11px] font-mono mt-0.5">
                                Roll ID: <strong className="text-white">{reg.rollNumber}</strong> • {reg.collegeName}
                              </div>
                              <div className="text-white/50 text-[11px] font-mono">
                                Email: {reg.userEmail} • Phone: {reg.phoneNumber || 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* 12-Digit UTR Box with Copy Button */}
                          <div className="p-3 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono text-amber-300/80 uppercase block tracking-wider font-bold">
                                12-Digit UPI Reference / UTR
                              </span>
                              <span className="text-sm font-mono font-extrabold text-amber-300 tracking-wider">
                                {reg.utrNumber || '(No UTR entered)'}
                              </span>
                            </div>
                            {reg.utrNumber && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(reg.utrNumber!);
                                  alert(`Copied UTR: ${reg.utrNumber}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
                                title="Copy UTR Number"
                              >
                                <span className="material-symbols-outlined text-xs">content_copy</span>
                                <span>Copy</span>
                              </button>
                            )}
                          </div>

                          {/* Payment Screenshot Preview Card */}
                          {reg.paymentScreenshotUrl ? (
                            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
                              <div 
                                onClick={() => setViewingScreenshotUrl(reg.paymentScreenshotUrl!)}
                                className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-white/20 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={reg.paymentScreenshotUrl}
                                  alt="Payment Screenshot"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-white flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm text-electric-cyan">image</span>
                                  <span>Payment Screenshot Attached</span>
                                </div>
                                <p className="text-[10px] text-white/50 truncate">
                                  Click to enlarge receipt for date/amount check
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewingScreenshotUrl(reg.paymentScreenshotUrl!)}
                                className="px-3 py-1.5 rounded-xl bg-electric-cyan/20 border border-electric-cyan/40 text-electric-cyan hover:bg-electric-cyan hover:text-black font-bold text-[11px] transition-all shrink-0 cursor-pointer"
                              >
                                View Receipt
                              </button>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-dashed border-white/15 text-[11px] text-white/40 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">hide_image</span>
                              <span>No screenshot uploaded (Verified via UTR number only)</span>
                            </div>
                          )}
                        </div>

                        {/* Action Footer Buttons */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                          <span className="text-[10px] text-white/40 font-mono">
                            Registered: {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
                          </span>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPayment(reg)}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold font-mono transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprovePayment(reg)}
                                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">verified</span>
                                  <span>Approve Pass</span>
                                </button>
                              </>
                            )}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleRejectPayment(reg)}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 text-xs font-mono transition-all cursor-pointer"
                                title="Revoke pass if transaction was refunded or reversed"
                              >
                                Revoke Pass
                              </button>
                            )}
                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(reg)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-all cursor-pointer"
                              >
                                Re-Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {/* TAB 2: UPCOMING EVENTS & COMMUNITY PROPOSALS */}
        {(adminNavTab === 'events' || adminNavTab === 'overview') && (
          <>
            {/* Landing Page Feature Visibility & Controls */}
            <div className="soft-ui-panel rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-soft-ui-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-neon-purple text-lg">tune</span>
                  <h3 className="text-white font-bold text-sm">Landing Page Feature: Flagship Hackathon Matrix</h3>
                  <span className={`text-[10px] mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    clubSettings.showHackathonMatrix
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-white/50 border border-white/10'
                  }`}>
                    {clubSettings.showHackathonMatrix ? 'Currently Visible' : 'Currently Hidden'}
                  </span>
                </div>
                <p className="text-xs text-white/50 max-w-2xl leading-relaxed">
                  Toggle the dedicated Hackathon Tracks & ₹5,00,000+ Prize Pool Matrix on the public Landing Page. Keep hidden when no major hackathon is actively running.
                </p>
              </div>
              <button
                onClick={handleToggleHackathonMatrix}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  clubSettings.showHackathonMatrix
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-aurora'
                    : 'soft-ui-btn text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {clubSettings.showHackathonMatrix ? 'visibility' : 'visibility_off'}
                </span>
                <span>{clubSettings.showHackathonMatrix ? 'Hide from Landing Page' : 'Show on Landing Page'}</span>
              </button>
            </div>

            {/* Data Grid: Upcoming Event Control */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Event Control Panel */}
          <div className="soft-ui-card rounded-3xl flex flex-col h-[520px] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h2 className="font-headline-lg text-lg text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-cyan">event_available</span>
                Upcoming Event Control
              </h2>
              <span className="text-xs font-code-sm text-on-surface-variant">{events.length} Events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {events.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant font-code-sm text-xs flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">event_busy</span>
                  <p className="text-white font-bold text-sm">No Events Created Yet</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">Click "+ NEW EVENT" above to publish a workshop or hackathon.</p>
                </div>
              ) : (
                events.map((evt) => {
                  const eventRegs = registrations.filter(r => r.eventId === evt.id);
                  const attendeeCount = Math.max(evt.registered_count || 0, eventRegs.length);

                  return (
                    <div key={evt.id} className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-electric-cyan/10 text-electric-cyan border border-electric-cyan/20 px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold">
                              {evt.category}
                            </span>
                            <h3 className="font-bold text-white text-base">{evt.title}</h3>
                          </div>
                          <div className="text-xs font-code-sm text-on-surface-variant flex items-center gap-3">
                            <span>{evt.date}</span>
                            <span className="text-electric-cyan font-bold">{attendeeCount} / {evt.max_seats} Regs</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingRegistrationsEvent(evt)}
                            className="px-2.5 py-1 rounded-lg bg-neon-purple/20 text-xs font-code-sm text-neon-purple border border-neon-purple/40 hover:bg-neon-purple hover:text-white transition-colors flex items-center gap-1 font-bold"
                            title="View Registered Attendees List"
                          >
                            <span className="material-symbols-outlined text-xs">group</span>
                            <span>Attendees ({eventRegs.length})</span>
                          </button>
                          <button
                            onClick={() => handleExportExcel(evt.id, evt.title)}
                            className="px-2.5 py-1 rounded bg-emerald-500/15 text-xs font-code-sm text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1 font-bold cursor-pointer"
                            title="Export Structured Multi-Tab Excel Workbook (.xlsx)"
                          >
                            <span className="material-symbols-outlined text-xs">table_view</span>
                            <span>Export Excel</span>
                          </button>
                          <button
                            onClick={() => deleteEventService(evt.id).then(() => setEvents(events.filter(e => e.id !== evt.id)))}
                            className="p-1 rounded bg-surface-bright text-error hover:bg-error-container/40 transition-colors"
                            title="Delete Event"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/10 text-xs font-code-sm">
                        <div>
                          <span className="text-on-surface-variant">Team Max Size: </span>
                          <span className="text-white font-bold">{evt.max_team_size}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Inter-College: </span>
                          <span className={evt.is_inter_college ? 'text-success-glow font-bold' : 'text-error font-bold'}>
                            {evt.is_inter_college ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Community Proposals Moderation Panel (PENDING ONLY) */}
          <div className="bg-surface-gray border border-outline-variant/10 rounded-2xl flex flex-col h-[520px]">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-gray/50 rounded-t-2xl">
              <h2 className="font-headline-lg text-lg text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">how_to_vote</span>
                Idea Hub Moderation Panel
              </h2>
              <span className="bg-tertiary/10 text-tertiary px-2.5 py-0.5 rounded-full font-code-sm text-xs border border-tertiary/30">
                {ideas.filter(i => i.status === 'pending').length} Pending
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {ideas.filter(i => i.status === 'pending').length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant font-code-sm text-xs flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl text-neon-purple mb-2">task_alt</span>
                  <p className="text-white font-bold text-sm">All Proposals Moderated</p>
                  <p className="text-on-surface-variant text-[11px] mt-1 max-w-xs">
                    Accepted and scheduled proposals are cleared from this panel. Newly proposed workshop topics will appear here.
                  </p>
                </div>
              ) : (
                ideas.filter(i => i.status === 'pending').map((idea) => (
                  <div key={idea.id} className="flex items-center gap-4 bg-surface-container-low border border-outline-variant/10 p-3.5 rounded-xl">
                    <div className="flex flex-col items-center justify-center bg-surface-bright rounded-lg p-2 min-w-[55px] border border-outline-variant/10">
                      <span className="material-symbols-outlined text-tertiary text-sm">arrow_upward</span>
                      <span className="font-code-sm font-bold text-white text-xs">{idea.upvotesCount}</span>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">{idea.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-1">{idea.description}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="text-[10px] text-outline font-code-sm">by {idea.authorName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleApproveProposal(idea)}
                        className="bg-neon-purple/20 hover:bg-neon-purple text-neon-purple hover:text-white border border-neon-purple/40 px-3 py-1 rounded font-label-caps text-[10px] transition-all font-bold"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => handleRejectProposal(idea.id)}
                        className="bg-surface-bright hover:bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded font-label-caps text-[10px] transition-all"
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </section>
          </>
        )}

        {/* TAB 3: IDEA HUB PROPOSALS (when selected directly) */}
        {adminNavTab === 'ideas' && (
          <section className="animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-surface-gray border border-outline-variant/20 rounded-3xl flex flex-col min-h-[500px] shadow-soft-ui-lg overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-gray/50 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-tertiary/20 border border-tertiary/40 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-base">how_to_vote</span>
                  </div>
                  <h2 className="font-headline-lg text-lg text-white font-bold">
                    Community Workshop Proposals Moderation
                  </h2>
                </div>
                <span className="bg-tertiary/20 text-tertiary px-3 py-1 rounded-full font-code-sm text-xs border border-tertiary/30 font-bold">
                  {ideas.filter(i => i.status === 'pending').length} Awaiting Approval
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {ideas.filter(i => i.status === 'pending').length === 0 ? (
                  <div className="p-16 text-center text-on-surface-variant font-code-sm text-xs flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-neon-purple mb-3">task_alt</span>
                    <p className="text-white font-bold text-base">All Proposals Moderated</p>
                    <p className="text-on-surface-variant text-xs mt-1 max-w-sm">
                      Accepted and scheduled proposals are cleared from this panel. Newly proposed workshop topics will appear here.
                    </p>
                  </div>
                ) : (
                  ideas.filter(i => i.status === 'pending').map((idea) => (
                    <div key={idea.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0c1222] border border-white/10 p-5 rounded-2xl shadow-sm">
                      <div className="flex sm:flex-col items-center justify-center bg-white/5 rounded-xl p-3 min-w-[65px] border border-white/10 gap-1">
                        <span className="material-symbols-outlined text-tertiary text-base">arrow_upward</span>
                        <span className="font-code-sm font-bold text-white text-sm">{idea.upvotesCount}</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-white text-base">{idea.title}</h4>
                        <p className="text-xs text-white/70 leading-relaxed">{idea.description}</p>
                        <div className="mt-1 flex gap-2">
                          <span className="text-[11px] text-white/40 font-code-sm">Proposed by: <strong className="text-white/80">{idea.authorName}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleRejectProposal(idea.id)}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveProposal(idea)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-aurora transition-all"
                        >
                          Approve & Schedule
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        </div>

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-gray border border-outline-variant/30 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
              <h3 className="font-headline-lg text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-neon-purple">add_circle</span>
                Create New Upcoming Event
              </h3>
              <button onClick={() => setShowNewEventModal(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 font-body-md text-xs">
              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Category</label>
                  <select
                    value={evtCategory}
                    onChange={(e: any) => setEvtCategory(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="speaker">Speaker Talk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Display Date / Time</label>
                  <input
                    type="text"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={evtDescription}
                  onChange={(e) => setEvtDescription(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                ></textarea>
              </div>

              {/* Hosting Scope & Registration Mode */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <label className="block text-white font-bold font-code-sm text-xs">
                  Event Hosting Scope & Registration Mode *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvtHostingType('in-house')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      evtHostingType === 'in-house'
                        ? 'bg-neon-purple/20 border-neon-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-surface-container border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-neon-purple">domain</span>
                      SDC / In-House Event
                    </span>
                    <span className="text-[10px] text-white/50 leading-tight">
                      Hosted at Vardhaman College. Native SDC registration, team codes & QR pass.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvtHostingType('external')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      evtHostingType === 'external'
                        ? 'bg-electric-cyan/20 border-electric-cyan text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                        : 'bg-surface-container border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-electric-cyan">open_in_new</span>
                      External / Company Event
                    </span>
                    <span className="text-[10px] text-white/50 leading-tight">
                      Other college, hackathon platform, or tech firm with external website redirect.
                    </span>
                  </button>
                </div>

                {evtHostingType === 'external' && (
                  <div className="pt-2 space-y-2.5">
                    <div>
                      <label className="block text-white/80 font-code-sm text-[11px] mb-1">
                        External Registration / Official Website URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={evtExternalUrl}
                        onChange={(e) => setEvtExternalUrl(e.target.value)}
                        placeholder="e.g. https://unstop.com/hackathons/xyz or https://devfolio.co/..."
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white placeholder-white/30 text-xs"
                      />
                      <p className="text-[10px] text-white/50 mt-1">
                        💡 <em>If not yet released, leave blank! The website will notify students: &quot;Link not found yet — please search, and if found mail us&quot;.</em>
                      </p>
                    </div>

                    <div>
                      <label className="block text-white/80 font-code-sm text-[11px] mb-1">
                        Host Entity / College Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={evtOrganizerName}
                        onChange={(e) => setEvtOrganizerName(e.target.value)}
                        placeholder="e.g. IIT Bombay / Google / MLH"
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white placeholder-white/30 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Max Team Size</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={evtMaxTeam}
                    onChange={(e) => setEvtMaxTeam(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Max Seats Capacity</label>
                  <input
                    type="number"
                    value={evtSeats}
                    onChange={(e) => setEvtSeats(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Registration Start Time</label>
                  <input
                    type="datetime-local"
                    value={evtStartTime}
                    onChange={(e) => setEvtStartTime(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Registration End Time</label>
                  <input
                    type="datetime-local"
                    value={evtEndTime}
                    onChange={(e) => setEvtEndTime(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="interCollege"
                  checked={evtIsInterCollege}
                  onChange={(e) => setEvtIsInterCollege(e.target.checked)}
                  className="rounded bg-surface-container text-neon-purple focus:ring-0"
                />
                <label htmlFor="interCollege" className="text-on-surface font-code-sm text-xs">
                  Allow External College Guest Registrations (`is_inter_college`)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 rounded font-code-sm text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-neon-purple text-white font-label-caps uppercase font-bold hover:bg-inverse-primary"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Opportunity Modal */}
      {showNewOppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-gray border border-outline-variant/30 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
              <h3 className="font-headline-lg text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-cyan">hub</span>
                Publish Opportunity to Campus Radar
              </h3>
              <button onClick={() => setShowNewOppModal(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-3 font-body-md text-xs">
              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Hack Week"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Major League Hacking"
                  value={oppOrg}
                  onChange={(e) => setOppOrg(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Category</label>
                  <select
                    value={oppCategory}
                    onChange={(e: any) => setOppCategory(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="internship">Internship</option>
                    <option value="opensource">Open Source</option>
                    <option value="hiring">Hiring Challenge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={oppTags}
                    onChange={(e) => setOppTags(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">External Application URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={oppUrl}
                  onChange={(e) => setOppUrl(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={oppDesc}
                  onChange={(e) => setOppDesc(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2.5 text-white"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-outline-variant/20">
                <button type="button" onClick={() => setShowNewOppModal(false)} className="px-4 py-2 rounded font-code-sm text-on-surface-variant">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-electric-cyan text-white font-label-caps uppercase font-bold">
                  Publish Radar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Attendance Scanner Modal */}
      {showQRScanner && (
        <QRCheckinModal 
          onClose={() => setShowQRScanner(false)} 
          onCheckInSuccess={(updatedReg) => {
            setRegistrations(prev => [updatedReg, ...prev.filter(r => r.id !== updatedReg.id)]);
          }}
        />
      )}

      {/* Attendee Roster & Attendance Command Modal */}
      {viewingRegistrationsEvent && (() => {
        const eventRegs = registrations.filter(r => r.eventId === viewingRegistrationsEvent.id);
        const presentCount = eventRegs.filter(r => r.checkedIn).length;
        const absentCount = eventRegs.filter(r => !r.checkedIn).length;
        const vCount = eventRegs.filter(r => r.collegeName.toLowerCase().includes('vardhaman')).length;
        const oCount = eventRegs.length - vCount;

        const paidRegs = eventRegs.filter(r => r.passType === 'paid');
        const pendingPaidCount = paidRegs.filter(r => r.paymentStatus === 'pending_review').length;
        const approvedPaidCount = paidRegs.filter(r => r.paymentStatus === 'approved').length;
        const freeCount = eventRegs.filter(r => r.passType !== 'paid').length;

        const filteredRegs = eventRegs.filter(r => {
          if (rosterFilter === 'present') return r.checkedIn;
          if (rosterFilter === 'absent') return !r.checkedIn;
          if (rosterFilter === 'vardhaman') return r.collegeName.toLowerCase().includes('vardhaman');
          if (rosterFilter === 'other') return !r.collegeName.toLowerCase().includes('vardhaman');
          if (rosterFilter === 'paid_pending') return r.passType === 'paid' && r.paymentStatus === 'pending_review';
          if (rosterFilter === 'paid_approved') return r.passType === 'paid' && r.paymentStatus === 'approved';
          if (rosterFilter === 'free') return r.passType !== 'paid';
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-deep-black/85 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#0b1326] border border-white/20 rounded-3xl max-w-4xl w-full p-6 sm:p-8 relative shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-electric-cyan/20 text-electric-cyan text-[10px] font-label-caps uppercase px-2.5 py-0.5 rounded-lg border border-electric-cyan/30 font-bold">
                      {viewingRegistrationsEvent.category} Roster
                    </span>
                    <span className="text-on-surface-variant text-xs font-code-sm">
                      Capacity: {viewingRegistrationsEvent.max_seats}
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-xl sm:text-2xl font-bold text-white mt-1">
                    {viewingRegistrationsEvent.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Download HOD Report (.txt) */}
                  <button
                    onClick={() => handleDownloadHODReport(viewingRegistrationsEvent)}
                    className="px-3.5 py-2 rounded-xl bg-success-glow/20 text-success-glow border border-success-glow/40 hover:bg-success-glow hover:text-white transition-all text-xs font-code-sm font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                    title="Download structured official attendance text file for HOD"
                  >
                    <span className="material-symbols-outlined text-sm">description</span>
                    <span>Download HOD Report (.txt)</span>
                  </button>

                  {/* Export Excel (.xlsx) */}
                  <button
                    onClick={() => handleExportExcel(viewingRegistrationsEvent.id, viewingRegistrationsEvent.title)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black border border-emerald-500/40 transition-all text-xs font-code-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    title="Export Complete Structured Multi-Tab Excel Workbook (.xlsx)"
                  >
                    <span className="material-symbols-outlined text-sm">table_view</span>
                    <span>Export Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => setViewingRegistrationsEvent(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white flex items-center justify-center border border-white/10"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>

              {/* Attendance & Payment Statistics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] font-code-sm text-on-surface-variant uppercase block">Total</span>
                  <span className="text-xl font-bold text-white">{eventRegs.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[10px] font-code-sm text-amber-300 uppercase block font-bold">UTR Pending</span>
                  <span className="text-xl font-bold text-amber-300">{pendingPaidCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[10px] font-code-sm text-emerald-300 uppercase block font-bold">Paid Approved</span>
                  <span className="text-xl font-bold text-emerald-300">{approvedPaidCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-success-glow/10 border border-success-glow/30 text-center">
                  <span className="text-[10px] font-code-sm text-success-glow uppercase block font-bold">Present</span>
                  <span className="text-xl font-bold text-success-glow">{presentCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-code-sm text-electric-cyan uppercase block font-bold">VCE / Other</span>
                  <span className="text-xl font-bold text-white">{vCount} / {oCount}</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3 text-xs font-code-sm">
                <span className="text-on-surface-variant mr-1 text-[11px]">Filter:</span>
                <button
                  onClick={() => setRosterFilter('all')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'all' ? 'bg-white/20 text-white font-bold' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  All ({eventRegs.length})
                </button>
                {pendingPaidCount > 0 && (
                  <button
                    onClick={() => setRosterFilter('paid_pending')}
                    className={`px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 ${
                      rosterFilter === 'paid_pending'
                        ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-amber-500/10 text-amber-300/80 hover:text-amber-200 border border-amber-500/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">hourglass_top</span>
                    <span>Payment Pending ({pendingPaidCount})</span>
                  </button>
                )}
                <button
                  onClick={() => setRosterFilter('paid_approved')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'paid_approved' ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Paid Approved ({approvedPaidCount})
                </button>
                <button
                  onClick={() => setRosterFilter('free')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'free' ? 'bg-white/20 text-white font-bold border border-white/30' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Free Passes ({freeCount})
                </button>
                <button
                  onClick={() => setRosterFilter('present')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'present' ? 'bg-success-glow/25 text-success-glow font-bold border border-success-glow/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setRosterFilter('absent')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'absent' ? 'bg-error-container/30 text-error font-bold border border-error/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Absent ({absentCount})
                </button>
                <button
                  onClick={() => setRosterFilter('vardhaman')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'vardhaman' ? 'bg-neon-purple/25 text-neon-purple font-bold border border-neon-purple/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  VCE ({vCount})
                </button>
                <button
                  onClick={() => setRosterFilter('other')}
                  className={`px-2.5 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'other' ? 'bg-electric-cyan/25 text-electric-cyan font-bold border border-electric-cyan/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Other ({oCount})
                </button>
              </div>

              {/* Attendee List Table */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredRegs.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant font-code-sm text-xs bg-white/[0.02] rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined text-4xl text-neon-purple mb-2">person_search</span>
                    <p className="text-white font-bold text-sm">No Attendees Match This Filter</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Try selecting &quot;All&quot; to view the complete registration ledger.
                    </p>
                  </div>
                ) : (
                  filteredRegs.map((reg) => (
                    <div
                      key={reg.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                        reg.passType === 'paid' && reg.paymentStatus === 'pending_review'
                          ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : reg.checkedIn
                          ? 'bg-success-glow/[0.04] border-success-glow/30 hover:border-success-glow/50'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-bold text-sm">{reg.userName}</span>
                          
                          {/* Pass Type & Payment Badges */}
                          {reg.passType === 'paid' ? (
                            reg.paymentStatus === 'approved' ? (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2.5 py-0.5 rounded-lg font-code-sm font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>PAID PASS (₹{reg.amountPaid || 99}) APPROVED</span>
                              </span>
                            ) : reg.paymentStatus === 'rejected' ? (
                              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] px-2.5 py-0.5 rounded-lg font-code-sm font-bold">
                                PAYMENT REJECTED
                              </span>
                            ) : (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2.5 py-0.5 rounded-lg font-code-sm font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse">
                                <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                <span>PAYMENT PENDING REVIEW (₹{reg.amountPaid || 99})</span>
                              </span>
                            )
                          ) : (
                            <span className="bg-white/10 text-on-surface-variant border border-white/15 text-[10px] px-2 py-0.5 rounded-md font-code-sm font-bold">
                              FREE PASS
                            </span>
                          )}

                          {reg.checkedIn ? (
                            <span className="bg-success-glow/20 text-success-glow border border-success-glow/40 text-[10px] px-2.5 py-0.5 rounded-lg font-code-sm font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span>PRESENT</span>
                            </span>
                          ) : (
                            <span className="bg-error-container/20 text-error border border-error/30 text-[10px] px-2 py-0.5 rounded-lg font-code-sm font-bold">
                              ABSENT
                            </span>
                          )}

                          {reg.collegeName.toLowerCase().includes('vardhaman') ? (
                            <span className="bg-neon-purple/15 text-neon-purple text-[10px] px-2 py-0.5 rounded-md font-code-sm border border-neon-purple/30">
                              VCE Internal
                            </span>
                          ) : (
                            <span className="bg-electric-cyan/15 text-electric-cyan text-[10px] px-2 py-0.5 rounded-md font-code-sm border border-electric-cyan/30">
                              External College
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-on-surface-variant font-code-sm flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5 items-center">
                          {reg.utrNumber && (
                            <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
                              <span>UTR: {reg.utrNumber}</span>
                            </span>
                          )}
                          {reg.paymentScreenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(reg.paymentScreenshotUrl!)}
                              className="text-electric-cyan hover:text-white underline transition-colors flex items-center gap-1 text-[11px] font-bold"
                            >
                              <span className="material-symbols-outlined text-xs">image</span>
                              <span>View Receipt Screenshot</span>
                            </button>
                          )}
                          <span>Phone: <strong className="text-white font-mono">{reg.phoneNumber || 'N/A'}</strong></span>
                          <span>Email: <strong className="text-white">{reg.userEmail}</strong></span>
                          <span>Roll ID: <strong className="text-white font-mono">{reg.rollNumber}</strong></span>
                          <span>College: <strong className="text-white">{reg.collegeName}</strong></span>
                          {reg.checkedInAt && (
                            <span className="text-success-glow">
                              Check-in Time: <strong>{new Date(reg.checkedInAt).toLocaleTimeString()}</strong>
                            </span>
                          )}
                          {reg.registrationType === 'team' && (
                            <span>Team: <strong className="text-neon-purple">{reg.teamName} ({reg.teamCode})</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Pass Approval + Attendance */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* If Paid Pass is Pending Review: Show 1-Click Approve Button */}
                        {reg.passType === 'paid' && reg.paymentStatus === 'pending_review' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(reg)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400 font-bold text-xs font-code-sm shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all flex items-center gap-1 cursor-pointer"
                              title="Verify UTR and activate student QR check-in pass"
                            >
                              <span className="material-symbols-outlined text-xs">verified</span>
                              <span>Approve Pass</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectPayment(reg)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs font-code-sm transition-all"
                              title="Reject invalid transaction UTR"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(reg)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-code-sm font-bold border transition-colors flex items-center gap-1 ${
                            reg.checkedIn
                              ? 'bg-white/5 border-white/15 text-on-surface-variant hover:text-error hover:border-error/40'
                              : 'bg-success-glow/20 border-success-glow/40 text-success-glow hover:bg-success-glow hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {reg.checkedIn ? 'undo' : 'check'}
                          </span>
                          <span>{reg.checkedIn ? 'Mark Absent' : 'Mark Present'}</span>
                        </button>
                        <span className="text-[10px] font-mono text-on-surface-variant">#{reg.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Screenshot Modal */}
      {viewingScreenshotUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-deep-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0b1326] border border-white/20 rounded-3xl max-w-lg w-full p-5 relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-cyan">receipt_long</span>
                <span>Submitted Payment Screenshot</span>
              </h4>
              <button
                onClick={() => setViewingScreenshotUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black flex items-center justify-center p-2">
              <img
                src={viewingScreenshotUrl}
                alt="Payment Receipt"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewingScreenshotUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
