/**
 * DevArena — Database Seeder (Rich Data Edition)
 * Run: node backend/utils/seeder.js
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User            = require('../models/User');
const Event           = require('../models/Event');
const Team            = require('../models/Team');
const { BadgeDefinition, Certificate } = require('../models/Supplementary');

/* ══════════════════════════════════════════════════════════════
   BADGE DEFINITIONS
══════════════════════════════════════════════════════════════ */
const BADGE_DEFINITIONS = [
  // Participation
  { name: 'Welcome to DevArena',   description: 'Created your account',              icon: 'star', category: 'participation', criteria: 'Register on platform',   pointsReward: 50  },
  { name: 'Verified Dev',          description: 'Verified your email address',       icon: 'shield-check', category: 'participation', criteria: 'Verify email',            pointsReward: 25  },
  { name: 'First Step',            description: 'Registered for your first event',   icon: 'footprints', category: 'participation', criteria: 'Register for 1 event',    eventsRequired: 1,  pointsReward: 20  },
  { name: 'Event Explorer',        description: 'Participated in 5 events',          icon: 'calendar', category: 'achievement',   criteria: 'Join 5 events',           eventsRequired: 5,  pointsReward: 100 },
  { name: 'Hackathon Enthusiast',  description: 'Participated in 10 events',         icon: 'zap', category: 'achievement',   criteria: 'Join 10 events',          eventsRequired: 10, pointsReward: 250 },
  { name: 'Marathon Hacker',       description: 'Participated in 25 events',         icon: 'trophy', category: 'achievement',   criteria: 'Join 25 events',          eventsRequired: 25, pointsReward: 600 },

  // Contribution
  { name: 'Event Organizer',       description: 'Created your first event',          icon: 'layout', category: 'contribution', criteria: 'Create 1 event',           pointsReward: 100 },
  { name: 'Community Builder',     description: 'Created 5 events',                  icon: 'users', category: 'contribution', criteria: 'Create 5 events',          pointsReward: 300 },
  { name: 'Team Player',           description: 'Created or joined a team',          icon: 'users', category: 'participation', criteria: 'Create/join a team',       pointsReward: 30  },
  { name: 'Open Source Hero',      description: 'Contributed to open source sprint', icon: 'git-branch', category: 'contribution', criteria: 'Participate in open-source event', pointsReward: 80 },
  { name: 'Mentor',                description: 'Mentored at least one team',        icon: 'book-open', category: 'contribution', criteria: 'Mentor a team',            pointsReward: 200 },

  // Milestones
  { name: 'Rising Star',           description: 'Earned 500 points',                 icon: 'trending-up', category: 'achievement',    criteria: 'Earn 500 points',          pointsRequired: 500,  pointsReward: 0  },
  { name: 'Dev Champion',          description: 'Earned 1 000 points',               icon: 'award', category: 'achievement',    criteria: 'Earn 1000 points',         pointsRequired: 1000, pointsReward: 0  },
  { name: 'Elite Developer',       description: 'Earned 5 000 points',               icon: 'cpu', category: 'achievement',    criteria: 'Earn 5000 points',         pointsRequired: 5000, pointsReward: 0  },
  { name: 'Legend',                description: 'Earned 10 000 points',              icon: 'diamond', category: 'achievement',    criteria: 'Earn 10000 points',        pointsRequired: 10000, pointsReward: 0 },

  // Special
  { name: 'Certificate Collector', description: 'Earned 3 certificates',             icon: 'file-text', category: 'achievement',  criteria: 'Earn 3 certificates',      pointsReward: 150 },
  { name: 'Networking Pro',        description: 'Attended 3 networking events',      icon: 'globe', category: 'achievement',  criteria: 'Attend 3 meetups',         pointsReward: 75  },
  { name: 'Hackathon Winner',      description: 'Won a hackathon prize',             icon: 'trophy', category: 'special',      criteria: 'Win a hackathon',          pointsReward: 500 },
  { name: 'Streak Master',         description: 'Logged in 30 days in a row',        icon: 'flame', category: 'special',      criteria: '30-day login streak',      pointsReward: 200 },
];

/* ══════════════════════════════════════════════════════════════
   BANNER IMAGE URLS
   (Unsplash photos — free to use, no key required)
══════════════════════════════════════════════════════════════ */
const BANNERS = {
  hackathon1:   'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
  hackathon2:   'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  hackathon3:   'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80',
  workshop1:    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  workshop2:    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
  workshop3:    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
  conference1:  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  conference2:  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
  conference3:  'https://images.unsplash.com/photo-1560439514-4e9645039924?w=1200&q=80',
  meetup1:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80',
  meetup2:      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
  bootcamp1:    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=1200&q=80',
  bootcamp2:    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
  opensource1:  'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&q=80',
  ai1:          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
  ai2:          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80',
  webinar1:     'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80',
  competition1: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80',
  competition2: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&q=80',
  seminar1:     'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
  cultural1:    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  startup1:     'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
  cloud1:       'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
  security1:    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80',
  mobile1:      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
  blockchain1:  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
  ux1:          'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1200&q=80',
  devops1:      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&q=80',
  gaming1:      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80',

  data1:        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  data2:        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&q=80',
  mlops1:       'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
  robotics1:    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80',
  iot1:         'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  ar1:          'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1200&q=80',
  career1:      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
  fintech1:     'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80',
  health1:      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  env1:         'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  space1:       'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
  hiring1:      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
  panel1:       'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
  coding1:      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
  sprint1:      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
};

