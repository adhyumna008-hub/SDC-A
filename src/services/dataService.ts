import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { EventItem, IdeaHubRequest, Opportunity, EventRegistration, SystemAnnouncement, ClubSettings } from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_IDEAS, 
  INITIAL_OPPORTUNITIES, 
  INITIAL_ANNOUNCEMENTS, 
  MOCK_USER_REGISTRATIONS 
} from './mockData';

// Local storage keys for persistent demo mode testing
const LOCAL_STORAGE_EVENTS = 'sdc_events_v1';
const LOCAL_STORAGE_IDEAS = 'sdc_ideas_v1';
const LOCAL_STORAGE_OPPS = 'sdc_opps_v1';
const LOCAL_STORAGE_REGS = 'sdc_regs_v1';

// Helper to strip undefined values so Firestore never throws 'Unsupported field value: undefined'
export const cleanObjectForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

// Helper to initialize local storage
const getLocalData = <T>(key: string, initial: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch (e) {
    return initial;
  }
};

const setLocalData = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};

// ----------------------------------------------------
// EVENTS SERVICE
// ----------------------------------------------------
export const getEventsService = async (): Promise<EventItem[]> => {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const events: EventItem[] = [];
      querySnapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });
      return events;
    } catch (e) {
      console.warn('Firestore fetch failed, falling back to local events', e);
    }
  }
  return getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
};

export const subscribeEventsService = (callback: (events: EventItem[]) => void) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const events: EventItem[] = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });
      // Merge with any locally created events
      const localEvents = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
      const combined = [...events];
      localEvents.forEach(le => {
        if (!combined.some(c => c.id === le.id)) {
          combined.push(le);
        }
      });
      callback(combined);
    }, (error) => {
      console.warn('Realtime events listener error', error);
      callback(getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS));
    });
  } else {
    callback(getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS));
    const handleStorageChange = () => callback(getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const createEventService = async (eventData: Omit<EventItem, 'id' | 'registered_count'> & { registered_count?: number }): Promise<EventItem> => {
  const newEvent: EventItem = {
    ...eventData,
    id: `evt-${Date.now()}`,
    registered_count: eventData.registered_count ?? 0,
    attendance_count: eventData.attendance_count ?? 0,
    createdAt: new Date().toISOString()
  };

  let savedEvent = newEvent;

  if (isFirebaseConfigured) {
    try {
      const cleanData = cleanObjectForFirestore(newEvent);
      const docRef = await addDoc(collection(db, 'events'), cleanData);
      savedEvent = { ...newEvent, id: docRef.id };
    } catch (e) {
      console.warn('Firestore create event failed, saving to local state', e);
    }
  }

  const events = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
  const updated = [savedEvent, ...events.filter(e => e.id !== savedEvent.id)];
  setLocalData(LOCAL_STORAGE_EVENTS, updated);
  window.dispatchEvent(new Event('storage'));
  return savedEvent;
};

export const updateEventService = async (id: string, updates: Partial<EventItem>): Promise<void> => {
  if (isFirebaseConfigured) {
    try {
      const cleanUpdates = cleanObjectForFirestore(updates);
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, cleanUpdates);
    } catch (e) {
      console.warn('Firestore update event failed', e);
    }
  }

  const events = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
  const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
  setLocalData(LOCAL_STORAGE_EVENTS, updated);
  window.dispatchEvent(new Event('storage'));
};

export const deleteEventService = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Firestore delete event failed', e);
    }
  }

  const events = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
  const updated = events.filter(e => e.id !== id);
  setLocalData(LOCAL_STORAGE_EVENTS, updated);
  window.dispatchEvent(new Event('storage'));
};

