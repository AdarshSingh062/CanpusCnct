/**
 * Seeds the database with demo accounts and realistic sample data.
 * Usage: npm run seed          (adds data)
 *        npm run seed -- --fresh   (wipes collections first)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Complaint = require('../models/Complaint');
const MarketplaceItem = require('../models/MarketplaceItem');
const LostFoundItem = require('../models/LostFoundItem');
const Resource = require('../models/Resource');
const Opportunity = require('../models/Opportunity');
const calculatePriority = require('../utils/calculatePriority');

const FRESH = process.argv.includes('--fresh');

const DEMO_PASSWORD = 'Password123!';

async function run() {
  await connectDB();

  if (FRESH) {
    console.log('[Seed] Wiping existing collections...');
    await Promise.all(
      [User, Club, ClubMember, Event, Post, Complaint, MarketplaceItem, LostFoundItem, Resource, Opportunity].map((m) =>
        m.deleteMany({})
      )
    );
  }

  console.log('[Seed] Creating demo accounts...');
  const demoUsers = await User.create([
    { name: 'Aarav Sharma', email: 'student@campusconnect.demo', password: DEMO_PASSWORD, role: 'student', department: 'Computer Science', semester: 5, rollNumber: 'CS21B045', skills: ['react', 'node', 'python'] },
    { name: 'Dr. Meera Nair', email: 'faculty@campusconnect.demo', password: DEMO_PASSWORD, role: 'faculty', department: 'Computer Science' },
    { name: 'Rohan Verma', email: 'clubadmin@campusconnect.demo', password: DEMO_PASSWORD, role: 'clubadmin', department: 'Electronics' },
    { name: 'Admin User', email: 'admin@campusconnect.demo', password: DEMO_PASSWORD, role: 'superadmin' },
  ]);
  const [student, faculty, clubAdmin, admin] = demoUsers;

  console.log('[Seed] Creating additional students...');
  const names = ['Priya Patel', 'Karan Mehta', 'Ishita Rao', 'Arjun Singh', 'Sneha Gupta', 'Vikram Joshi'];
  const extraStudents = await User.create(
    names.map((name, i) => ({
      name,
      email: `student${i + 1}@campusconnect.demo`,
      password: DEMO_PASSWORD,
      role: 'student',
      department: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'][i % 4],
      semester: (i % 8) + 1,
      rollNumber: `STU${1000 + i}`,
      skills: [['react', 'aws'], ['python', 'ml'], ['java', 'spring'], ['figma', 'design']][i % 4],
    }))
  );
  const allStudents = [student, ...extraStudents];

  console.log('[Seed] Creating clubs...');
  const clubs = await Club.create([
    { name: 'Coding Club', description: 'Weekly DSA practice, hackathons, and open-source sprints.', admins: [clubAdmin._id], facultyCoordinator: faculty._id, category: 'Technical', memberCount: 3 },
    { name: 'Photography Society', description: 'Capturing campus life, one frame at a time.', admins: [clubAdmin._id], category: 'Cultural', memberCount: 2 },
    { name: 'Robotics Club', description: 'Building bots for inter-college competitions.', admins: [clubAdmin._id], facultyCoordinator: faculty._id, category: 'Technical', memberCount: 1 },
  ]);

  await ClubMember.create(
    allStudents.slice(0, 4).map((u, i) => ({ club: clubs[i % clubs.length]._id, user: u._id, status: 'approved', decidedBy: clubAdmin._id, decidedAt: new Date() }))
  );

  console.log('[Seed] Creating events...');
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await Event.create([
    { title: 'HackCampus 2026', description: '24-hour hackathon with prizes and mentorship.', organizer: clubAdmin._id, club: clubs[0]._id, category: 'Hackathon', date: new Date(now + 10 * day), time: '09:00 AM', venue: 'Main Auditorium', capacity: 150, registeredCount: 42, mapLocation: { lat: 28.6129, lng: 77.2295, address: 'Main Campus Auditorium' } },
    { title: 'Intro to Cloud Computing', description: 'Hands-on AWS workshop for beginners.', organizer: faculty._id, category: 'Workshop', date: new Date(now + 4 * day), time: '02:00 PM', venue: 'CS Lab 2', capacity: 40, registeredCount: 40, mapLocation: { lat: 28.6139, lng: 77.209, address: 'CS Building, Lab 2' } },
    { title: 'Annual Cultural Fest', description: 'Music, dance, and drama competitions.', organizer: faculty._id, category: 'Cultural', date: new Date(now + 20 * day), time: '05:00 PM', venue: 'Open Air Theatre', capacity: 500, registeredCount: 120 },
  ]);

  console.log('[Seed] Creating posts...');
  await Post.create([
    { author: student._id, content: 'Just wrapped up our Coding Club hackathon prep session — feeling ready for HackCampus! 🚀', category: 'Event' },
    { author: extraStudents[0]._id, content: 'Anyone have notes for Data Structures Unit 3? Struggling with AVL trees.', category: 'Academic' },
    { author: faculty._id, content: 'Reminder: Mid-sem exams begin next Monday. Check the portal for your seating arrangement.', category: 'Announcement' },
    { author: extraStudents[1]._id, content: 'Won first place at the regional robotics meet with the Robotics Club team! 🏆', category: 'Achievement' },
  ]);

  console.log('[Seed] Creating complaints (with computed priority)...');
  const complaintDefs = [
    { title: 'Wi-Fi down in Hostel Block C', description: 'No internet connectivity since this morning, affects the whole block.', category: 'Wi-Fi', severity: 'high', affectedCount: 120, createdBy: extraStudents[0]._id },
    { title: 'Broken fan in Room 204', description: 'Ceiling fan makes loud noise and barely spins.', category: 'Classroom', severity: 'low', affectedCount: 1, createdBy: extraStudents[1]._id },
    { title: 'Water leakage near library entrance', description: 'Puddle forming near the main library entrance, slippery floor.', category: 'Water', severity: 'medium', affectedCount: 30, createdBy: extraStudents[2]._id },
  ];
  for (const def of complaintDefs) {
    const { priority } = calculatePriority(def);
    await Complaint.create({
      ...def,
      priority,
      statusHistory: [{ status: 'Submitted', changedBy: def.createdBy, note: 'Complaint submitted' }],
    });
  }

  console.log('[Seed] Creating marketplace listings...');
  await MarketplaceItem.create([
    { title: 'Used Data Structures Textbook', description: 'Cormen, lightly highlighted, great condition.', price: 350, category: 'Books', condition: 'Good', seller: extraStudents[0]._id },
    { title: 'Study Table + Chair', description: 'Moving out sale, pickup only.', price: 1200, category: 'Furniture', condition: 'Fair', seller: extraStudents[1]._id },
    { title: 'Hero Cycle', description: 'Barely used, great for campus commute.', price: 2500, category: 'Cycles', condition: 'Like New', seller: extraStudents[2]._id },
  ]);

  console.log('[Seed] Creating lost & found items...');
  await LostFoundItem.create([
    { type: 'Lost', title: 'Black wallet', description: 'Lost near the cafeteria, has college ID inside.', category: 'Personal Items', date: new Date(now - 2 * day), contactInfo: student.email, createdBy: student._id },
    { type: 'Found', title: 'Blue umbrella', description: 'Found in Lecture Hall 3.', category: 'Personal Items', date: new Date(now - 1 * day), contactInfo: extraStudents[3].email, createdBy: extraStudents[3]._id },
  ]);

  console.log('[Seed] Creating resources...');
  await Resource.create([
    { title: 'DSA Unit 3 Notes - Trees', subject: 'Data Structures', semester: 3, department: 'Computer Science', uploadedBy: faculty._id, file: { url: 'https://example.com/placeholder.pdf', fileType: 'pdf' }, tags: ['dsa', 'trees'], downloads: 34 },
    { title: 'OS Previous Year Papers', subject: 'Operating Systems', semester: 5, department: 'Computer Science', uploadedBy: extraStudents[0]._id, file: { url: 'https://example.com/placeholder.pdf', fileType: 'pdf' }, tags: ['os', 'pyq'], downloads: 58 },
  ]);

  console.log('[Seed] Creating opportunities...');
  await Opportunity.create([
    { title: 'SDE Intern', company: 'TechNova Inc.', type: 'Internship', description: 'Summer internship working on backend systems.', skillsRequired: ['node', 'react'], applyLink: 'https://example.com/apply', postedBy: faculty._id, deadline: new Date(now + 30 * day) },
    { title: 'ML Research Assistant', company: 'DataMinds Lab', type: 'Part-Time Job', description: 'Assist with data labeling and model evaluation.', skillsRequired: ['python', 'ml'], applyLink: 'https://example.com/apply', postedBy: faculty._id },
  ]);

  console.log('\n[Seed] Done! Demo accounts (all use password: ' + DEMO_PASSWORD + '):');
  console.log('  Student:    student@campusconnect.demo');
  console.log('  Faculty:    faculty@campusconnect.demo');
  console.log('  Club Admin: clubadmin@campusconnect.demo');
  console.log('  Superadmin: admin@campusconnect.demo');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
