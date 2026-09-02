export type UserRole = 'admin' | 'member' | 'guest';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  collegeName?: string;
  rollNumber?: string;
  phoneNumber?: string;
  qrToken: string;
  emailVerified?: boolean;
  createdAt?: any;
}

export interface EventWinner {
  position: '1st Place' | '2nd Place' | '3rd Place' | 'Runner Up' | 'Honorable Mention';
  teamOrName: string;
  members?: string;
  projectTitle?: string;
  prize?: string;
  avatar?: string;
}

export type EventCategory = 'workshop' | 'hackathon' | 'speaker' | 'contest';
export type EventStatus = 'draft' | 'open' | 'closed' | 'completed';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  image: string;
  date: string; // Display date string e.g. "Nov 15-17, 2024"
  location: string;
  registration_start_time: string; // ISO String
  registration_end_time: string;   // ISO String
  is_inter_college: boolean;
  min_team_size: number;
  max_team_size: number;
  max_seats: number;
  registered_count: number;
  attendance_count?: number;
  winners?: EventWinner[];
  galleryImages?: string[];
  hostingType?: 'in-house' | 'external';
  externalRegistrationUrl?: string;
  organizerName?: string;
  createdAt?: any;
}

export interface ClubSettings {
  showHackathonMatrix: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  phoneNumber?: string;
  collegeName: string;
  rollNumber: string;
  registrationType: 'solo' | 'team';
  teamCode?: string;
  teamName?: string;
  teamMembers?: { name: string; email: string; rollNumber: string }[];
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
}

export interface IdeaHubRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  upvotesCount: number;
  upvotedBy: string[]; // uids
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: 'hackathon' | 'internship' | 'opensource' | 'hiring';
  tags: string[];
  description: string;
  externalUrl: string;
  deadline: string; // ISO date string
  location?: string;
  stipendOrPrize?: string;
  createdAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  type: 'urgent' | 'info' | 'success';
  active: boolean;
}