// ----------------------------------------------------
// IDEA HUB (EVENT REQUESTS) SERVICE
// ----------------------------------------------------
export const subscribeIdeaRequestsService = (callback: (ideas: IdeaHubRequest[]) => void) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'event_requests'), orderBy('upvotesCount', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const ideas: IdeaHubRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as IdeaHubRequest;
        // Never show approved or rejected ideas in the active queue!
        if (data.status !== 'approved' && data.status !== 'rejected') {
          ideas.push({ ...data, id: docSnap.id });
        }
      });
      callback(ideas);
    }, (err) => {
      console.warn('Idea hub realtime listener error', err);
      const local = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS);
      callback(local.filter(i => i.status !== 'approved' && i.status !== 'rejected'));
    });
  } else {
    const ideas = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS)
      .filter(i => i.status !== 'approved' && i.status !== 'rejected');
    ideas.sort((a, b) => b.upvotesCount - a.upvotesCount);
    callback(ideas);
    const handleStorageChange = () => {
      const current = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS)
        .filter(i => i.status !== 'approved' && i.status !== 'rejected');
      current.sort((a, b) => b.upvotesCount - a.upvotesCount);
      callback(current);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const submitIdeaRequestService = async (
  requestData: Omit<IdeaHubRequest, 'id' | 'upvotesCount' | 'upvotedBy' | 'status' | 'createdAt'>
): Promise<IdeaHubRequest> => {
  const newIdea: IdeaHubRequest = {
    ...requestData,
    id: `idea-${Date.now()}`,
    upvotesCount: 1,
    upvotedBy: [requestData.authorId],
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'event_requests'), newIdea);
      return { ...newIdea, id: docRef.id };
    } catch (e) {
      console.warn('Firestore idea submission failed', e);
    }
  }

  const ideas = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS);
  const updated = [newIdea, ...ideas];
  setLocalData(LOCAL_STORAGE_IDEAS, updated);
  window.dispatchEvent(new Event('storage'));
  return newIdea;
};

export const toggleUpvoteIdeaService = async (
  ideaId: string, 
  userId: string, 
  currentlyUpvoted?: boolean
): Promise<{ success: boolean; hasUpvoted?: boolean; newCount?: number }> => {
  let hasUpvoted = currentlyUpvoted;

  if (isFirebaseConfigured) {
    try {
      const ideaRef = doc(db, 'event_requests', ideaId);
      
      // If currentlyUpvoted was not explicitly provided, check the document
      if (hasUpvoted === undefined) {
        const snap = await getDoc(ideaRef);
        if (snap.exists()) {
          const upvoters: string[] = snap.data().upvotedBy || [];
          hasUpvoted = upvoters.includes(userId);
        }
      }

      if (hasUpvoted) {
        // Undo upvote
        await updateDoc(ideaRef, {
          upvotesCount: increment(-1),
          upvotedBy: arrayRemove(userId)
        });
        return { success: true, hasUpvoted: false };
      } else {
        // Add upvote
        await updateDoc(ideaRef, {
          upvotesCount: increment(1),
          upvotedBy: arrayUnion(userId)
        });
        return { success: true, hasUpvoted: true };
      }
    } catch (e) {
      console.warn('Firestore upvote failed, using local storage fallback', e);
    }
  }

  // Local fallback
  const ideas = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS);
  let updatedUpvoted = false;
  let updatedCount = 0;

  const updated = ideas.map(i => {
    if (i.id === ideaId) {
      const alreadyUpvoted = i.upvotedBy ? i.upvotedBy.includes(userId) : false;
      const newUpvotedBy = alreadyUpvoted 
        ? i.upvotedBy.filter(id => id !== userId)
        : [...(i.upvotedBy || []), userId];
      updatedUpvoted = !alreadyUpvoted;
      updatedCount = Math.max(0, newUpvotedBy.length);
      return {
        ...i,
        upvotedBy: newUpvotedBy,
        upvotesCount: updatedCount
      };
    }
    return i;
  });

  setLocalData(LOCAL_STORAGE_IDEAS, updated);
  window.dispatchEvent(new Event('storage'));
  return { success: true, hasUpvoted: updatedUpvoted, newCount: updatedCount };
};