/* ══════════════════════════════════════════════════════════════
   SAMPLE EVENTS  (25 events, rich variety)
══════════════════════════════════════════════════════════════ */
const SAMPLE_EVENTS = [
  /* ── 1. National Hackathon ─────────────────────────── */
  {
    title: 'HackIndia 2025 — National Finals',
    description: `India's largest national hackathon is back! Over 48 hours, teams of 2–4 will build innovative solutions across tracks: AI/ML, FinTech, HealthTech, Sustainability, and Web3.\n\nTop teams win mentorship from Google, Microsoft & Razorpay engineers, cloud credits, and a ₹10 Lakh prize pool. Judges include CTOs of top Indian unicorns.\n\nAll submissions must be original, built during the event. APIs from our sponsors are mandatory to use in at least one track.`,
    shortDescription: `India's biggest hackathon with ₹10L prize pool across 5 tracks. 48h, team event.`,
    banner: BANNERS.hackathon1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['ai', 'web3', 'fintech', 'healthtech', 'sustainability'],
    skills: ['React', 'Node.js', 'Python', 'Solidity', 'TensorFlow', 'FastAPI'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 2000, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'IIT Delhi Campus, Auditorium Complex', city: 'New Delhi', state: 'Delhi', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 400000, description: 'Grand Prize + Internship Offer', perks: ['1-year Mentorship', 'Internship at Partner Company', 'AWS Credits $5000'] },
      { position: '2nd Place', amount: 200000, description: 'Runner Up', perks: ['Cloud Credits $2000', 'LinkedIn Feature'] },
      { position: '3rd Place', amount: 100000, description: 'Second Runner Up', perks: ['Swag Kits'] },
      { position: 'Track Winner (×5)', amount: 50000, description: 'Best in each track', perks: ['Sponsor Goodies'] },
    ],
    requirements: ['Team of 2–4 members', 'Original project only', 'Must use at least one sponsor API', 'Laptop required', 'Valid college/work ID'],
    faqs: [
      { question: 'Can I participate solo?', answer: 'You need a minimum team of 2 members. Use our Team Formation feature to find partners!' },
      { question: 'What tech stack is allowed?', answer: 'Any tech stack is allowed. We have track-specific bonus points for using sponsor APIs.' },
      { question: 'Is accommodation provided?', answer: 'Yes, accommodation and meals are provided for all registered participants at IIT Delhi.' },
      { question: 'What is the judging criteria?', answer: 'Innovation (30%), Technical difficulty (25%), Business viability (20%), Presentation (15%), Use of sponsor APIs (10%).' },
    ],
    certificatesEnabled: true,
  },

  /* ── 2. React Workshop ────────────────────────────── */
  {
    title: 'React 19 Masterclass — Performance & Patterns',
    description: `A comprehensive 3-day deep dive into React 19 covering React Server Components, the new Compiler, concurrent patterns, advanced performance optimization, and production deployment strategies.\n\nLed by a senior engineer from Meta's React core team. Includes live coding sessions, hands-on labs, and a capstone project you'll take home.\n\nPerfect for developers who know React basics and want to level up to production-grade expertise.`,
    shortDescription: '3-day React 19 masterclass with Meta engineers. RSC, Compiler & production patterns.',
    banner: BANNERS.workshop1,
    category: 'workshop', mode: 'online',
    tags: ['react', 'javascript', 'frontend', 'performance', 'rsc'],
    skills: ['React', 'TypeScript', 'Next.js', 'Webpack', 'Vite'],
    isPaid: true, price: 1499, isPublished: true, isFeatured: true,
    maxParticipants: 80, isTeamEvent: false,
    requirements: ['6+ months React experience', 'Node.js 20+ installed', 'Laptop with 8GB RAM minimum', 'VS Code recommended'],
    faqs: [
      { question: 'Will recordings be available?', answer: 'Yes, all sessions are recorded and shared with participants for 6 months.' },
      { question: 'Is the certificate industry-recognized?', answer: 'Certificates include a unique QR code verifiable on our platform, accepted by partner companies.' },
    ],
    certificatesEnabled: true,
  },

  /* ── 3. Open Source Sprint ────────────────────────── */
  {
    title: 'DevArena Open Source Sprint — Season 4',
    description: `Contribute to real open-source projects over 2 weeks and build a GitHub profile that stands out. Our curated list of "good first issue" repositories spans Python, JavaScript, Rust, and Go.\n\nMentors from the maintainer teams of popular projects like FastAPI, Remix, and ShadCN will hold live office hours every day.\n\nPoints, badges, and a certificate awaits contributors who merge at least 2 PRs!`,
    shortDescription: 'Contribute to open source for 2 weeks. Merge PRs, get mentored, earn a certificate.',
    banner: BANNERS.opensource1,
    category: 'open-source', mode: 'online',
    tags: ['opensource', 'git', 'github', 'collaboration', 'python', 'javascript'],
    skills: ['Git', 'JavaScript', 'Python', 'Go', 'Rust', 'TypeScript'],
    isPaid: false, isPublished: true,
    maxParticipants: 0, isTeamEvent: false,
    certificatesEnabled: true,
    faqs: [
      { question: 'What counts as a contribution?', answer: 'Bug fixes, documentation improvements, new features, and test coverage all count.' },
      { question: `I'm a beginner, is this for me?`, answer: 'Absolutely! We have "good-first-issue" tracks specifically for beginners.' },
    ],
  },

  /* ── 4. ML Conference ─────────────────────────────── */
  {
    title: 'IndiaML Summit 2025',
    description: `India's premier machine learning conference, bringing together 300+ researchers, practitioners, and AI enthusiasts for 2 days of keynotes, workshops, and networking.\n\nFeatured speakers from Google DeepMind, Meta AI, IIT Bombay, and IISc Bangalore. Tracks include Computer Vision, NLP/LLMs, Reinforcement Learning, and Responsible AI.\n\nIncluded: 2 full-day workshops, conference dinner, and a job fair with 30+ AI-hiring companies.`,
    shortDescription: `India's premier ML/AI conference — 2 days, 30+ speakers, workshops & job fair.`,
    banner: BANNERS.ai1,
    category: 'conference', mode: 'offline',
    tags: ['machine-learning', 'ai', 'deep-learning', 'nlp', 'llm', 'generative-ai'],
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Hugging Face'],
    isPaid: true, price: 2499, isPublished: true, isFeatured: true,
    maxParticipants: 350, isTeamEvent: false,
    location: { venue: 'JW Marriott, Vittal Mallya Road', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    faqs: [
      { question: 'Are meals included?', answer: 'Yes — breakfast, lunch, and the conference dinner are included in the ticket price.' },
      { question: 'Can I attend workshops separately?', answer: 'Workshop-only tickets are available at ₹999 per day.' },
    ],
  },

  /* ── 5. Startup Pitch ─────────────────────────────── */
  {
    title: 'TechFounders Pitch Night — Mumbai',
    description: `Monthly startup pitch competition for early-stage tech founders. 10 selected startups pitch for 5 minutes to a panel of 6 investors from top Indian VC firms.\n\nAudience vote determines the "People's Choice" winner. Top 3 pitches get fast-tracked to investor follow-up meetings. Networking cocktail session follows.\n\nIdeal for founders with a working prototype or early traction.`,
    shortDescription: 'Monthly startup pitch competition. 10 startups, 6 VC judges, investor follow-ups.',
    banner: BANNERS.startup1,
    category: 'competition', mode: 'offline',
    tags: ['startup', 'pitch', 'venture-capital', 'entrepreneurship', 'networking'],
    skills: ['Business Development', 'Product Management', 'Pitching', 'Fundraising'],
    isPaid: false, isPublished: true,
    maxParticipants: 150, isTeamEvent: true, minTeamSize: 1, maxTeamSize: 3,
    location: { venue: 'WeWork BKC', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    prizes: [
      { position: 'Best Pitch', amount: 0, description: 'Fast-tracked VC meetings + ₹50K AWS credits', perks: ['Investor Introductions', 'AWS Credits', 'Incubator Access'] },
      { position: "People's Choice", amount: 0, description: 'Audience voted winner', perks: ['Feature on our blog', 'Social amplification'] },
    ],
    certificatesEnabled: false,
  },

  /* ── 6. Flutter Bootcamp ──────────────────────────── */
  {
    title: 'Flutter Zero-to-Hero Bootcamp',
    description: `An intensive 5-day bootcamp to take you from Flutter beginner to shipping a production app on the Play Store and App Store.\n\nCovering: Dart fundamentals, Flutter widgets in depth, state management (Riverpod + Bloc), Firebase integration, REST APIs, animations, and app submission.\n\nEach day includes theory, live coding, and a hands-on mini-project. By Day 5 you'll publish your own app!`,
    shortDescription: '5-day Flutter bootcamp — build & publish your own app on Play Store & App Store.',
    banner: BANNERS.mobile1,
    category: 'bootcamp', mode: 'online',
    tags: ['flutter', 'dart', 'mobile', 'android', 'ios', 'firebase'],
    skills: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'REST APIs'],
    isPaid: true, price: 1999, isPublished: true,
    maxParticipants: 60, isTeamEvent: false,
    requirements: ['Basic programming knowledge', 'Laptop with Android Studio or VS Code', 'Android phone or iOS simulator'],
    certificatesEnabled: true,
  },

  /* ── 7. Web3 Hackathon ────────────────────────────── */
  {
    title: 'DeFi BuildFest — Ethereum Track',
    description: `A 36-hour Web3 focused hackathon in partnership with Ethereum Foundation. Build DeFi protocols, NFT marketplaces, DAOs, or on-chain games on the Ethereum & Polygon networks.\n\nMentors from Uniswap, OpenSea, and Polygon Labs available throughout the event. Prizes include ETH, $MATIC, and seed funding offers from Web3 VCs.\n\nAll skill levels welcome — smart contract beginners can join our Intro to Solidity workshop on Day 0.`,
    shortDescription: '36h Web3 hackathon on Ethereum. DeFi, NFTs, DAOs. ETH prizes + seed funding offers.',
    banner: BANNERS.blockchain1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['web3', 'ethereum', 'defi', 'solidity', 'nft', 'polygon', 'blockchain'],
    skills: ['Solidity', 'Ethers.js', 'Hardhat', 'React', 'Web3.js', 'IPFS'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 400, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 5,
    location: { venue: 'CoWrks, Embassy Golf Links', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 0, description: '3 ETH + Seed funding fast-track', perks: ['3 ETH', 'VC Introductions', 'Mentorship'] },
      { position: '2nd Place', amount: 0, description: '1.5 ETH', perks: ['1.5 ETH', 'Ecosystem grants'] },
      { position: 'Best DeFi', amount: 0, description: '0.5 ETH + Uniswap swag', perks: ['Uniswap Grants consideration'] },
    ],
    requirements: ['Team of 2–5', 'Must deploy on testnet by submission', 'Open source repos only'],
    certificatesEnabled: true,
    faqs: [
      { question: 'Do I need Web3 experience?', answer: 'No! We have a free Day-0 Solidity workshop. Total beginners welcome.' },
      { question: 'What chains are supported?', answer: 'Ethereum Sepolia testnet, Polygon Mumbai, and Optimism Goerli.' },
    ],
  },

  /* ── 8. Cloud Architecture Workshop ──────────────── */
  {
    title: 'AWS Solutions Architect Workshop',
    description: `A hands-on 2-day workshop with AWS certified architects covering the core pillars of cloud architecture: reliability, performance, security, cost optimization, and operational excellence.\n\nYou'll design and deploy a real multi-tier application on AWS using EC2, RDS, S3, CloudFront, Lambda, and API Gateway. Includes a mock SA-Associate exam prep session.\n\n$200 in AWS credits provided to every participant for hands-on labs.`,
    shortDescription: '2-day AWS architecture workshop with $200 credits. SA-Associate exam prep included.',
    banner: BANNERS.cloud1,
    category: 'workshop', mode: 'online',
    tags: ['aws', 'cloud', 'architecture', 'devops', 'serverless'],
    skills: ['AWS', 'Terraform', 'Docker', 'Python', 'Bash', 'CloudFormation'],
    isPaid: true, price: 2499, isPublished: true,
    maxParticipants: 50, isTeamEvent: false,
    requirements: ['Basic Linux command line', 'AWS Free Tier account (we\'ll set up during Day 0)', 'Laptop'],
    certificatesEnabled: true,
  },

  /* ── 9. DevOps Summit ─────────────────────────────── */
  {
    title: 'DevOps & Platform Engineering Summit',
    description: `A 1-day conference for DevOps engineers, SREs, and Platform Engineers. Sessions cover GitOps, Kubernetes at scale, FinOps, developer experience (DX), observability, and AI-assisted ops.\n\nSpeakers from Razorpay, Flipkart, Swiggy, and Netflix India. Sponsored hands-on workshops on Kubernetes and ArgoCD run in the afternoon.\n\nFree for all attendees — just register and show up!`,
    shortDescription: '1-day DevOps conference with SREs from Flipkart, Swiggy & Netflix. GitOps, K8s, AI-Ops.',
    banner: BANNERS.devops1,
    category: 'conference', mode: 'offline',
    tags: ['devops', 'kubernetes', 'gitops', 'sre', 'platform-engineering', 'observability'],
    skills: ['Kubernetes', 'Docker', 'ArgoCD', 'Terraform', 'Prometheus', 'Linux'],
    isPaid: false, isPublished: true,
    maxParticipants: 200, isTeamEvent: false,
    location: { venue: 'Koramangala Indoor Stadium', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    certificatesEnabled: true,
  },

  /* ── 10. UI/UX Hackathon ──────────────────────────── */
  {
    title: 'DesignHack — 24h UI/UX Challenge',
    description: `The only hackathon where Figma beats VS Code! A 24-hour design sprint where designers, researchers, and developers collaborate to solve real product design problems.\n\nChallenges include redesigning a government digital service, creating an accessibility-first fintech app, and designing an AI-native dashboard.\n\nJudged by design leads from Zomato, CRED, and Razorpay. Open to solo participants and teams.`,
    shortDescription: '24h design hackathon judged by Zomato, CRED & Razorpay design leads. Figma + prototyping.',
    banner: BANNERS.ux1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['ux', 'ui', 'design', 'figma', 'accessibility', 'product-design'],
    skills: ['Figma', 'User Research', 'Prototyping', 'Interaction Design', 'Accessibility'],
    isPaid: false, isPublished: true,
    maxParticipants: 200, isTeamEvent: true, minTeamSize: 1, maxTeamSize: 3,
    location: { venue: 'Anthill Studio', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 50000, description: 'Best Overall Design', perks: ['Design tool subscriptions', 'Portfolio feature'] },
      { position: 'Best Accessibility', amount: 20000, description: 'Most accessible design', perks: ['Figma Pro subscription'] },
    ],
    certificatesEnabled: true,
  },

  /* ── 11. Cybersecurity CTF ────────────────────────── */
  {
    title: 'CyberArena CTF 2025 — Capture The Flag',
    description: `India's most challenging cybersecurity CTF competition with 50+ challenges across categories: Web Exploitation, Reverse Engineering, Forensics, Cryptography, Binary Exploitation, and OSINT.\n\nSolo or team-based. Challenges range from beginner (50 pts) to expert (1000 pts). 72-hour event with a live scoreboard. Top 10 teams win prizes and recruitment fast-tracks at partner cybersecurity firms.\n\nIncludes a free beginner track with guided walkthroughs for newcomers.`,
    shortDescription: '72h Capture The Flag — 50+ challenges, web exploitation, crypto, forensics, binary. Solo/team.',
    banner: BANNERS.security1,
    category: 'competition', mode: 'online',
    tags: ['cybersecurity', 'ctf', 'hacking', 'web-exploitation', 'cryptography', 'forensics'],
    skills: ['Linux', 'Python', 'Wireshark', 'Burp Suite', 'Assembly', 'Cryptography'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 1000, isTeamEvent: true, minTeamSize: 1, maxTeamSize: 4,
    prizes: [
      { position: '1st Place', amount: 100000, description: 'CTF Champions', perks: ['Recruitment fast-track', 'Security tool licenses'] },
      { position: '2nd Place', amount: 50000, description: 'Runner Up', perks: ['Tool licenses'] },
      { position: '3rd Place', amount: 25000, description: 'Bronze', perks: ['Online course subscriptions'] },
      { position: 'Best Newcomer', amount: 10000, description: 'Top beginner-track team', perks: ['Learning subscriptions'] },
    ],
    certificatesEnabled: true,
  },

  /* ── 12. Python Bootcamp ──────────────────────────── */
  {
    title: 'Python for Data Science — Weekend Bootcamp',
    description: `A 2-weekend (4-day) intensive bootcamp covering Python for data analysis and visualization. Designed for professionals who want to add data skills to their toolkit — no prior Python needed.\n\nCovers: Python basics, NumPy, Pandas, Matplotlib/Seaborn, SQL integration, and a final capstone project analyzing a real-world dataset.\n\nIncludes lifetime access to materials and a private Discord for ongoing support.`,
    shortDescription: '4-day Python data science bootcamp for professionals. Pandas, NumPy, Matplotlib + capstone.',
    banner: BANNERS.bootcamp1,
    category: 'bootcamp', mode: 'online',
    tags: ['python', 'data-science', 'pandas', 'numpy', 'matplotlib', 'sql'],
    skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Jupyter'],
    isPaid: true, price: 1799, isPublished: true,
    maxParticipants: 75, isTeamEvent: false,
    requirements: ['No prior coding experience needed', 'Laptop with Python 3.10+ installable', 'Stable internet'],
    certificatesEnabled: true,
  },

  /* ── 13. Developer Meetup Pune ────────────────────── */
  {
    title: 'PuneDev Monthly Meetup — June Edition',
    description: `PuneDev's monthly in-person gathering of 100+ developers for tech talks, networking, and community building. June's theme: "AI-Assisted Development — Productivity Hacks for Modern Devs."\n\nFeaturing lightning talks from local engineers, a panel discussion on AI coding tools (GitHub Copilot, Cursor, Claude), and an open networking session with food.\n\nAll experience levels welcome. Students get free entry with valid ID!`,
    shortDescription: 'Monthly Pune dev meetup. June theme: AI coding tools. Lightning talks, panel, networking + food.',
    banner: BANNERS.meetup1,
    category: 'meetup', mode: 'offline',
    tags: ['meetup', 'community', 'networking', 'ai', 'developer-tools'],
    skills: ['Any Stack', 'Communication', 'Networking'],
    isPaid: false, isPublished: true,
    maxParticipants: 120, isTeamEvent: false,
    location: { venue: 'Thoughtworks India, Kalyani Nagar', city: 'Pune', state: 'Maharashtra', country: 'India' },
  },

  /* ── 14. Gen AI Webinar ───────────────────────────── */
  {
    title: 'Building Production LLM Apps — Live Webinar',
    description: `A free 3-hour live webinar covering practical patterns for building production-ready LLM applications: RAG pipelines, function calling, structured output, evaluation frameworks, and cost management.\n\nPresented by engineers who've shipped LLM products at scale. Live Q&A, code-along demos, and a private GitHub repo with all code samples.\n\nRecording available for 90 days post-event.`,
    shortDescription: 'Free 3h webinar: production LLM apps — RAG, function calling, evals & cost control.',
    banner: BANNERS.ai2,
    category: 'webinar', mode: 'online',
    tags: ['llm', 'generative-ai', 'rag', 'openai', 'langchain', 'production'],
    skills: ['Python', 'LangChain', 'OpenAI API', 'Vector Databases', 'Prompt Engineering'],
    isPaid: false, isPublished: true,
    maxParticipants: 0, isTeamEvent: false,
    certificatesEnabled: false,
  },

  /* ── 15. Game Dev Competition ─────────────────────── */
  {
    title: 'IndieGame Jam — 48h Game Development Sprint',
    description: `Build a complete game from scratch in 48 hours based on a secret theme revealed at the start. Use any engine — Unity, Godot, Unreal, or plain HTML5/canvas.\n\nJudged on: Fun factor, theme adherence, technical creativity, and polish. Prizes for solo and team categories. All games submitted to a public showcase.\n\nBeginners and veterans alike — the secret theme is designed to be approachable!`,
    shortDescription: '48h game jam — any engine, secret theme revealed at start. Solo & team categories.',
    banner: BANNERS.gaming1,
    category: 'competition', mode: 'online',
    tags: ['game-dev', 'unity', 'godot', 'game-jam', 'indie', 'html5'],
    skills: ['Unity', 'Godot', 'C#', 'GDScript', 'Game Design', 'Pixel Art'],
    isPaid: false, isPublished: true,
    maxParticipants: 500, isTeamEvent: true, minTeamSize: 1, maxTeamSize: 3,
    prizes: [
      { position: 'Best Overall (Team)', amount: 30000, description: 'Top team game', perks: ['Unity Pro license', 'Feature on game portals'] },
      { position: 'Best Solo', amount: 15000, description: 'Top solo game', perks: ['Godot swag', 'Showcase feature'] },
      { position: 'Most Creative', amount: 10000, description: 'Wildest interpretation of the theme' },
    ],
    certificatesEnabled: true,
  },

  /* ── 16. Fullstack Bootcamp ───────────────────────── */
  {
    title: 'Full Stack Web Dev Bootcamp — MERN + TypeScript',
    description: `An intensive 7-day live bootcamp covering the complete MERN stack (MongoDB, Express, React, Node.js) with TypeScript from scratch to deployment.\n\nEach day covers a full vertical slice: backend API → database → frontend → deployment. By end of week you'll have a deployed full-stack app on Vercel/Railway with auth, real-time features, and CI/CD.\n\nIncludes personalized code review sessions and lifetime access to the curriculum.`,
    shortDescription: '7-day MERN + TypeScript bootcamp. Build & deploy a full-stack app with auth & CI/CD.',
    banner: BANNERS.bootcamp2,
    category: 'bootcamp', mode: 'online',
    tags: ['mern', 'fullstack', 'mongodb', 'express', 'react', 'nodejs', 'typescript'],
    skills: ['MongoDB', 'Express.js', 'React', 'Node.js', 'TypeScript', 'Docker', 'Vercel'],
    isPaid: true, price: 3499, isPublished: true, isFeatured: true,
    maxParticipants: 40, isTeamEvent: false,
    requirements: ['Basic HTML/CSS/JS knowledge', 'Laptop with Node.js 20+', 'GitHub account'],
    certificatesEnabled: true,
  },

  /* ── 17. Women in Tech Conference ─────────────────── */
  {
    title: 'SheBuilds 2025 — Women in Tech Conference',
    description: `A dedicated 1-day conference celebrating women in technology, featuring talks on leadership, technical excellence, career growth, and navigating the tech industry.\n\nKeynotes from women engineering leaders at Amazon, Meesho, and Zepto. Workshops on salary negotiation, open source contribution, and building your personal brand.\n\nAll genders welcome to attend and support. Special mentorship circles for women and non-binary attendees.`,
    shortDescription: '1-day women-in-tech conference. Keynotes, workshops on leadership, salary negotiation & open source.',
    banner: BANNERS.conference2,
    category: 'conference', mode: 'hybrid',
    tags: ['women-in-tech', 'leadership', 'career', 'diversity', 'mentorship'],
    skills: ['Leadership', 'Communication', 'Negotiation', 'Personal Branding', 'Open Source'],
    isPaid: false, isPublished: true,
    maxParticipants: 400, isTeamEvent: false,
    location: { venue: 'T-Hub, IIIT Hyderabad', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    certificatesEnabled: true,
  },

  /* ── 18. Database Workshop ────────────────────────── */
  {
    title: 'PostgreSQL Advanced Workshop — Query Optimization',
    description: `Master advanced PostgreSQL: EXPLAIN ANALYZE, index strategies (B-tree, GIN, BRIN), partitioning, CTEs, window functions, JSONB, and connection pooling with PgBouncer.\n\nHands-on with a 100GB sample database. Real-world case studies from engineers at Zomato and Razorpay on schema design at scale.\n\nIdeal for backend engineers who use PostgreSQL daily but want to go beyond the basics.`,
    shortDescription: 'Advanced PostgreSQL workshop — query optimization, indexing, partitioning & scale. Hands-on.',
    banner: BANNERS.workshop2,
    category: 'workshop', mode: 'online',
    tags: ['postgresql', 'database', 'sql', 'performance', 'backend'],
    skills: ['PostgreSQL', 'SQL', 'Database Design', 'PgBouncer', 'JSONB'],
    isPaid: true, price: 999, isPublished: true,
    maxParticipants: 60, isTeamEvent: false,
    requirements: ['PostgreSQL 14+ installed', 'Basic SQL knowledge', 'psql CLI familiarity'],
    certificatesEnabled: true,
  },

  /* ── 19. Product Management Seminar ──────────────── */
  {
    title: 'PM Fundamentals Seminar — From Engineer to Product Manager',
    description: `A 1-day seminar designed for engineers considering a move into product management. Covers: product thinking, writing PRDs, roadmap prioritization, stakeholder management, and metrics-driven product development.\n\nFacilitated by PMs from Flipkart, Google, and a YC-backed startup. Role-play exercises, mock PM interviews, and real PRD review sessions.\n\nIncludes templates and frameworks you can use immediately.`,
    shortDescription: '1-day PM seminar for engineers. Product thinking, PRDs, roadmaps & mock PM interviews.',
    banner: BANNERS.seminar1,
    category: 'seminar', mode: 'offline',
    tags: ['product-management', 'career', 'pm', 'roadmap', 'agile'],
    skills: ['Product Thinking', 'Data Analysis', 'Communication', 'Agile', 'PRD Writing'],
    isPaid: true, price: 1299, isPublished: true,
    maxParticipants: 50, isTeamEvent: false,
    location: { venue: 'WeWork Salarpuria Symbiosis', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    certificatesEnabled: true,
  },

  /* ── 20. Hackathon for Students ───────────────────── */
  {
    title: 'CampusCode — Inter-College Hackathon',
    description: `Exclusively for college students across India! A 30-hour hackathon with tracks in EdTech, AgriTech, and Smart Cities. Completely free, with travel reimbursements for outstation teams.\n\nJudged by alumni engineers from IIT/NIT/BITS. Top teams get pre-placement interview offers at partner companies, and all participants get networking exposure.\n\nRegister as a team or solo and we'll find you teammates from your city!`,
    shortDescription: 'College-only 30h hackathon. EdTech, AgriTech, Smart Cities tracks. Travel reimbursed.',
    banner: BANNERS.hackathon3,
    category: 'hackathon', mode: 'offline',
    tags: ['students', 'college', 'edtech', 'agritech', 'smart-city', 'campus'],
    skills: ['Any Stack', 'Problem Solving', 'Teamwork'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 600, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'BITS Pilani Goa Campus', city: 'Vasco da Gama', state: 'Goa', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 150000, description: 'Grand Prize', perks: ['PPO offers at partner companies', 'Incubation access', 'Travel reimbursement'] },
      { position: '2nd Place', amount: 75000, description: 'Runner Up', perks: ['Interview fast-track'] },
      { position: '3rd Place', amount: 30000, description: 'Third Place' },
    ],
    certificatesEnabled: true,
  },

  /* ── 21. TypeScript Workshop ──────────────────────── */
  {
    title: 'TypeScript Deep Dive — Advanced Types & Patterns',
    description: `Go beyond basic TypeScript. This workshop dives into discriminated unions, mapped types, conditional types, template literal types, generics in depth, declaration files, and module augmentation.\n\nReal-world examples from large codebases. Includes a challenge set you can work through at your own pace post-event.\n\nAimed at developers who've used TypeScript for 6+ months and want to master the type system.`,
    shortDescription: 'Advanced TypeScript workshop — conditional types, mapped types, generics & module augmentation.',
    banner: BANNERS.workshop3,
    category: 'workshop', mode: 'online',
    tags: ['typescript', 'javascript', 'frontend', 'backend', 'type-system'],
    skills: ['TypeScript', 'JavaScript', 'Node.js', 'React'],
    isPaid: true, price: 799, isPublished: true,
    maxParticipants: 100, isTeamEvent: false,
    requirements: ['6+ months TypeScript experience', 'Node.js 20+ installed'],
    certificatesEnabled: true,
  },

  /* ── 22. AI/ML Hackathon ──────────────────────────── */
  {
    title: 'Hack with AI — Generative AI Hackathon',
    description: `A 36-hour hackathon focused exclusively on Generative AI applications. Build with the latest LLMs, diffusion models, and multimodal APIs from OpenAI, Anthropic, Google, and Stability AI.\n\n5 tracks: Education, Healthcare, Productivity, Creative Tools, and Open Innovation. Special bonus points for using fine-tuning or custom embeddings.\n\nAPI credits totaling $2000 distributed across all teams at registration!`,
    shortDescription: '36h Gen AI hackathon. 5 tracks, $2000 in API credits, OpenAI + Anthropic + Google APIs.',
    banner: BANNERS.hackathon2,
    category: 'hackathon', mode: 'hybrid',
    tags: ['generative-ai', 'llm', 'openai', 'anthropic', 'stable-diffusion', 'ai-hackathon'],
    skills: ['Python', 'OpenAI API', 'LangChain', 'React', 'Vector Databases', 'Prompt Engineering'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 300, isTeamEvent: true, minTeamSize: 1, maxTeamSize: 4,
    location: { venue: 'Microsoft Reactor, Cyber City', city: 'Gurugram', state: 'Haryana', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 200000, description: 'Best AI Product', perks: ['API credits', 'Media coverage', 'Accelerator access'] },
      { position: 'Best in Healthcare', amount: 50000, description: 'Healthcare track winner' },
      { position: 'Best in Education', amount: 50000, description: 'Education track winner' },
      { position: 'Most Creative Use of AI', amount: 30000, description: 'Wildest AI application' },
    ],
    certificatesEnabled: true,
    faqs: [
      { question: 'Do I need my own API keys?', answer: 'No! We provide $200 in shared API credits per team at check-in.' },
      { question: 'Can solo participants join?', answer: 'Yes, solo participation is allowed. We also run a team-matching session on Day 0 morning.' },
    ],
  },

  /* ── 23. Community Meetup Hyderabad ──────────────── */
  {
    title: 'HydPy — Python Community Meetup #38',
    description: `Hyderabad's active Python community meetup, running for 5 years with 38 editions. This month's talks: FastAPI in production (a Swiggy engineer), Python 3.13 new features, and a lightning round on useful Python libraries.\n\nRelaxed atmosphere, free food, and a great chance to meet local Pythonistas. Bring your side projects for show-and-tell!\n\nWe record all talks and publish to YouTube.`,
    shortDescription: 'Hyderabad Python community meetup #38. FastAPI, Python 3.13, lightning talks + food.',
    banner: BANNERS.meetup2,
    category: 'meetup', mode: 'offline',
    tags: ['python', 'community', 'fastapi', 'meetup', 'networking'],
    skills: ['Python', 'FastAPI', 'Django', 'Data Science'],
    isPaid: false, isPublished: true,
    maxParticipants: 80, isTeamEvent: false,
    location: { venue: 'Google Hyderabad, Hitech City', city: 'Hyderabad', state: 'Telangana', country: 'India' },
  },

  /* ── 24. Frontend Competition ─────────────────────── */
  {
    title: 'CSS Art Battle — Frontend Creativity Challenge',
    description: `A unique 3-hour live CSS challenge where participants recreate a given design using ONLY HTML & CSS — no images, no JavaScript, no SVG filters.\n\nJudged on pixel accuracy (40%), code elegance (30%), and creative shortcuts (30%). Separate tracks for beginners (simplified design) and experts.\n\nLive streamed with commentary. Top 5 submissions featured on popular CSS channels.`,
    shortDescription: '3h CSS-only art challenge. Recreate a design with pure HTML/CSS. Beginner & expert tracks.',
    banner: BANNERS.competition1,
    category: 'competition', mode: 'online',
    tags: ['css', 'html', 'frontend', 'art', 'creative', 'design'],
    skills: ['HTML', 'CSS', 'CSS Animations', 'CSS Grid', 'CSS Variables'],
    isPaid: false, isPublished: true,
    maxParticipants: 300, isTeamEvent: false,
    prizes: [
      { position: 'Expert Track Winner', amount: 15000, description: 'Best expert submission' },
      { position: 'Beginner Track Winner', amount: 5000, description: 'Best beginner submission' },
      { position: 'Most Elegant Code', amount: 5000, description: 'Cleanest CSS approach' },
    ],
    certificatesEnabled: true,
  },

  /* ── 25. DevArena Grand Finale ────────────────────── */
  {
    title: 'DevArena Season Finale — Champions League 2025',
    description: `The DevArena Champions League is our annual grand finale — an invite-only event for the top 200 ranked developers on the platform (based on yearly leaderboard standings).\n\nA mix of a hackathon (Day 1-2), conference with tech talks (Day 2 afternoon), and a gala awards ceremony (Day 3 evening). The top 3 overall champions win career-changing prizes.\n\nAll travel and accommodation covered by DevArena. This is your moment — the arena awaits.`,
    shortDescription: 'Annual champions league for top 200 ranked devs. Hackathon + conference + gala awards. All-expenses paid.',
    banner: BANNERS.competition2,
    category: 'hackathon', mode: 'offline',
    tags: ['champions', 'elite', 'annual', 'awards', 'networking', 'prestige'],
    skills: ['Any Stack', 'Leadership', 'Problem Solving'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 200, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'The Leela Palace', city: 'New Delhi', state: 'Delhi', country: 'India' },
    prizes: [
      { position: 'Grand Champion', amount: 1000000, description: '₹10 Lakh + 1-year mentorship program + dream job referrals', perks: ['₹10L cash', '12-month mentor program', 'Job referrals at top tech companies', 'Speaking opportunity at DevArena 2026'] },
      { position: '2nd Champion', amount: 500000, description: '₹5 Lakh + cloud credits', perks: ['₹5L cash', '$5000 cloud credits', 'LinkedIn recommendation'] },
      { position: '3rd Champion', amount: 250000, description: '₹2.5 Lakh', perks: ['₹2.5L cash', 'Premium swag pack'] },
    ],
    certificatesEnabled: true,
    faqs: [
      { question: 'How do I qualify?', answer: 'Qualify by being in the top 200 on the annual leaderboard. Rankings reset every January 1st.' },
      { question: 'Is accommodation covered?', answer: 'Yes — all flights, hotel, and meals for 3 days are fully covered by DevArena.' },
    ],
  },

  /* ── 26. Data Engineering Bootcamp ───────────────── */
  {
    title: 'Data Engineering Bootcamp — Spark, Kafka & Airflow',
    description: `A 6-day intensive bootcamp on modern data engineering. Build end-to-end data pipelines using Apache Spark for processing, Kafka for streaming, Airflow for orchestration, and dbt for transformations.\n\nHands-on projects include a real-time analytics dashboard and a batch ETL pipeline. Instructors have built data platforms at Walmart Labs and Myntra.\n\nIncludes AWS EMR & MSK sandbox access for all participants.`,
    shortDescription: '6-day data engineering bootcamp — Spark, Kafka, Airflow & dbt. Real pipeline hands-on.',
    banner: BANNERS.data1,
    category: 'bootcamp', mode: 'online',
    tags: ['data-engineering', 'apache-spark', 'kafka', 'airflow', 'dbt', 'pipeline'],
    skills: ['Python', 'Apache Spark', 'Kafka', 'Airflow', 'dbt', 'SQL', 'AWS'],
    isPaid: true, price: 3999, isPublished: true, isFeatured: true,
    maxParticipants: 35, isTeamEvent: false,
    requirements: ['SQL proficiency required', 'Python intermediate level', 'Laptop with 16GB RAM recommended'],
    certificatesEnabled: true,
    faqs: [
      { question: 'Do I get AWS access?', answer: 'Yes — we provide shared sandbox environments on AWS EMR and MSK for all lab exercises.' },
      { question: 'Is prior Spark experience needed?', answer: 'No, we start from basics. SQL and Python knowledge is sufficient.' },
    ],
  },

  /* ── 27. MLOps Conference ─────────────────────────── */
  {
    title: 'MLOps India Summit — Production ML at Scale',
    description: `A focused 1-day conference on taking ML models from notebook to production. Sessions cover MLflow, Kubeflow, feature stores, model monitoring, A/B testing, and the economics of ML infrastructure.\n\nPractitioners from PhonePe, Swiggy, and Cars24 share war stories and solutions. Afternoon hands-on lab on building a basic MLOps pipeline.\n\nFree for students with valid college ID.`,
    shortDescription: '1-day MLOps conference. MLflow, Kubeflow, model monitoring & feature stores. Practitioners only.',
    banner: BANNERS.mlops1,
    category: 'conference', mode: 'offline',
    tags: ['mlops', 'machine-learning', 'kubeflow', 'mlflow', 'production', 'monitoring'],
    skills: ['Python', 'MLflow', 'Kubeflow', 'Docker', 'Kubernetes', 'Prometheus'],
    isPaid: true, price: 999, isPublished: true,
    maxParticipants: 180, isTeamEvent: false,
    location: { venue: 'Radisson Blu, Outer Ring Road', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    certificatesEnabled: true,
  },

  /* ── 28. Robotics Hackathon ────────────────────────── */
  {
    title: 'RoboHack 2025 — Autonomous Robotics Challenge',
    description: `A 48-hour hardware hackathon where teams build autonomous robots to complete a secret obstacle course unveiled at the start. Robots must navigate, pick objects, and avoid dynamic obstacles using sensors and ML models.\n\nHardware kits (Arduino Mega, Raspberry Pi 4, ultrasonic sensors, servo motors) provided to all teams on-site. Mentors from ISRO and robotics startups available throughout.\n\nFirst of its kind in India, sponsored by Texas Instruments and NVIDIA.`,
    shortDescription: '48h robotics hackathon. Hardware kit provided. Autonomous navigation challenge + ISRO mentors.',
    banner: BANNERS.robotics1,
    category: 'hackathon', mode: 'offline',
    tags: ['robotics', 'hardware', 'arduino', 'raspberry-pi', 'autonomous', 'embedded'],
    skills: ['Arduino', 'Raspberry Pi', 'Python', 'C++', 'Computer Vision', 'Embedded Systems'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 80, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 3,
    location: { venue: 'IIT Bombay, Electrical Engineering Building', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 100000, description: 'Fastest autonomous bot', perks: ['NVIDIA Jetson kits', 'Internship offers', 'Media coverage'] },
      { position: '2nd Place', amount: 50000, description: 'Runner Up', perks: ['TI eval board kits'] },
      { position: 'Best Innovation', amount: 25000, description: 'Most creative solution approach' },
    ],
    requirements: ['Team of 2–3 members', 'No prior hardware experience needed (kits provided)', 'Laptop required for programming'],
    certificatesEnabled: true,
  },

  /* ── 29. IoT Workshop ─────────────────────────────── */
  {
    title: 'IoT & Edge Computing Workshop',
    description: `A 2-day hands-on workshop on building connected IoT systems. Topics: ESP32 programming, MQTT protocol, edge inference with TensorFlow Lite, AWS IoT Core integration, and dashboard visualization.\n\nEach participant takes home an ESP32 dev kit, DHT22 sensor, and a relay module after the workshop.\n\nPerfect for engineers interested in hardware-software intersection.`,
    shortDescription: '2-day IoT workshop with ESP32 kit to take home. MQTT, AWS IoT Core, TFLite edge inference.',
    banner: BANNERS.iot1,
    category: 'workshop', mode: 'offline',
    tags: ['iot', 'esp32', 'mqtt', 'edge-computing', 'aws-iot', 'embedded'],
    skills: ['C/C++', 'MicroPython', 'MQTT', 'AWS IoT', 'TensorFlow Lite'],
    isPaid: true, price: 1499, isPublished: true,
    maxParticipants: 40, isTeamEvent: false,
    location: { venue: "Maker's Asylum, Bandra Kurla", city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    requirements: ['Laptop required', 'Basic C/Python knowledge helpful', 'Hardware kit included in fee'],
    certificatesEnabled: true,
  },

  /* ── 30. AR/VR Hackathon ──────────────────────────── */
  {
    title: 'ImmerseTech Hack — AR/VR Innovation Challenge',
    description: `Build immersive AR/VR experiences over 36 hours using Unity, Unreal Engine, or WebXR. Tracks include: Industrial AR (warehouse/manufacturing use cases), Social VR, Educational VR, and Healthcare XR.\n\nMeta Quest 3 and HoloLens 2 headsets available for on-site testing. Mentors from Microsoft Mixed Reality, Snap AR, and Niantic.\n\n$5000 in Meta Horizon development grants available to top teams.`,
    shortDescription: '36h AR/VR hackathon. Meta Quest 3 & HoloLens 2 on site. 4 industry tracks + Meta grants.',
    banner: BANNERS.ar1,
    category: 'hackathon', mode: 'offline',
    tags: ['ar', 'vr', 'xr', 'unity', 'webxr', 'mixed-reality', 'meta-quest'],
    skills: ['Unity', 'Unreal Engine', 'C#', 'Three.js', 'WebXR', 'Blender'],
    isPaid: false, isPublished: true,
    maxParticipants: 150, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'Microsoft Reactor, One Horizon Center', city: 'Gurugram', state: 'Haryana', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 150000, description: 'Best immersive experience overall', perks: ['Meta dev grant', 'Snap AR partnership', 'Media coverage'] },
      { position: 'Best Healthcare XR', amount: 50000, description: 'Best medical/health application' },
      { position: 'Best Educational VR', amount: 50000, description: 'Best learning experience' },
    ],
    certificatesEnabled: true,
  },

  /* ── 31. Career Fair ──────────────────────────────── */
  {
    title: 'DevArena Career Fair — Tech Hiring Day',
    description: `Meet 40+ hiring companies in one day — from funded startups to listed enterprises. Direct walk-in interviews, resume drops, and networking with engineering leaders.\n\nSpecial tracks for freshers (0–2 yrs), experienced engineers (2–7 yrs), and senior/lead roles. Pre-register your resume and get shortlisted before the event.\n\nOn-site coding rounds, GD panels, and HR rounds conducted same-day. Free to attend.`,
    shortDescription: 'Tech career fair with 40+ companies. Walk-in interviews for all experience levels. Free entry.',
    banner: BANNERS.career1,
    category: 'seminar', mode: 'offline',
    tags: ['career', 'hiring', 'jobs', 'networking', 'recruitment', 'fresher'],
    skills: ['Any Stack', 'Communication', 'Problem Solving'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 1500, isTeamEvent: false,
    location: { venue: 'Jio World Convention Centre', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    certificatesEnabled: false,
    faqs: [
      { question: 'What should I bring?', answer: 'Bring 10 printed copies of your resume, government ID, and your laptop for online coding rounds.' },
      { question: 'Are all companies hiring?', answer: 'Yes — all 40+ companies have confirmed open positions for the day.' },
    ],
  },

  /* ── 32. FinTech Hackathon ────────────────────────── */
  {
    title: 'FinHack India — Open Banking Hackathon',
    description: `A 48-hour fintech hackathon focused on Open Banking and ONDC. Build next-generation financial applications using RBI's Account Aggregator framework, UPI, and ONDC open protocols.\n\nMentors from Razorpay, NPCI, and Perfios. Judges include CXOs from leading fintech unicorns. All teams get sandbox access to Account Aggregator APIs and ONDC test environment.\n\nFocus areas: lending, wealth management, SMB banking, and financial inclusion.`,
    shortDescription: '48h fintech hackathon on Open Banking & ONDC. Account Aggregator APIs + RBI regulatory sandbox.',
    banner: BANNERS.fintech1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['fintech', 'open-banking', 'ondc', 'upi', 'account-aggregator', 'financial-inclusion'],
    skills: ['React', 'Node.js', 'Python', 'API Integration', 'Financial APIs'],
    isPaid: false, isPublished: true,
    maxParticipants: 250, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'GIFT City, Block 12', city: 'Gandhinagar', state: 'Gujarat', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 300000, description: 'Best fintech solution', perks: ['Regulatory sandbox access', 'NPCI partnership', 'Media feature'] },
      { position: 'Best Financial Inclusion', amount: 100000, description: 'Most impactful for underserved population' },
      { position: 'Best ONDC Integration', amount: 75000, description: 'Best use of ONDC protocols' },
    ],
    certificatesEnabled: true,
  },

  /* ── 33. HealthTech Sprint ────────────────────────── */
  {
    title: 'HealthHack — Clinical AI Challenge',
    description: `A 36-hour hackathon addressing real clinical problems provided by Apollo Hospitals and Manipal Health. Teams work on AI-assisted diagnostics, clinical NLP, patient journey optimization, and remote monitoring.\n\nAccess to anonymized clinical datasets (ICU monitoring, radiology reports, prescription patterns) under NDA. Medical doctors available as domain experts throughout.\n\nMoU signing opportunities for winning teams with Apollo and Manipal for pilot projects.`,
    shortDescription: '36h health-AI hackathon with real clinical datasets from Apollo & Manipal. MoU for winners.',
    banner: BANNERS.health1,
    category: 'hackathon', mode: 'offline',
    tags: ['healthtech', 'clinical-ai', 'medical-nlp', 'diagnostics', 'digital-health'],
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Medical Imaging', 'NLP', 'FHIR'],
    isPaid: false, isPublished: true,
    maxParticipants: 120, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'Apollo Health City Campus', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 200000, description: 'Best clinical AI solution', perks: ['MoU with Apollo for pilot', 'Research publication support'] },
      { position: 'Best Radiology AI', amount: 75000, description: 'Best imaging/radiology solution' },
      { position: 'Best Rural Health', amount: 50000, description: 'Most viable for tier 2/3 cities' },
    ],
    requirements: ['At least one medical professional or CS professional per team', 'NDA signing required on Day 1', 'No patient data to leave venue'],
    certificatesEnabled: true,
  },

  /* ── 34. Climate Tech Hackathon ───────────────────── */
  {
    title: 'GreenCode Hack — Climate & Sustainability Sprint',
    description: `Build tech solutions for climate change, circular economy, and sustainable development. Tracks: Precision Agriculture, Carbon Tracking, Renewable Energy Management, and Sustainable Supply Chains.\n\nData provided by ISRO (satellite imagery), IMD (weather), and partner AgriTech companies. Winning teams eligible for UNDP SDG Innovation Fund applications.\n\nOpen to students and professionals. Cross-disciplinary teams encouraged.`,
    shortDescription: '48h climate hackathon. ISRO satellite data, 4 sustainability tracks. UNDP fund eligibility.',
    banner: BANNERS.env1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['climate', 'sustainability', 'agritech', 'green-tech', 'carbon', 'sdg'],
    skills: ['Python', 'GIS', 'Remote Sensing', 'React', 'Node.js', 'Data Visualization'],
    isPaid: false, isPublished: true,
    maxParticipants: 200, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 5,
    location: { venue: 'Indian Institute of Science, Faculty Hall', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 200000, description: 'Best climate solution', perks: ['UNDP fund application support', 'Accelerator access', 'Media coverage'] },
      { position: 'Best Precision Agriculture', amount: 75000, description: 'Best agri-tech solution' },
      { position: 'Best Carbon Tech', amount: 50000, description: 'Best carbon tracking/offset solution' },
    ],
    certificatesEnabled: true,
  },

  /* ── 35. Space Tech Hackathon ─────────────────────── */
  {
    title: 'SpaceTech Hack India — ISRO Collaboration',
    description: `India's first major space-tech hackathon, organized in collaboration with ISRO's Space Application Centre. Use open ISRO datasets (Chandrayaan, ResourceSat, Oceansat) to build applications in: disaster management, agriculture, urban planning, and navigation.\n\nISRO scientists provide mentorship. Top projects considered for ISRO's Start-up Space Policy benefits. Access to BHUVAN portal API and MOSDAC weather data.\n\nAny nationality can participate.`,
    shortDescription: 'First space-tech hackathon with ISRO. Real satellite data, disaster mgmt & agri tracks. ISRO mentors.',
    banner: BANNERS.space1,
    category: 'hackathon', mode: 'hybrid',
    tags: ['space-tech', 'isro', 'satellite', 'geospatial', 'disaster-management', 'remote-sensing'],
    skills: ['Python', 'GIS', 'QGIS', 'Remote Sensing', 'React', 'Data Analysis'],
    isPaid: false, isPublished: true, isFeatured: true,
    maxParticipants: 300, isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4,
    location: { venue: 'Space Application Centre, Jodhpur Tekra', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
    prizes: [
      { position: '1st Place', amount: 500000, description: 'Best space application', perks: ['ISRO Start-up policy benefits', '6-month incubation', 'Global space conference invite'] },
      { position: 'Best Disaster Management', amount: 150000, description: 'Most impactful disaster response solution' },
      { position: 'Best AgriSat', amount: 100000, description: 'Best agricultural satellite application' },
    ],
    certificatesEnabled: true,
  },

  /* ── 36. Technical Interview Bootcamp ─────────────── */
  {
    title: 'FAANG Prep Bootcamp — DSA & System Design',
    description: `A rigorous 10-day live bootcamp focused on cracking senior software engineer interviews at top tech companies. Covers: DSA patterns (trees, graphs, DP, sliding window), system design (distributed systems, databases, caching), and behavioral interviews.\n\n100+ LeetCode-style problems solved live. Daily mock interviews with peer engineers. Resume review and referral network included.\n\nGuaranteed interview prep — 70% of past participants received FAANG/unicorn offers within 3 months.`,
    shortDescription: '10-day FAANG interview prep. DSA patterns, system design, mock interviews + referral network.',
    banner: BANNERS.hiring1,
    category: 'bootcamp', mode: 'online',
    tags: ['dsa', 'system-design', 'interview-prep', 'leetcode', 'faang', 'algorithms'],
    skills: ['Data Structures', 'Algorithms', 'System Design', 'Python', 'Java', 'JavaScript'],
    isPaid: true, price: 4999, isPublished: true, isFeatured: true,
    maxParticipants: 50, isTeamEvent: false,
    requirements: ['2+ years engineering experience', 'Familiarity with at least one programming language', 'Commitment to daily 4-hour sessions'],
    certificatesEnabled: true,
    faqs: [
      { question: `What if I can't attend a live session?`, answer: 'All sessions are recorded and available for 12 months. Daily assignments are async.' },
      { question: 'Is refund available?', answer: 'Full refund if requested within 48 hours of bootcamp start.' },
    ],
  },

  /* ── 37. Panel Discussion — Future of AI ──────────── */
  {
    title: 'The Future of AI in India — Expert Panel',
    description: `A 3-hour live panel discussion with AI researchers, startup founders, and policymakers on India's AI strategy, regulation, and opportunity. Covered topics: India AI Mission, AI safety research, talent gaps, and sovereign LLM development.\n\nPanelists from IIT AI labs, NASSCOM, a frontier AI startup, and a government digital policy advisor. Q&A and networking session follows.\n\nLive streamed on YouTube. Free in-person attendance (limited seats) plus online watch party.`,
    shortDescription: `Expert panel on India's AI future. IIT researchers, startup founders & policy advisors. Free.`,
    banner: BANNERS.panel1,
    category: 'seminar', mode: 'hybrid',
    tags: ['ai-policy', 'india-ai', 'llm', 'regulation', 'future-of-ai', 'panel'],
    skills: ['Machine Learning', 'Policy Understanding', 'Communication'],
    isPaid: false, isPublished: true,
    maxParticipants: 200, isTeamEvent: false,
    location: { venue: 'India Habitat Centre, Stein Auditorium', city: 'New Delhi', state: 'Delhi', country: 'India' },
    certificatesEnabled: false,
  },

  /* ── 38. Competitive Programming Contest ──────────── */
  {
    title: 'CodeArena Weekly — Algorithm Championship #12',
    description: `DevArena's flagship weekly competitive programming contest. 5 problems of increasing difficulty across categories: implementation, greedy, binary search, dynamic programming, and graph algorithms.\n\n2-hour live contest with real-time leaderboard. Solutions reviewed post-contest with editorial explanations by problem setters from ICPC World Finals.\n\nRankings contribute to the monthly and annual competitive programming leaderboard. Top 3 win platform rewards.`,
    shortDescription: 'Weekly 2h competitive programming contest. 5 problems, live leaderboard, ICPC-setter editorials.',
    banner: BANNERS.coding1,
    category: 'competition', mode: 'online',
    tags: ['competitive-programming', 'algorithms', 'dynamic-programming', 'graphs', 'data-structures'],
    skills: ['C++', 'Java', 'Python', 'Algorithms', 'Data Structures', 'Mathematics'],
    isPaid: false, isPublished: true,
    maxParticipants: 0, isTeamEvent: false,
    prizes: [
      { position: '1st Place', amount: 0, description: '500 DevArena points + featured badge', perks: ['Leaderboard boost', 'Exclusive badge'] },
      { position: '2nd Place', amount: 0, description: '300 DevArena points' },
      { position: '3rd Place', amount: 0, description: '150 DevArena points' },
    ],
    certificatesEnabled: false,
  },

  /* ── 39. Design Sprint Workshop ───────────────────── */
  {
    title: 'Google Design Sprint Workshop — 5-Day Method',
    description: `Learn and apply the Google Ventures Design Sprint method to a real product challenge. Teams will problem-map, sketch, storyboard, prototype, and user-test a solution in 5 days — compressed into a 2-day intensive session.\n\nFacilitated by a certified Sprint Master (GV trained). Each team leaves with a tested prototype and user feedback from real users.\n\nIdeal for product teams, startup founders, and UX professionals. Max 5 teams, 4 people each.`,
    shortDescription: 'Certified Google Design Sprint workshop — 2 days. Map, prototype & test a real product. 20 seats.',
    banner: BANNERS.sprint1,
    category: 'workshop', mode: 'offline',
    tags: ['design-sprint', 'product-design', 'ux', 'prototyping', 'user-testing', 'google-ventures'],
    skills: ['Design Thinking', 'Figma', 'User Research', 'Prototyping', 'Facilitation'],
    isPaid: true, price: 2999, isPublished: true,
    maxParticipants: 20, isTeamEvent: true, minTeamSize: 3, maxTeamSize: 5,
    location: { venue: 'Design Factory India, JKLU Campus', city: 'Jaipur', state: 'Rajasthan', country: 'India' },
    requirements: ['Come with a product challenge ready', 'Sticky notes and markers provided', 'Laptop with Figma installed'],
    certificatesEnabled: true,
  },

  /* ── 40. Go Language Workshop ─────────────────────── */
  {
    title: 'Go (Golang) for Backend Engineers — 2-Day Workshop',
    description: `An intensive 2-day workshop on Go for backend engineers. Covers: Go fundamentals, goroutines & channels, context & cancellation, HTTP servers with net/http and Gin, database access with pgx, gRPC with protobuf, and production deployment on Kubernetes.\n\nIncludes a capstone: build and deploy a microservice that handles 10K RPS with under 20ms p99 latency.\n\nInstructors are backend engineers who've used Go in production at scale at Ola and ShareChat.`,
    shortDescription: '2-day Go workshop for backend engineers — goroutines, gRPC, Kubernetes. 10K RPS capstone.',
    banner: BANNERS.data2,
    category: 'workshop', mode: 'online',
    tags: ['golang', 'go', 'backend', 'grpc', 'microservices', 'kubernetes', 'concurrency'],
    skills: ['Go', 'gRPC', 'protobuf', 'PostgreSQL', 'Docker', 'Kubernetes'],
    isPaid: true, price: 1299, isPublished: true,
    maxParticipants: 60, isTeamEvent: false,
    requirements: ['1+ year backend engineering experience', 'Go 1.22+ installed', 'Docker Desktop installed'],
    certificatesEnabled: true,
  },
];

