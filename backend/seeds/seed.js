/**
 * Database Seed Script
 *
 * Creates development seed data for testing all competition states:
 * 1. Upcoming (registration hasn't started)
 * 2. Registration Open (with spots)
 * 3. Full (registration open but capacity reached)
 * 4. Live (competition ongoing)
 * 5. Ended (competition finished)
 *
 * Also creates test users.
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const Participation = require('../src/models/Participation');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedants';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Competition.deleteMany({});
    await Participation.deleteMany({});
    console.log('Cleared existing data');

    // ─── Create Users ─────────────────────────────────────
    const users = await User.create([
      {
        name: 'Riya Shah',
        email: 'riya@example.com',
        passwordHash: 'password123',
      },
      {
        name: 'Aarav Mehta',
        email: 'aarav@example.com',
        passwordHash: 'password123',
      },
      {
        name: 'Neha Verma',
        email: 'neha@example.com',
        passwordHash: 'password123',
      },
      {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'password123',
      },
      {
        name: 'Demo User',
        email: 'demo@example.com',
        passwordHash: 'password123',
      },
    ]);

    console.log(`Created ${users.length} users`);

    const now = new Date();

    // Helper to offset dates
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

    // ─── Competition 1: Registration Open (Main Feedants Design) ────
    const comp1 = await Competition.create({
      title: 'Feedants Classical Dance',
      slug: 'feedants-classical-dance',
      description:
        'This is an online classical dance competition open for all age groups.\nParticipate from anywhere and showcase your talent.\nExpress your passion through traditional dance.\n\nWhether you are a beginner or an experienced performer, this competition welcomes dancers of all skill levels. Show the world your unique style and creativity through the timeless beauty of classical dance forms.\n\nSubmit your best performance video and let our expert judges evaluate your talent.',
      bannerImage: null,
      category: 'Dance',
      tags: ['Dance', 'Multi-Win'],
      organizer: {
        name: 'Manju Dubey',
        title: 'Professional Kathak Dancer',
        experience: '12+ Years of Experience',
        avatar: null,
        introVideo: null,
      },
      prizePool: 1500,
      entryFee: 99,
      currency: 'INR',
      prizes: [
        { position: '1st Winner', amount: 550, currency: 'INR' },
        { position: '2nd Winner', amount: 300, currency: 'INR' },
        { position: '3rd Winner', amount: 240, currency: 'INR' },
        { position: '4th Winner', amount: 200, currency: 'INR' },
        { position: '5th Winner', amount: 130, currency: 'INR' },
        { position: '6th Winner', amount: 80, currency: 'INR' },
      ],
      registrationStartAt: addDays(now, -2),
      registrationEndAt: addDays(now, 1.27), // ~1d 6h from now
      submissionStartAt: addDays(now, 2),
      submissionEndAt: addDays(now, 10),
      startAt: addDays(now, 2),
      endAt: addDays(now, 12),
      resultAt: addDays(now, 14),
      capacity: 20,
      registeredCount: 1,
      rules: [
        'Solo performance only — no duets or group dances.',
        'Video must be between 2 to 5 minutes in length.',
        'Only classical dance forms (Bharatanatyam, Kathak, Odissi, Kuchipudi, Mohiniyattam, etc.) are allowed.',
        'Participants must perform in traditional attire.',
        'No copyrighted music — use royalty-free or original compositions.',
        'One entry per participant.',
      ],
      eligibility: [
        'Open to all age groups.',
        'No prior competition experience required.',
        'Must have a valid Feedants account.',
        'Entry fee must be paid before submission.',
      ],
      judgingParameters: [
        { name: 'Technique & Form', weightage: '30%', description: 'Mastery of chosen dance style' },
        { name: 'Expression & Emotion', weightage: '25%', description: 'Facial expressions and storytelling' },
        { name: 'Rhythm & Timing', weightage: '20%', description: 'Synchronization with music' },
        { name: 'Costume & Presentation', weightage: '15%', description: 'Overall visual appeal' },
        { name: 'Creativity', weightage: '10%', description: 'Unique elements and choreography' },
      ],
      previousWinners: [
        { name: 'Riya Shah', position: '1st Winner', avatar: null },
        { name: 'Aarav Mehta', position: '1st Winner', avatar: null },
        { name: 'Neha Verma', position: '2nd Winner', avatar: null },
        { name: 'Ishita Chopra', position: '3rd Winner', avatar: null },
      ],
      certificateProvided: true,
      disclaimer:
        'Only contributions from paid participants will be considered for judging.',
      referralEnabled: true,
    });

    // Register first user for comp1
    await Participation.create({
      competitionId: comp1._id,
      userId: users[0]._id,
      status: 'REGISTERED',
      registeredAt: addHours(now, -12),
    });

    // ─── Competition 2: Upcoming ────────────────────────
    await Competition.create({
      title: 'Feedants Photography Challenge',
      slug: 'feedants-photography-challenge',
      description:
        'Capture the world through your lens! This photography competition invites participants to submit their best shots across any genre — landscape, portrait, street, or abstract.',
      bannerImage: null,
      category: 'Photography',
      tags: ['Photography', 'Creative'],
      organizer: {
        name: 'Vikram Singh',
        title: 'Award-Winning Photographer',
        experience: '15+ Years of Experience',
        avatar: null,
      },
      prizePool: 3000,
      entryFee: 149,
      currency: 'INR',
      prizes: [
        { position: '1st Winner', amount: 1500, currency: 'INR' },
        { position: '2nd Winner', amount: 1000, currency: 'INR' },
        { position: '3rd Winner', amount: 500, currency: 'INR' },
      ],
      registrationStartAt: addDays(now, 5),
      registrationEndAt: addDays(now, 15),
      submissionStartAt: addDays(now, 16),
      submissionEndAt: addDays(now, 25),
      startAt: addDays(now, 16),
      endAt: addDays(now, 30),
      resultAt: addDays(now, 33),
      capacity: 100,
      registeredCount: 0,
      rules: ['One entry per participant.', 'No AI-generated images.'],
      eligibility: ['Open to all age groups.', 'Must have a valid Feedants account.'],
      judgingParameters: [
        { name: 'Composition', weightage: '40%', description: null },
        { name: 'Creativity', weightage: '30%', description: null },
        { name: 'Technical Quality', weightage: '30%', description: null },
      ],
      previousWinners: [],
      certificateProvided: true,
      disclaimer: 'Only original photographs will be accepted.',
      referralEnabled: false,
    });

    // ─── Competition 3: Full ────────────────────────────
    const comp3 = await Competition.create({
      title: 'Feedants Singing Star',
      slug: 'feedants-singing-star',
      description:
        'Show off your vocal talent! This singing competition is open to all genres — classical, Bollywood, pop, folk, or indie.',
      bannerImage: null,
      category: 'Singing',
      tags: ['Singing', 'Music'],
      organizer: {
        name: 'Priya Kumari',
        title: 'Playback Singer',
        experience: '8+ Years of Experience',
        avatar: null,
      },
      prizePool: 2000,
      entryFee: 79,
      currency: 'INR',
      prizes: [
        { position: '1st Winner', amount: 1000, currency: 'INR' },
        { position: '2nd Winner', amount: 600, currency: 'INR' },
        { position: '3rd Winner', amount: 400, currency: 'INR' },
      ],
      registrationStartAt: addDays(now, -5),
      registrationEndAt: addDays(now, 3),
      submissionStartAt: addDays(now, 4),
      submissionEndAt: addDays(now, 10),
      startAt: addDays(now, 4),
      endAt: addDays(now, 12),
      resultAt: addDays(now, 14),
      capacity: 3,
      registeredCount: 3, // FULL
      rules: ['Solo performance only.', 'Maximum 4 minutes.'],
      eligibility: ['All age groups.'],
      judgingParameters: [
        { name: 'Vocal Quality', weightage: '40%', description: null },
        { name: 'Pitch & Rhythm', weightage: '35%', description: null },
        { name: 'Expression', weightage: '25%', description: null },
      ],
      previousWinners: [],
      certificateProvided: false,
      disclaimer: null,
      referralEnabled: true,
    });

    // Register 3 users for comp3 to make it full
    for (let i = 0; i < 3; i++) {
      await Participation.create({
        competitionId: comp3._id,
        userId: users[i]._id,
        status: 'REGISTERED',
        registeredAt: addDays(now, -3 + i),
      });
    }

    // ─── Competition 4: Live ────────────────────────────
    await Competition.create({
      title: 'Feedants Art Exhibition',
      slug: 'feedants-art-exhibition',
      description:
        'An online art exhibition competition showcasing painting, sketching, and digital art.',
      bannerImage: null,
      category: 'Art',
      tags: ['Art', 'Creative', 'Multi-Win'],
      organizer: {
        name: 'Ananya Joshi',
        title: 'Contemporary Artist',
        experience: '10+ Years of Experience',
        avatar: null,
      },
      prizePool: 5000,
      entryFee: 199,
      currency: 'INR',
      prizes: [
        { position: '1st Winner', amount: 2500, currency: 'INR' },
        { position: '2nd Winner', amount: 1500, currency: 'INR' },
        { position: '3rd Winner', amount: 1000, currency: 'INR' },
      ],
      registrationStartAt: addDays(now, -15),
      registrationEndAt: addDays(now, -5),
      submissionStartAt: addDays(now, -4),
      submissionEndAt: addDays(now, 5),
      startAt: addDays(now, -4),
      endAt: addDays(now, 5),
      resultAt: addDays(now, 8),
      capacity: 50,
      registeredCount: 32,
      rules: ['One submission per participant.', 'Plagiarism will result in disqualification.'],
      eligibility: ['All age groups.'],
      judgingParameters: [
        { name: 'Creativity', weightage: '35%', description: null },
        { name: 'Technique', weightage: '35%', description: null },
        { name: 'Presentation', weightage: '30%', description: null },
      ],
      previousWinners: [
        { name: 'Riya Shah', position: '1st Winner', avatar: null },
      ],
      certificateProvided: true,
      disclaimer: null,
      referralEnabled: false,
    });

    // ─── Competition 5: Ended ───────────────────────────
    await Competition.create({
      title: 'Feedants Poetry Slam',
      slug: 'feedants-poetry-slam',
      description:
        'Express yourself through words! This poetry competition welcomes original poems in Hindi, English, or Urdu.',
      bannerImage: null,
      category: 'Writing',
      tags: ['Poetry', 'Writing'],
      organizer: {
        name: 'Rahul Sharma',
        title: 'Published Poet',
        experience: '6+ Years of Experience',
        avatar: null,
      },
      prizePool: 1000,
      entryFee: 49,
      currency: 'INR',
      prizes: [
        { position: '1st Winner', amount: 500, currency: 'INR' },
        { position: '2nd Winner', amount: 300, currency: 'INR' },
        { position: '3rd Winner', amount: 200, currency: 'INR' },
      ],
      registrationStartAt: addDays(now, -30),
      registrationEndAt: addDays(now, -20),
      submissionStartAt: addDays(now, -19),
      submissionEndAt: addDays(now, -10),
      startAt: addDays(now, -19),
      endAt: addDays(now, -5),
      resultAt: addDays(now, -3),
      capacity: 25,
      registeredCount: 18,
      rules: ['Original work only.', 'Maximum 3 minutes for recitation.'],
      eligibility: ['All age groups.'],
      judgingParameters: [
        { name: 'Content', weightage: '40%', description: null },
        { name: 'Delivery', weightage: '30%', description: null },
        { name: 'Creativity', weightage: '30%', description: null },
      ],
      previousWinners: [],
      certificateProvided: true,
      disclaimer: null,
      referralEnabled: false,
    });

    // ─── Competition 6: Capacity=1 for concurrency testing ──
    await Competition.create({
      title: 'Feedants Speed Challenge',
      slug: 'feedants-speed-challenge',
      description:
        'A single-slot speed challenge competition for testing concurrency.',
      bannerImage: null,
      category: 'Challenge',
      tags: ['Speed', 'Challenge'],
      organizer: {
        name: 'Admin',
        title: 'Feedants Team',
        experience: null,
        avatar: null,
      },
      prizePool: 500,
      entryFee: 0,
      currency: 'INR',
      prizes: [{ position: '1st Winner', amount: 500, currency: 'INR' }],
      registrationStartAt: addDays(now, -1),
      registrationEndAt: addDays(now, 5),
      submissionStartAt: addDays(now, 6),
      submissionEndAt: addDays(now, 8),
      startAt: addDays(now, 6),
      endAt: addDays(now, 9),
      resultAt: addDays(now, 10),
      capacity: 1,
      registeredCount: 0,
      rules: ['First come, first served.'],
      eligibility: ['All age groups.'],
      judgingParameters: [],
      previousWinners: [],
      certificateProvided: false,
      disclaimer: null,
      referralEnabled: false,
    });

    console.log('Created 6 competitions with varied states');
    console.log('\n📋 Seed Summary:');
    console.log('─────────────────────────────────────');
    console.log('Users: 5 (test@example.com / demo@example.com / riya@example.com / aarav@example.com / neha@example.com)');
    console.log('Password for all: password123');
    console.log('');
    console.log('Competition 1: Registration Open  (Feedants Classical Dance)');
    console.log('Competition 2: Upcoming           (Photography Challenge)');
    console.log('Competition 3: Full               (Singing Star)');
    console.log('Competition 4: Live               (Art Exhibition)');
    console.log('Competition 5: Ended              (Poetry Slam)');
    console.log('Competition 6: Capacity=1         (Speed Challenge — concurrency test)');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
