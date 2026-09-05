import { EventItem, IdeaHubRequest, Opportunity, SystemAnnouncement, EventRegistration } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-ai-civil-2026',
    title: 'AI in Civil Engineering',
    description: 'Harnessing AI to design, build & transform the future. Interactive workshop covering AI for Structural Analysis & Design, Smart Construction & Automation, Data-Driven Decision Making, and Sustainable & Resilient Infrastructure. Organized by Student Developers Club (SDC), Vardhaman College of Engineering. Contacts: Mani (+91 91216 48949) | Adhyumna (+91 93478 90012).',
    category: 'workshop',
    status: 'open',
    image: '/events/ai-in-civil-engineering.jpg',
    date: 'September 17, 2026',
    location: 'Vardhaman College of Engineering',
    registration_start_time: '2026-08-01T00:00:00.000Z',
    registration_end_time: '2026-09-17T09:00:00.000Z',
    is_inter_college: true,
    min_team_size: 1,
    max_team_size: 1,
    max_seats: 150,
    registered_count: 0,
    attendance_count: 0,
    createdAt: '2026-08-29T05:08:25.553Z'
  },
  {
    id: 'evt-github-workshop-2025',
    title: 'Git & GitHub Hands-on Workshop',
    description: 'Conducted by previous SDC leads to equip students with core version control fundamentals: repository management, branching workflows, pull requests, resolving merge conflicts, and contributing to open source.',
    category: 'workshop',
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    date: 'September 2025',
    location: 'VCE Campus',
    registration_start_time: '2025-08-01T00:00:00.000Z',
    registration_end_time: '2025-09-15T00:00:00.000Z',
    is_inter_college: true,
    min_team_size: 1,
    max_team_size: 1,
    max_seats: 120,
    registered_count: 120,
    attendance_count: 110,
    createdAt: '2025-08-01T10:00:00.000Z'
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
  { id: 'ann-1', title: '🚀 Registrations are now LIVE for "AI in Civil Engineering Workshop" on September 17th!', type: 'urgent', active: true },
  { id: 'ann-2', title: '💡 Upvote and propose community workshops in the Idea Hub!', type: 'info', active: true }
];

export const MOCK_USER_REGISTRATIONS: EventRegistration[] = [];
