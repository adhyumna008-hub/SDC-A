import { EventItem, IdeaHubRequest, Opportunity, SystemAnnouncement, EventRegistration } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-101',
    title: 'Winter Web3 & DeFi Hackathon',
    description: 'Build the next generation of decentralized applications. 48 hours to create, deploy smart contracts, and pitch to industry sponsors.',
    category: 'hackathon',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    date: 'Nov 15 - 17, 2026',
    location: 'Lab 304 & Discord',
    registration_start_time: '2026-08-01T00:00:00.000Z',
    registration_end_time: '2026-11-14T23:59:59.000Z',
    is_inter_college: true,
    min_team_size: 1,
    max_team_size: 4,
    max_seats: 150,
    registered_count: 120,
    attendance_count: 0,
    createdAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'evt-102',
    title: 'Mastering WebGL Shaders & 3D Web',
    description: 'Learn the fundamentals of GLSL shaders, Three.js canvas renders, and stunning interactive visual effects directly in modern browsers.',
    category: 'workshop',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    date: 'Oct 25, 2026 • 6:00 PM',
    location: 'Auditorium A',
    registration_start_time: '2026-08-01T00:00:00.000Z',
    registration_end_time: '2026-10-24T18:00:00.000Z',
    is_inter_college: false,
    min_team_size: 1,
    max_team_size: 1,
    max_seats: 60,
    registered_count: 42,
    attendance_count: 0,
    createdAt: '2026-08-12T10:00:00.000Z'
  },
  {
    id: 'evt-103',
    title: 'AI Ethics & Guardrails in Production',
    description: 'Guest lecture discussing architectural patterns for implementing safety alignment, prompt guardrails, and deterministic fallbacks in LLMs.',
    category: 'speaker',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    date: 'Nov 22, 2026 • 5:00 PM',
    location: 'Seminar Hall 2',
    registration_start_time: '2026-08-01T00:00:00.000Z',
    registration_end_time: '2026-11-21T23:59:59.000Z',
    is_inter_college: true,
    min_team_size: 1,
    max_team_size: 1,
    max_seats: 100,
    registered_count: 94,
    attendance_count: 0,
    createdAt: '2026-08-14T10:00:00.000Z'
  },
  {
    id: 'evt-201',
    title: 'Fall Build-a-thon 2025',
    description: 'Over 200 student developers built 45 unique open-source projects addressing campus sustainability and automation.',
    category: 'hackathon',
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    date: 'October 12, 2025',
    location: 'Main Campus Center',
    registration_start_time: '2025-09-01T00:00:00.000Z',
    registration_end_time: '2025-10-10T00:00:00.000Z',
    is_inter_college: true,
    min_team_size: 2,
    max_team_size: 4,
    max_seats: 200,
    registered_count: 200,
    attendance_count: 186,
    winners: [
      { position: '1st Place', teamOrName: 'EcoTrack AI', members: 'Rahul Sharma, Priya Nair, Aryan Patel', projectTitle: 'Smart Waste Sorting Vision', prize: '₹25,000 + Credits' },
      { position: '2nd Place', teamOrName: 'CampusPulse', members: 'Vikram Reddy, Sneha Kulkarni', projectTitle: 'Realtime Bus Tracking', prize: '₹15,000' },
      { position: '3rd Place', teamOrName: 'PeerCode', members: 'Divya Teja, Harish Chandra, Nikhil Raj', projectTitle: 'Collaborative IDE for Labs', prize: '₹10,000' }
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
    ],
    createdAt: '2025-09-01T10:00:00.000Z'
  },
  {
    id: 'evt-202',
    title: 'Modern Full-Stack BootCamp (React + Node)',
    description: 'A 2-day hands-on workshop guiding students through REST API design, authentication, state management, and Cloud Deployment.',
    category: 'workshop',
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    date: 'August 18, 2025',
    location: 'Computer Lab 4',
    registration_start_time: '2025-07-15T00:00:00.000Z',
    registration_end_time: '2025-08-16T00:00:00.000Z',
    is_inter_college: false,
    min_team_size: 1,
    max_team_size: 1,
    max_seats: 80,
    registered_count: 80,
    attendance_count: 76,
    galleryImages: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80'
    ],
    createdAt: '2025-07-15T10:00:00.000Z'
  }
];

