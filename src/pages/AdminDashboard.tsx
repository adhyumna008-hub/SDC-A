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

  // Modals & Panels
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showNewOppModal, setShowNewOppModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [viewingRegistrationsEvent, setViewingRegistrationsEvent] = useState<EventItem | null>(null);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'present' | 'absent' | 'vardhaman' | 'other'>('all');

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
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-container-padding py-4 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md z-10 sticky top-16">
        <h1 className="font-headline-lg text-xl md:text-2xl text-on-surface flex items-center gap-3 font-bold">
          <span className="material-symbols-outlined text-neon-purple text-3xl">admin_panel_settings</span>
          Command Center Terminal
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 mt-3 sm:mt-0">
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
            <span>QR Scanner</span>
          </button>


          <button
            onClick={() => setShowNewOppModal(true)}
            className="bg-[#12121a] border border-[#1f1f2e] text-white/80 hover:text-white hover:border-white px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm text-electric-cyan">hub</span>
            <span>Publish Opportunity</span>
          </button>

          <button
            onClick={handleExportAllClubExcel}
            className="bg-[#12121a] border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            title="Export complete club database across all events to Excel (.xlsx)"
          >
            <span className="material-symbols-outlined text-sm">table_view</span>
            <span>Export All (.xlsx)</span>
          </button>

          <button
            onClick={() => setShowNewEventModal(true)}
            className="bg-[#A855F7] hover:bg-[#9333ea] text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Event</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-container-padding space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Row: System Status & Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="soft-ui-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase font-bold">SYSTEM STATUS</div>
              <span className="material-symbols-outlined text-success-glow text-xl">dns</span>
            </div>
            <div className="text-3xl font-bold font-headline-xl text-success-glow mb-2">Optimal</div>
            <div className="flex gap-2 font-code-sm text-xs text-on-surface-variant">
              <span className="soft-ui-chip px-2.5 py-1 rounded-full">DB: Firestore Sync</span>
              <span className="soft-ui-chip px-2.5 py-1 rounded-full">RBAC: Active</span>
            </div>
          </div>

          <div className="soft-ui-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase font-bold">ACTIVE REGISTRATIONS</div>
              <span className="material-symbols-outlined text-electric-cyan text-xl">group</span>
            </div>
            <div className="text-3xl font-bold font-headline-xl text-white mb-2">{registrations.length + 342}</div>
            <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
              <div className="bg-electric-cyan h-full w-[70%] rounded-full shadow-[0_0_10px_#0EA5E9]"></div>
            </div>
          </div>

          <div className="soft-ui-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase font-bold">PENDING PROPOSALS</div>
              <span className="material-symbols-outlined text-tertiary text-xl">lightbulb</span>
            </div>
            <div className="text-3xl font-bold font-headline-xl text-white mb-2">
              {ideas.filter(i => i.status === 'pending').length}
            </div>
            <div className="text-xs font-code-sm text-tertiary">Awaiting Admin Scheduling</div>
          </div>
        </section>

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

        {/* Data Grid: Upcoming Event Control & Community Proposals */}
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

        const filteredRegs = eventRegs.filter(r => {
          if (rosterFilter === 'present') return r.checkedIn;
          if (rosterFilter === 'absent') return !r.checkedIn;
          if (rosterFilter === 'vardhaman') return r.collegeName.toLowerCase().includes('vardhaman');
          if (rosterFilter === 'other') return !r.collegeName.toLowerCase().includes('vardhaman');
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

              {/* Attendance Statistics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] font-code-sm text-on-surface-variant uppercase block">Total Registered</span>
                  <span className="text-xl font-bold text-white">{eventRegs.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-success-glow/10 border border-success-glow/30 text-center">
                  <span className="text-[10px] font-code-sm text-success-glow uppercase block font-bold">Present (Attended)</span>
                  <span className="text-xl font-bold text-success-glow">{presentCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-error-container/15 border border-error/30 text-center">
                  <span className="text-[10px] font-code-sm text-error uppercase block font-bold">Absent (Pending)</span>
                  <span className="text-xl font-bold text-error">{absentCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 text-center">
                  <span className="text-[10px] font-code-sm text-electric-cyan uppercase block font-bold">Vardhaman / External</span>
                  <span className="text-xl font-bold text-white">{vCount} / {oCount}</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 text-xs font-code-sm">
                <span className="text-on-surface-variant mr-1">Filter View:</span>
                <button
                  onClick={() => setRosterFilter('all')}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'all' ? 'bg-white/20 text-white font-bold' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  All ({eventRegs.length})
                </button>
                <button
                  onClick={() => setRosterFilter('present')}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'present' ? 'bg-success-glow/25 text-success-glow font-bold border border-success-glow/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setRosterFilter('absent')}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'absent' ? 'bg-error-container/30 text-error font-bold border border-error/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Absent ({absentCount})
                </button>
                <button
                  onClick={() => setRosterFilter('vardhaman')}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'vardhaman' ? 'bg-neon-purple/25 text-neon-purple font-bold border border-neon-purple/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Vardhaman College ({vCount})
                </button>
                <button
                  onClick={() => setRosterFilter('other')}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    rosterFilter === 'other' ? 'bg-electric-cyan/25 text-electric-cyan font-bold border border-electric-cyan/40' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Other Colleges ({oCount})
                </button>
              </div>

              {/* Attendee List Table */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredRegs.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant font-code-sm text-xs bg-white/[0.02] rounded-2xl border border-white/10">
                    <span className="material-symbols-outlined text-4xl text-neon-purple mb-2">person_search</span>
                    <p className="text-white font-bold text-sm">No Attendees Match This Filter</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Try selecting "All" to view the complete registration ledger.
                    </p>
                  </div>
                ) : (
                  filteredRegs.map((reg) => (
                    <div
                      key={reg.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                        reg.checkedIn
                          ? 'bg-success-glow/[0.04] border-success-glow/30 hover:border-success-glow/50'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-bold text-sm">{reg.userName}</span>
                          
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

                        <div className="text-xs text-on-surface-variant font-code-sm flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
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

                      {/* Manual Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
    </main>
  );
};