export const updateIdeaStatusService = async (ideaId: string, status: 'approved' | 'rejected'): Promise<void> => {
  if (isFirebaseConfigured) {
    try {
      // Permanently remove from event_requests in Firestore or update status
      await deleteDoc(doc(db, 'event_requests', ideaId));
    } catch (e) {
      try {
        await updateDoc(doc(db, 'event_requests', ideaId), { status });
      } catch (err) {
        console.warn('Firestore update idea status failed', err);
      }
    }
  }

  // Remove completely from local cache so it never reappears in Moderation Panel or Idea Hub
  const ideas = getLocalData<IdeaHubRequest[]>(LOCAL_STORAGE_IDEAS, INITIAL_IDEAS);
  const updated = ideas.filter(i => i.id !== ideaId);
  setLocalData(LOCAL_STORAGE_IDEAS, updated);
  window.dispatchEvent(new Event('storage'));
};

// ----------------------------------------------------
// OPPORTUNITIES SERVICE
// ----------------------------------------------------
export const subscribeOpportunitiesService = (callback: (opps: Opportunity[]) => void) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const opps: Opportunity[] = [];
      snapshot.forEach((docSnap) => {
        opps.push({ id: docSnap.id, ...docSnap.data() } as Opportunity);
      });
      callback(opps);
    }, (err) => {
      console.warn('Opportunities realtime error', err);
      callback(getLocalData<Opportunity[]>(LOCAL_STORAGE_OPPS, INITIAL_OPPORTUNITIES));
    });
  } else {
    callback(getLocalData<Opportunity[]>(LOCAL_STORAGE_OPPS, INITIAL_OPPORTUNITIES));
    const handleStorageChange = () => callback(getLocalData<Opportunity[]>(LOCAL_STORAGE_OPPS, INITIAL_OPPORTUNITIES));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const createOpportunityService = async (oppData: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> => {
  const newOpp: Opportunity = {
    ...oppData,
    id: `opp-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'opportunities'), newOpp);
      return { ...newOpp, id: docRef.id };
    } catch (e) {
      console.warn('Firestore opp creation failed', e);
    }
  }

  const opps = getLocalData<Opportunity[]>(LOCAL_STORAGE_OPPS, INITIAL_OPPORTUNITIES);
  const updated = [newOpp, ...opps];
  setLocalData(LOCAL_STORAGE_OPPS, updated);
  window.dispatchEvent(new Event('storage'));
  return newOpp;
};

export const deleteOpportunityService = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'opportunities', id));
      return;
    } catch (e) {
      console.warn('Firestore opp deletion failed', e);
    }
  }

  const opps = getLocalData<Opportunity[]>(LOCAL_STORAGE_OPPS, INITIAL_OPPORTUNITIES);
  const updated = opps.filter(o => o.id !== id);
  setLocalData(LOCAL_STORAGE_OPPS, updated);
  window.dispatchEvent(new Event('storage'));
};

// ----------------------------------------------------
// EVENT REGISTRATIONS SERVICE
// ----------------------------------------------------
export const registerForEventService = async (
  registration: Omit<EventRegistration, 'id' | 'createdAt' | 'checkedIn'>
): Promise<EventRegistration> => {
  const regId = `SDC-REG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newReg: EventRegistration = {
    ...registration,
    id: regId,
    checkedIn: false,
    createdAt: new Date().toISOString()
  };

  let savedReg = newReg;

  if (isFirebaseConfigured) {
    try {
      // Strip undefined values to avoid Firestore rejection
      const cleanData = cleanObjectForFirestore(newReg);
      // Use setDoc so document ID in Firestore is GUARANTEED to match regId
      const regDocRef = doc(db, 'event_registrations', regId);
      await setDoc(regDocRef, cleanData);
      savedReg = newReg;

      try {
        const eventRef = doc(db, 'events', registration.eventId);
        const evSnap = await getDoc(eventRef);
        if (evSnap.exists()) {
          await updateDoc(eventRef, { registered_count: increment(1) });
        }
      } catch (errCount) {
        console.warn('Could not increment event registered_count in Firestore:', errCount);
      }
    } catch (e) {
      console.warn('Firestore registration failed, fallback to local storage cache', e);
    }
  }

  // Always update local cache for instant UI reactivity across components and tabs
  const regs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
  const updated = [savedReg, ...regs.filter(r => r.id !== savedReg.id && r.eventId !== savedReg.eventId)];
  setLocalData(LOCAL_STORAGE_REGS, updated);

  // Update local event registered_count
  const events = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
  const updatedEvents = events.map(e => e.id === registration.eventId ? { ...e, registered_count: (e.registered_count || 0) + 1 } : e);
  setLocalData(LOCAL_STORAGE_EVENTS, updatedEvents);

  window.dispatchEvent(new Event('storage'));
  return savedReg;
};

export const getUserRegistrationsService = (userId: string, callback: (regs: EventRegistration[]) => void) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'event_registrations'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const regs: EventRegistration[] = [];
      snapshot.forEach((docSnap) => {
        regs.push({ id: docSnap.id, ...docSnap.data() } as EventRegistration);
      });

      // Merge with any local registrations so offline or immediate creations are immediately reactive
      const localRegs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS)
        .filter(r => r.userId === userId);
      const combined = [...regs];
      localRegs.forEach(lr => {
        if (!combined.some(c => c.id === lr.id || c.eventId === lr.eventId)) {
          combined.push(lr);
        }
      });
      callback(combined);
    }, (err) => {
      console.warn('User regs listener error', err);
      const allRegs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
      callback(allRegs.filter(r => r.userId === userId));
    });
  } else {
    const allRegs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
    callback(allRegs.filter(r => r.userId === userId || r.userEmail === userId));
    const handleStorageChange = () => {
      const current = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
      callback(current.filter(r => r.userId === userId || r.userEmail === userId));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const getAllRegistrationsService = async (): Promise<EventRegistration[]> => {
  if (isFirebaseConfigured) {
    try {
      const snapshot = await getDocs(collection(db, 'event_registrations'));
      const regs: EventRegistration[] = [];
      snapshot.forEach(docSnap => regs.push({ id: docSnap.id, ...docSnap.data() } as EventRegistration));
      return regs;
    } catch (e) {
      console.warn('Fetch all registrations failed', e);
    }
  }
  return getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
};

export const subscribeAllRegistrationsService = (callback: (regs: EventRegistration[]) => void) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'event_registrations'));
    return onSnapshot(q, (snapshot) => {
      const regs: EventRegistration[] = [];
      snapshot.forEach(docSnap => regs.push({ id: docSnap.id, ...docSnap.data() } as EventRegistration));
      callback(regs);
    }, (err) => {
      console.warn('Realtime all registrations listener error', err);
      callback(getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS));
    });
  } else {
    callback(getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS));
    const handleStorageChange = () => callback(getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const checkInAttendeeByQRService = async (
  qrTokenOrId: string
): Promise<{ success: boolean; registration?: EventRegistration; message: string; alreadyCheckedIn?: boolean }> => {
  if (!qrTokenOrId || !qrTokenOrId.trim()) {
    return { success: false, message: 'Empty QR code scanned.' };
  }

  // Normalize raw token: handle JSON, URLs, prefixes, quotes, and whitespace
  let raw = qrTokenOrId.trim();
  let cleanToken = raw;

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      cleanToken = parsed.id || parsed.ticketId || parsed.qrToken || parsed.teamCode || cleanToken;
    } catch (e) {}
  }

  if (cleanToken.includes('?id=')) {
    const parts = cleanToken.split('?id=');
    if (parts[1]) cleanToken = parts[1].split('&')[0];
  } else if (cleanToken.includes('id=')) {
    const parts = cleanToken.split('id=');
    if (parts[1]) cleanToken = parts[1].split('&')[0];
  }

  cleanToken = cleanToken
    .replace(/^(SDC_TICKET:|TICKET:|PASS:|QR:|TOKEN:)/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  let targetReg: EventRegistration | undefined;

  // 1. Try Firestore lookup directly first across all possible matching fields
  if (isFirebaseConfigured) {
    try {
      // A. Direct doc ID lookup
      const docSnap = await getDoc(doc(db, 'event_registrations', cleanToken));
      if (docSnap.exists()) {
        targetReg = { id: docSnap.id, ...docSnap.data() } as EventRegistration;
      }

      // B. Direct doc ID lookup with raw token
      if (!targetReg && raw !== cleanToken) {
        const docSnapRaw = await getDoc(doc(db, 'event_registrations', raw));
        if (docSnapRaw.exists()) {
          targetReg = { id: docSnapRaw.id, ...docSnapRaw.data() } as EventRegistration;
        }
      }

      // C. Query by 'id' field in document
      if (!targetReg) {
        const qId = query(collection(db, 'event_registrations'), where('id', '==', cleanToken));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          const d = snapId.docs[0];
          targetReg = { id: d.id, ...d.data() } as EventRegistration;
        }
      }

      // D. Query by teamCode
      if (!targetReg) {
        const qCode = query(collection(db, 'event_registrations'), where('teamCode', '==', cleanToken.toUpperCase()));
        const snapCode = await getDocs(qCode);
        if (!snapCode.empty) {
          const d = snapCode.docs[0];
          targetReg = { id: d.id, ...d.data() } as EventRegistration;
        }
      }

      // E. Query by rollNumber
      if (!targetReg) {
        const qRoll = query(collection(db, 'event_registrations'), where('rollNumber', '==', cleanToken.toUpperCase()));
        const snapRoll = await getDocs(qRoll);
        if (!snapRoll.empty) {
          const d = snapRoll.docs[0];
          targetReg = { id: d.id, ...d.data() } as EventRegistration;
        }
      }

      // F. Query by userId
      if (!targetReg) {
        const qUser = query(collection(db, 'event_registrations'), where('userId', '==', cleanToken));
        const snapUser = await getDocs(qUser);
        if (!snapUser.empty) {
          const d = snapUser.docs[0];
          targetReg = { id: d.id, ...d.data() } as EventRegistration;
        }
      }

      // G. Query by userEmail
      if (!targetReg) {
        const qEmail = query(collection(db, 'event_registrations'), where('userEmail', '==', cleanToken.toLowerCase()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const d = snapEmail.docs[0];
          targetReg = { id: d.id, ...d.data() } as EventRegistration;
        }
      }

      // H. Deep fallback: scan all documents in collection
      if (!targetReg) {
        const allSnap = await getDocs(collection(db, 'event_registrations'));
        const searchLower = cleanToken.toLowerCase();
        allSnap.forEach(d => {
          if (targetReg) return;
          const data = d.data() as EventRegistration;
          if (
            d.id.toLowerCase() === searchLower ||
            (data.id && data.id.toLowerCase() === searchLower) ||
            (data.teamCode && data.teamCode.toLowerCase() === searchLower) ||
            (data.rollNumber && data.rollNumber.toLowerCase() === searchLower) ||
            (data.userId && data.userId.toLowerCase() === searchLower) ||
            (data.userEmail && data.userEmail.toLowerCase() === searchLower) ||
            (cleanToken.length >= 6 && (d.id.includes(cleanToken) || (data.id && data.id.includes(cleanToken))))
          ) {
            targetReg = { ...data, id: d.id };
          }
        });
      }
    } catch (e) {
      console.warn('Firestore lookup in check-in service failed', e);
    }
  }

  // 2. Fall back to local storage cache
  if (!targetReg) {
    const regs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
    const searchLower = cleanToken.toLowerCase();
    targetReg = regs.find(r => 
      r.id.toLowerCase() === searchLower || 
      r.userId.toLowerCase() === searchLower || 
      r.teamCode?.toLowerCase() === searchLower ||
      r.rollNumber?.toLowerCase() === searchLower ||
      r.userEmail?.toLowerCase() === searchLower ||
      (cleanToken.length >= 6 && r.id.includes(cleanToken))
    );
  }

  if (!targetReg) {
    return { success: false, message: `Registration ticket not found for: "${cleanToken}"` };
  }

  // Enforce single check-in rule: Each QR can only be scanned once!
  if (targetReg.checkedIn) {
    const timeStr = targetReg.checkedInAt 
      ? new Date(targetReg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
      : 'earlier session';
    return { 
      success: false, 
      alreadyCheckedIn: true,
      registration: targetReg, 
      message: `⚠️ Already Checked In! Previously scanned at ${timeStr}. Each ticket can only be checked in once!` 
    };
  }

  const checkInTime = new Date().toISOString();
  const updatedReg: EventRegistration = {
    ...targetReg,
    checkedIn: true,
    checkedInAt: checkInTime
  };

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'event_registrations', targetReg.id), {
        checkedIn: true,
        checkedInAt: checkInTime
      });
      const eventRef = doc(db, 'events', targetReg.eventId);
      await updateDoc(eventRef, { attendance_count: increment(1) });
    } catch (e) {
      console.warn('Firestore check-in update failed', e);
    }
  }

  // Update local storage
  const regs = getLocalData<EventRegistration[]>(LOCAL_STORAGE_REGS, MOCK_USER_REGISTRATIONS);
  const updatedRegs = [updatedReg, ...regs.filter(r => r.id !== targetReg!.id)];
  setLocalData(LOCAL_STORAGE_REGS, updatedRegs);

  // Update event attendance count locally
  const events = getLocalData<EventItem[]>(LOCAL_STORAGE_EVENTS, INITIAL_EVENTS);
  const updatedEvents = events.map(e => e.id === targetReg!.eventId ? { ...e, attendance_count: (e.attendance_count || 0) + 1 } : e);
  setLocalData(LOCAL_STORAGE_EVENTS, updatedEvents);

  window.dispatchEvent(new Event('storage'));

  return {
    success: true,
    registration: updatedReg,
    message: `✓ Attendance Verified! ${targetReg.userName} is marked PRESENT.`
  };
};