/* ══════════════════════════════════════════════════════════════
   SEED FUNCTION
══════════════════════════════════════════════════════════════ */
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      BadgeDefinition.deleteMany({}),
      Team.deleteMany({}),
      Certificate.deleteMany({}),
    ]);
    console.log('  Cleared existing data');

    // Seed badge definitions
    await BadgeDefinition.insertMany(BADGE_DEFINITIONS);
    console.log(` Seeded ${BADGE_DEFINITIONS.length} badge definitions`);

    /* ── Admin ─────────────────────────────────────── */
    const admin = await User.create({
      name: 'DevArena Admin',
      email: 'admin@devarena.dev',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      points: 9999,
      level: 10,
      headline: 'Platform Administrator',
      skills: ['Node.js', 'React', 'MongoDB', 'DevOps', 'AWS'],
      bio: 'The DevArena platform administrator. Keeping the arena running smoothly.',
      badges: [
        { name: 'Platform Admin',    description: 'Platform administrator', icon: 'shield', category: 'special' },
        { name: 'Legend',            description: 'Earned 10000 points',    icon: 'diamond', category: 'achievement' },
        { name: 'Welcome to DevArena', description: 'Joined platform',      icon: 'star', category: 'participation' },
      ],
    });

    /* ── Organizers ────────────────────────────────── */
    const organizer = await User.create({
      name: 'Tech Events India',
      email: 'organizer@devarena.dev',
      password: 'Organizer@123',
      role: 'organizer',
      isVerified: true,
      points: 4200,
      level: 7,
      headline: 'Event Organizer & Developer Community Builder',
      skills: ['Event Management', 'Community Building', 'Marketing', 'Sponsorship'],
      bio: "Building India's best developer events since 2020. 50+ hackathons & workshops organized with 80,000+ total registrations.",
      badges: [
        { name: 'Event Organizer',  description: 'Created first event',   icon: 'layout', category: 'contribution' },
        { name: 'Community Builder', description: 'Created 5 events',     icon: 'users', category: 'contribution' },
        { name: 'Rising Star',      description: 'Earned 500 points',     icon: 'trending-up', category: 'achievement' },
      ],
    });

    const organizer2 = await User.create({
      name: 'DevCon Media',
      email: 'devcon@devarena.dev',
      password: 'Organizer@123',
      role: 'organizer',
      isVerified: true,
      points: 2800,
      level: 5,
      headline: 'Tech Conference Producer | 10 Years in Developer Communities',
      skills: ['Conference Production', 'Speaker Relations', 'Video Production'],
      bio: 'Producing world-class developer conferences across India since 2014.',
      badges: [
        { name: 'Event Organizer', description: 'Created first event', icon: 'layout', category: 'contribution' },
        { name: 'Welcome to DevArena', description: 'Joined platform', icon: 'star', category: 'participation' },
      ],
    });

    /* ── Participants ──────────────────────────────── */
    const participants = await User.create([
      {
        name: 'Arjun Sharma', email: 'arjun@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 1850, level: 4,
        headline: 'Full Stack Developer | React, Node.js & TypeScript',
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'GraphQL', 'Next.js'],
        interests: ['Hackathons', 'Web3', 'AI/ML', 'Open Source'],
        location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        education: [{ institution: 'IIT Delhi', degree: 'B.Tech in Computer Science', startYear: 2021, endYear: 2025 }],
        bio: 'Passionate full-stack dev. Hackathon enthusiast with 8 national wins.',
        stats: { eventsJoined: 7, teamsJoined: 3, teamsCreated: 2, certificatesEarned: 2, hackathonsWon: 1 },
        badges: [
          { name: 'Welcome to DevArena',  description: 'Joined platform',       icon: 'star', category: 'participation' },
          { name: 'Hackathon Enthusiast', description: 'Joined 10 events',       icon: 'zap', category: 'achievement'   },
          { name: 'Rising Star',          description: 'Earned 500 points',      icon: 'trending-up', category: 'achievement'     },
          { name: 'Dev Champion',         description: 'Earned 1000 points',     icon: 'award', category: 'achievement'     },
          { name: 'Team Player',          description: 'Created/joined a team',  icon: 'users', category: 'participation' },
        ],
      },
      {
        name: 'Aditi Jar', email: 'aditi@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 1450, level: 4,
        headline: 'Frontend Engineer & UI/UX Specialist',
        skills: ['React', 'TypeScript', 'TailwindCSS', 'Figma', 'Next.js', 'Redux'],
        interests: ['Competitive Programming', 'Design Systems', 'Web3', 'Fintech'],
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        education: [{ institution: 'BITS Pilani', degree: 'B.E. Computer Science', startYear: 2022, endYear: 2026 }],
        bio: 'Frontend enthusiast crafting pixel-perfect interfaces and scalable web apps.',
        stats: { eventsJoined: 5, teamsJoined: 2, teamsCreated: 1, certificatesEarned: 2, hackathonsWon: 1 },
        badges: [
          { name: 'Welcome to DevArena',  description: 'Joined platform',   icon: 'star', category: 'participation' },
          { name: 'Event Explorer',       description: 'Joined 5 events',   icon: 'calendar', category: 'achievement'   },
          { name: 'Rising Star',          description: 'Earned 500 points', icon: 'trending-up', category: 'achievement'     },
          { name: 'Dev Champion',         description: 'Earned 1000 points',icon: 'award', category: 'achievement'     },
          { name: 'Team Player',          description: 'Created/joined a team', icon: 'users', category: 'participation' },
        ],
      },
      {
        name: 'Priya Nair', email: 'priya@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 2200, level: 5,
        headline: 'ML Engineer | Python & PyTorch specialist',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'MLOps', 'Hugging Face'],
        interests: ['Generative AI', 'NLP', 'Computer Vision'],
        location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
        education: [{ institution: 'IIIT Hyderabad', degree: 'M.Tech AI/ML', startYear: 2023, endYear: 2025 }],
        bio: 'ML engineer at a Series B startup. Love NLP and anything generative.',
        stats: { eventsJoined: 8, teamsJoined: 3, teamsCreated: 1, certificatesEarned: 3, hackathonsWon: 2 },
        badges: [
          { name: 'Welcome to DevArena',  description: 'Joined platform',   icon: 'star', category: 'participation' },
          { name: 'Event Explorer',       description: 'Joined 5 events',   icon: 'calendar', category: 'achievement'   },
          { name: 'Rising Star',          description: 'Earned 500 points', icon: 'trending-up', category: 'achievement'     },
          { name: 'Dev Champion',         description: 'Earned 1000 points',icon: 'award', category: 'achievement'     },
          { name: 'Certificate Collector',description: 'Earned 3 certs',    icon: 'file-text', category: 'achievement'   },
        ],
      },
      {
        name: 'Rohan Patel', email: 'rohan@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 920, level: 3,
        headline: 'CS Final Year | MERN Stack & Mobile Dev',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Flutter', 'Firebase'],
        interests: ['Mobile Apps', 'Hackathons', 'Cloud'],
        location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
        education: [{ institution: 'VIT Pune', degree: 'B.Tech IT', startYear: 2021, endYear: 2025 }],
        bio: 'Final year CS student at VIT Pune. Building a side project in Flutter.',
        stats: { eventsJoined: 4, teamsJoined: 2, teamsCreated: 1, certificatesEarned: 1, hackathonsWon: 0 },
        badges: [
          { name: 'Welcome to DevArena', description: 'Joined platform', icon: 'star', category: 'participation' },
          { name: 'First Step',          description: 'Registered for 1 event', icon: 'footprints', category: 'participation' },
          { name: 'Rising Star',         description: 'Earned 500 points', icon: 'trending-up', category: 'achievement' },
        ],
      },
      {
        name: 'Sneha Iyer', email: 'sneha@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 3100, level: 6,
        headline: 'DevOps Engineer | Kubernetes, Terraform & CI/CD',
        skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'ArgoCD', 'Linux'],
        interests: ['Cloud Architecture', 'DevOps', 'Security'],
        location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        education: [{ institution: 'PES University', degree: 'B.Tech CS', startYear: 2020, endYear: 2024 }],
        bio: 'Platform engineer at a fintech. 5x hackathon winner.',
        stats: { eventsJoined: 11, teamsJoined: 4, teamsCreated: 2, certificatesEarned: 4, hackathonsWon: 3 },
        badges: [
          { name: 'Welcome to DevArena', description: 'Joined platform', icon: 'star', category: 'participation' },
          { name: 'Dev Champion',        description: 'Earned 1000 points', icon: 'award', category: 'achievement' },
          { name: 'Hackathon Winner',    description: 'Won a hackathon prize', icon: 'trophy', category: 'special' },
          { name: 'Elite Developer',     description: 'Earned 5000 points', icon: 'cpu', category: 'achievement' },
        ],
      },
      {
        name: 'Rahul Singh', email: 'rahul@devarena.dev', password: 'User@123',
        role: 'participant', isVerified: true, points: 2750, level: 6,
        headline: 'Competitive Programmer | ICPC Regionalist',
        skills: ['C++', 'Algorithms', 'Data Structures', 'Python', 'Mathematics'],
        interests: ['Algorithms', 'ICPC', 'Competitive Programming'],
        location: { city: 'New Delhi', state: 'Delhi', country: 'India' },
        education: [{ institution: 'IIT Roorkee', degree: 'B.Tech CS', startYear: 2021, endYear: 2025 }],
        bio: 'ICPC Asia Regionals qualifier. 2000+ on Codeforces. Love algorithmic challenges.',
        stats: { eventsJoined: 9, teamsJoined: 3, teamsCreated: 1, certificatesEarned: 3, hackathonsWon: 2 },
        badges: [
          { name: 'Welcome to DevArena',  description: 'Joined platform',    icon: 'star', category: 'participation' },
          { name: 'Hackathon Enthusiast', description: 'Joined 10 events',   icon: 'zap', category: 'achievement'   },
          { name: 'Dev Champion',         description: 'Earned 1000 pts',    icon: 'award', category: 'achievement'     },
          { name: 'Certificate Collector',description: 'Earned 3 certs',     icon: 'file-text', category: 'achievement'   },
        ],
      },
    ]);

    /* ── Create Events with Realistic Time Horizons ────────── */
    const base = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    const organizers = [organizer._id, organizer2._id, admin._id];

    const eventDocs = SAMPLE_EVENTS.map((ev, i) => {
      let startDate, endDate, regDeadline, status;

      if (i < 4) {
        // 1. Live / Ongoing Now (events 0..3)
        startDate   = new Date(base.getTime() - 1 * DAY);
        endDate     = new Date(base.getTime() + 2 * DAY);
        regDeadline = new Date(base.getTime() + 1 * DAY);
        status      = 'ongoing';
      } else if (i < 10) {
        // 2. Closing Soon / This Week (events 4..9) — e.g. 2d to 6d left
        const daysOut = (i - 4) + 2;
        startDate   = new Date(base.getTime() + daysOut * DAY);
        endDate     = new Date(startDate.getTime() + 2 * DAY);
        regDeadline = new Date(base.getTime() + (daysOut - 1) * DAY);
        status      = 'upcoming';
      } else if (i < 25) {
        // 3. Upcoming in 2-4 Weeks (events 10..24)
        const daysOut = 8 + (i - 10) * 1.5;
        startDate   = new Date(base.getTime() + daysOut * DAY);
        endDate     = new Date(startDate.getTime() + (ev.category === 'bootcamp' ? 5 : 2) * DAY);
        regDeadline = new Date(startDate.getTime() - 2 * DAY);
        status      = 'upcoming';
      } else if (i < 35) {
        // 4. Next Month (events 25..34)
        const daysOut = 28 + (i - 25) * 2;
        startDate   = new Date(base.getTime() + daysOut * DAY);
        endDate     = new Date(startDate.getTime() + 2 * DAY);
        regDeadline = new Date(startDate.getTime() - 3 * DAY);
        status      = 'upcoming';
      } else {
        // 5. Recently Completed Past Events (events 35..39)
        const daysAgo = 18 - (i - 35) * 3;
        startDate   = new Date(base.getTime() - daysAgo * DAY);
        endDate     = new Date(startDate.getTime() + 2 * DAY);
        regDeadline = new Date(startDate.getTime() - 1 * DAY);
        status      = 'completed';
      }

      // Rotate registered participants
      const eventParticipants = participants.slice(0, (i % (participants.length - 1)) + 2);

      return {
        ...ev,
        organizer: organizers[i % organizers.length],
        startDate,
        endDate,
        status,
        isPublished: true,
        registrationOpenDate: new Date(base.getTime() - 14 * DAY),
        registrationDeadline: regDeadline,
        registrations: eventParticipants.map((p, pi) => ({
          user: p._id,
          status: 'approved',
          registeredAt: new Date(base.getTime() - (pi + 2) * DAY),
        })),
        registeredCount: Math.floor(Math.random() * 95) + 35,
        views: Math.floor(Math.random() * 1200) + 240,
        slug: ev.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .slice(0, 60) + '-' + i,
      };
    });

    const events = [];
    for (let i = 0; i < eventDocs.length; i++) {
      const doc = eventDocs[i];
      if (!doc || !doc.title) {
        console.error(`Missing title at index ${i}:`, doc);
        continue;
      }
      try {
        const ev = await Event.create(doc);
        events.push(ev);
      } catch (err) {
        console.error(`Error at index ${i} (${doc.title}):`, err.message);
        throw err;
      }
    }
    console.log(` Seeded ${events.length} events`);

    /* ── Seed Teams for Hackathons ───────────────────── */
    const teamEvents = events.filter(e => e && e.isTeamEvent);
    if (teamEvents.length > 0) {
      await Team.create([
        {
          name: 'NeuralMatrix',
          description: 'Building an autonomous AI agent for decentralized finance anomaly detection.',
          event: teamEvents[0]._id,
          leader: participants[0]._id, // Arjun
          members: [
            { user: participants[0]._id, role: 'leader', skills: ['React', 'Node.js'] },
            { user: participants[1]._id, role: 'member', skills: ['Figma', 'UI/UX'] }, // Aditi
            { user: participants[2]._id, role: 'member', skills: ['Python', 'PyTorch'] }, // Priya
          ],
          requiredSkills: ['Rust', 'Smart Contracts'],
          maxSize: 4,
          isOpen: true,
        },
        {
          name: 'Algorithmics',
          description: 'Competitive programming and high-frequency optimization squad.',
          event: teamEvents[0]._id,
          leader: participants[5]._id, // Rahul
          members: [
            { user: participants[5]._id, role: 'leader', skills: ['C++', 'Algorithms'] },
            { user: participants[4]._id, role: 'member', skills: ['Kubernetes', 'Docker'] }, // Sneha
          ],
          requiredSkills: ['Data Structures'],
          maxSize: 4,
          isOpen: true,
        },
        ...(teamEvents.length > 1 ? [
          {
            name: 'CloudScale',
            description: 'Scalable cloud infrastructure and serverless workflow automation.',
            event: teamEvents[1]._id,
            leader: participants[1]._id, // Aditi
            members: [
              { user: participants[1]._id, role: 'leader', skills: ['React', 'Next.js'] },
              { user: participants[3]._id, role: 'member', skills: ['Flutter', 'Firebase'] }, // Rohan
            ],
            requiredSkills: ['Go', 'PostgreSQL'],
            maxSize: 4,
            isOpen: true,
          }
        ] : []),
      ]);
      console.log(' Seeded active Teams');
    }

    /* ── Seed Verifiable Certificates for Completed Events ─── */
    const pastEvents = events.filter(e => e.status === 'completed');
    if (pastEvents.length > 0) {
      const certData = [
        {
          user: participants[0]._id, // Arjun
          event: pastEvents[0]._id,
          certificateId: 'DA-2025-HACK-8812',
          type: 'winner',
          issuedAt: new Date(base.getTime() - 8 * DAY),
          metadata: { rank: 1, achievement: '1st Place Winner — Hackathon Finals' },
          verificationUrl: 'http://localhost:3000/verify-certificate/DA-2025-HACK-8812',
          isValid: true,
        },
        {
          user: participants[1]._id, // Aditi
          event: pastEvents[0]._id,
          certificateId: 'DA-2025-DES-4419',
          type: 'runner-up',
          issuedAt: new Date(base.getTime() - 8 * DAY),
          metadata: { rank: 2, achievement: '2nd Place Runner Up — UI Design & Frontend' },
          verificationUrl: 'http://localhost:3000/verify-certificate/DA-2025-DES-4419',
          isValid: true,
        },
        {
          user: participants[1]._id, // Aditi
          event: pastEvents[1] ? pastEvents[1]._id : pastEvents[0]._id,
          certificateId: 'DA-2025-PART-1024',
          type: 'participation',
          issuedAt: new Date(base.getTime() - 14 * DAY),
          metadata: { rank: 5, achievement: 'Official Participant' },
          verificationUrl: 'http://localhost:3000/verify-certificate/DA-2025-PART-1024',
          isValid: true,
        },
        {
          user: participants[2]._id, // Priya
          event: pastEvents[0]._id,
          certificateId: 'DA-2025-ML-7391',
          type: 'winner',
          issuedAt: new Date(base.getTime() - 8 * DAY),
          metadata: { rank: 1, achievement: '1st Place ML Model Architecture' },
          verificationUrl: 'http://localhost:3000/verify-certificate/DA-2025-ML-7391',
          isValid: true,
        },
      ];
      await Certificate.create(certData);
      console.log(` Seeded ${certData.length} verifiable certificates`);
    }

    /* ── Summary ───────────────────────────────────── */
    console.log('\n[OK]  Seeded successfully!\n');
    console.log('  Test Credentials:');
    console.log('  Admin:      admin@devarena.dev      / Admin@123');
    console.log('  Organizer:  organizer@devarena.dev  / Organizer@123');
    console.log('  Organizer2: devcon@devarena.dev     / Organizer@123');
    console.log('  User 1:     arjun@devarena.dev      / User@123');
    console.log('  User 2:     priya@devarena.dev      / User@123');
    console.log('  User 3:     rohan@devarena.dev      / User@123');
    console.log('  User 4:     sneha@devarena.dev      / User@123');
    console.log('  User 5:     karan@devarena.dev      / User@123');
    console.log('  User 6:     divya@devarena.dev      / User@123');
    console.log(`\n  Created:`);
    console.log(`  · ${events.length} events (25 original + 15 new)`);
    console.log(`  · ${participants.length + 3} users (1 admin, 2 organizers, ${participants.length} participants)`);
    console.log(`  · ${BADGE_DEFINITIONS.length} badge definitions`);
    console.log('\n  All events include banner images from Unsplash.\n');

    process.exit(0);
  } catch (error) {
    console.error('[ERROR]  Seeder error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