export const INITIAL_IDEAS: IdeaHubRequest[] = [
  {
    id: 'idea-01',
    title: 'Intro to Rust Systems Programming & Memory Safety',
    description: 'A hands-on coding session building a high-performance CLI tool in Rust, focusing on ownership and zero-cost abstractions.',
    category: 'workshop',
    authorId: 'usr-member-1',
    authorEmail: 'alex.dev@vardhaman.org',
    authorName: 'Alex Rivers',
    upvotesCount: 142,
    upvotedBy: ['usr-member-1', 'usr-member-2'],
    status: 'pending',
    createdAt: '2026-08-20T14:30:00.000Z'
  },
  {
    id: 'idea-02',
    title: 'UI/UX Engineering: Bridging Figma Design Systems to React',
    description: 'Interactive session exploring design tokens, Tailwind design systems, accessible components, and micro-interactions.',
    category: 'workshop',
    authorId: 'usr-member-2',
    authorEmail: 'sarah.ui@vardhaman.org',
    authorName: 'Sarah Chen',
    upvotesCount: 89,
    upvotedBy: ['usr-member-2'],
    status: 'pending',
    createdAt: '2026-08-22T11:15:00.000Z'
  },
  {
    id: 'idea-03',
    title: 'Building Autonomous AI Agents with LangChain & Python',
    description: 'Learn how to construct multi-agent networks, tool-calling bots, and local LLM integrations using Ollama.',
    category: 'hackathon',
    authorId: 'usr-member-3',
    authorEmail: 'rahul.ai@vardhaman.org',
    authorName: 'Rahul Varma',
    upvotesCount: 215,
    upvotedBy: ['usr-member-3'],
    status: 'pending',
    createdAt: '2026-08-18T09:00:00.000Z'
  }
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-01',
    title: 'Global Hack Week: APIs & Cloud Infrastructure',
    organization: 'Major League Hacking (MLH)',
    category: 'hackathon',
    tags: ['#Hackathon', '#Remote', '#APIs', '#Swag'],
    description: 'Join thousands of developers for a week-long celebration of building, learning, and sharing. Integrate world-class APIs to win prizes.',
    externalUrl: 'https://mlh.io',
    deadline: '2026-10-22T23:59:59.000Z',
    location: 'Virtual / Remote',
    stipendOrPrize: '$10,000 Pool',
    createdAt: '2026-08-25T10:00:00.000Z'
  },
  {
    id: 'opp-02',
    title: 'Frontend Systems Engineering Intern',
    organization: 'Vercel',
    category: 'internship',
    tags: ['#Internship', '#Remote', '#React', '#NextJS'],
    description: 'Work on foundational web infrastructure powering millions of sites. Strong TypeScript & performance optimization skills preferred.',
    externalUrl: 'https://vercel.com/careers',
    deadline: '2026-09-30T23:59:59.000Z',
    location: 'Remote (Global)',
    stipendOrPrize: '$45 / hr',
    createdAt: '2026-08-26T10:00:00.000Z'
  },
  {
    id: 'opp-03',
    title: 'Linux Kernel Mentorship Program Spring 2027',
    organization: 'The Linux Foundation',
    category: 'opensource',
    tags: ['#OpenSource', '#C', '#Kernel', '#Stipend'],
    description: 'A structured 12-week mentorship program bringing new contributors into the Linux kernel ecosystem under guidance from senior kernel maintainers.',
    externalUrl: 'https://lfx.linuxfoundation.org/mentorship',
    deadline: '2026-11-01T23:59:59.000Z',
    location: 'Remote',
    stipendOrPrize: '$3,000 Stipend',
    createdAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'opp-04',
    title: 'Web3 Builder Grant Challenge 2026',
    organization: 'Ethereum Foundation',
    category: 'hiring',
    tags: ['#Web3', '#Grants', '#Solidity', '#Remote'],
    description: 'Open call for student teams creating privacy-preserving zero-knowledge tooling, Layer 2 scaling prototypes, or decentralized storage utilities.',
    externalUrl: 'https://ethereum.org/en/grants/',
    deadline: '2026-12-15T23:59:59.000Z',
    location: 'Global Remote',
    stipendOrPrize: '$50,000 Grant',
    createdAt: '2026-08-21T10:00:00.000Z'
  }
];

export const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  { id: 'ann-1', title: '🚀 Winter Web3 Hackathon registrations are now LIVE! Max team size: 4 members.', type: 'urgent', active: true },
  { id: 'ann-2', title: '💡 Upvote your favorite workshop proposals in the Idea Hub to get them scheduled!', type: 'info', active: true },
  { id: 'ann-3', title: '🎉 Fall Build-a-thon certificates and winner highlights are available under Past Events.', type: 'success', active: true }
];

export const MOCK_USER_REGISTRATIONS: EventRegistration[] = [
  {
    id: 'reg-901',
    eventId: 'evt-101',
    eventTitle: 'Winter Web3 & DeFi Hackathon',
    userId: 'usr-member-1',
    userEmail: 'alex.dev@vardhaman.org',
    userName: 'Alex Rivers',
    collegeName: 'Vardhaman College of Engineering',
    rollNumber: '21881A0501',
    registrationType: 'team',
    teamCode: 'SDC892',
    teamName: 'CyberNova',
    teamMembers: [
      { name: 'Alex Rivers', email: 'alex.dev@vardhaman.org', rollNumber: '21881A0501' },
      { name: 'Sarah Chen', email: 'sarah.ui@vardhaman.org', rollNumber: '21881A0502' }
    ],
    status: 'confirmed',
    checkedIn: false,
    createdAt: '2026-08-28T12:00:00.000Z'
  },
  {
    id: 'reg-902',
    eventId: 'evt-201',
    eventTitle: 'Fall Build-a-thon 2025',
    userId: 'usr-member-1',
    userEmail: 'alex.dev@vardhaman.org',
    userName: 'Alex Rivers',
    collegeName: 'Vardhaman College of Engineering',
    rollNumber: '21881A0501',
    registrationType: 'team',
    teamCode: 'ECO101',
    teamName: 'EcoTrack AI',
    teamMembers: [
      { name: 'Alex Rivers', email: 'alex.dev@vardhaman.org', rollNumber: '21881A0501' }
    ],
    status: 'confirmed',
    checkedIn: true,
    checkedInAt: '2025-10-12T09:15:00.000Z',
    createdAt: '2025-09-10T10:00:00.000Z'
  }
];