export const getSystemAnnouncements = (): SystemAnnouncement[] => {
  return INITIAL_ANNOUNCEMENTS;
};

// ----------------------------------------------------
// CLUB SETTINGS SERVICE (Control Landing Page Features)
// ----------------------------------------------------
const LOCAL_STORAGE_SETTINGS = 'sdc_club_settings_v1';
const DEFAULT_SETTINGS: ClubSettings = {
  showHackathonMatrix: false // Hidden by default as requested by user
};

export const getClubSettingsService = async (): Promise<ClubSettings> => {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'club_settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ClubSettings;
        setLocalData(LOCAL_STORAGE_SETTINGS, data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore fetch club settings error', e);
    }
  }
  return getLocalData<ClubSettings>(LOCAL_STORAGE_SETTINGS, DEFAULT_SETTINGS);
};

export const updateClubSettingsService = async (newSettings: Partial<ClubSettings>): Promise<ClubSettings> => {
  const current = await getClubSettingsService();
  const merged: ClubSettings = { ...current, ...newSettings };

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'club_settings', 'global');
      await updateDoc(docRef, cleanObjectForFirestore(merged));
    } catch (e) {
      try {
        const { setDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'club_settings', 'global');
        await setDoc(docRef, cleanObjectForFirestore(merged));
      } catch (err) {
        console.warn('Firestore update club settings failed', err);
      }
    }
  }

  setLocalData(LOCAL_STORAGE_SETTINGS, merged);
  window.dispatchEvent(new Event('storage'));
  return merged;
};

export const subscribeClubSettingsService = (callback: (settings: ClubSettings) => void) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'club_settings', 'global');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ClubSettings;
        setLocalData(LOCAL_STORAGE_SETTINGS, data);
        callback(data);
      } else {
        callback(DEFAULT_SETTINGS);
      }
    }, (err) => {
      console.warn('Settings subscription error', err);
      callback(getLocalData<ClubSettings>(LOCAL_STORAGE_SETTINGS, DEFAULT_SETTINGS));
    });
  } else {
    callback(getLocalData<ClubSettings>(LOCAL_STORAGE_SETTINGS, DEFAULT_SETTINGS));
    const handleStorage = () => callback(getLocalData<ClubSettings>(LOCAL_STORAGE_SETTINGS, DEFAULT_SETTINGS));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }
};

