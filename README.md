# CampusConnect

A centralized, full-stack **MERN** platform for college campuses — social feed, complaints, events, clubs,
lost & found, notes sharing, a peer-to-peer marketplace, an opportunities board, real-time chat, and an
admin analytics dashboard, all under one roof.

> **Note on scope**: this repository is a genuine, working full-stack implementation of the core
> architecture and workflows described below — not a mockup. A handful of things you'd do before a real
> production launch (full test coverage on every endpoint, a CI pipeline, a design pass on every screen,
> live deployment) are called out explicitly in [Future Improvements](#future-improvements) rather than
> silently assumed.

---

## Problem Statement

Campus life runs across a dozen disconnected channels — WhatsApp groups for lost items, email threads for
complaints, a noticeboard for events, word-of-mouth for marketplace deals. CampusConnect consolidates these
into one platform with proper roles, workflows, and real-time updates, so students, faculty, club admins,
and the administration all work from the same source of truth.

## Key Features

- **Auth & RBAC** — JWT-based auth, bcrypt password hashing, 4 roles (student, faculty, club admin,
  superadmin), password reset via email, protected routes on both API and UI.
- **Campus Social Feed** — posts with images, likes, comments, sharing, reporting, category filters, and a
  trending sort backed by a MongoDB aggregation on engagement.
- **Complaint System with Smart Priority** — a 6-stage status workflow (Submitted → Under Review → Assigned
  → In Progress → Resolved → Closed) with a full audit timeline, plus a rules-based priority engine that
  scores category, severity, people affected, and time pending — staff can override the result.
- **Events** — capacity-safe registration using a MongoDB transaction (so two people can't grab the last
  seat in a race condition), organizer tools, and a live seats-remaining counter.
- **Clubs** — discovery, join requests with admin approval/rejection, member management, and announcements
  that fan out as real-time notifications.
- **Lost & Found** — post/claim/resolve workflow with search and filtering by category, location, and
  status.
- **Notes & Resources** — uploads to Cloudinary, ratings, download counters, bookmarking, search/sort.
- **Marketplace** — campus-only listings with a built-in "contact seller" flow that opens a real-time chat
  thread (no payment processing, by design).
- **Opportunities Board** — internships/jobs/hackathons with skill-based matching that notifies students
  automatically when something fits their profile.
- **Real-Time Chat & Notifications** — Socket.IO-powered 1:1 chat with typing indicators, read receipts,
  and online presence; a notification system that writes to MongoDB and pushes live over the same socket.
- **Admin Analytics** — user growth, complaint trends & resolution time, event registration stats, popular
  categories, and marketplace/lost-found activity, all computed with MongoDB aggregation pipelines (not
  loaded client-side).
- **Global Search** — one search bar across students, posts, events, clubs, notes, marketplace, and
  opportunities, resolved server-side.

## Tech Stack

**Frontend:** React 19, React Router, Tailwind CSS v4, Axios, Recharts, Socket.IO client, Lucide icons
**Backend:** Node.js, Express, JWT, bcrypt, express-validator, Socket.IO
**Database:** MongoDB + Mongoose (MongoDB Atlas in production)
**Other:** Cloudinary (file storage), Nodemailer (email), Jest + Supertest (testing)

## Architecture

```
Browser (React SPA)
   │  REST (Axios, JWT bearer)         │  WebSocket (Socket.IO, JWT handshake)
   ▼                                    ▼
Express API  ──────────────────────────┴──► Socket.IO server (shared HTTP server)
   │
   ├── Mongoose models ──► MongoDB Atlas
   ├── Cloudinary (images, PDFs, PPTs)
   └── Nodemailer (SMTP) for transactional email
```

The frontend never talks to MongoDB or Cloudinary directly — every read/write goes through the REST API
(or Socket.IO for chat), so authorization is enforced in exactly one place.

## Folder Structure

```
campusconnect/
├── backend/
│   ├── config/          # DB + Cloudinary configuration
│   ├── controllers/     # Business logic per resource
│   ├── middleware/       # auth, roles, errors, validation, uploads
│   ├── models/           # 18 Mongoose schemas
│   ├── routes/           # Express routers, one per resource
│   ├── sockets/           # Socket.IO connection + chat event handlers
│   ├── utils/             # token/email/notification/priority helpers
│   ├── seed/              # database seed script
│   ├── tests/              # Jest + Supertest
│   ├── app.js               # Express app (middleware + routes)
│   └── server.js             # HTTP server + Socket.IO bootstrap
└── frontend/
    └── src/
        ├── components/    # Reusable UI (Button, Card, Modal, Sidebar, ...)
        ├── pages/          # One file per route
        ├── layouts/         # AuthLayout, DashboardLayout
        ├── context/          # AuthContext, SocketContext
        ├── services/          # Axios instance + typed endpoint wrappers
        ├── routes/             # ProtectedRoute (RBAC-aware)
        └── utils/               # module color system, helpers
```

## Database Design (high level)

- **User** is the hub: referenced by almost everything else (`createdBy`, `author`, `seller`, `organizer`, …).
- **Complaint** embeds its own `statusHistory[]` for a full audit trail without a join.
- **ClubMember** and **EventRegistration** are join tables between `User` and `Club`/`Event`, so membership
  and registration state doesn't bloat the parent document.
- **Notification** and **Message** are recipient/conversation-indexed for fast unread-count and
  chat-history queries.
- Indexes: text indexes on searchable fields (posts, events, clubs, resources, marketplace, lost & found,
  opportunities, users) power the global search without scanning full collections; compound indexes on
  `(club, user)` and `(event, user)` enforce one-membership/one-registration-per-user at the DB level.

## Authentication Flow

1. `POST /api/auth/register` or `/login` → server verifies credentials, signs a JWT (`jsonwebtoken`), and
   returns it both as an httpOnly cookie and in the JSON body (so both browser-cookie flows and
   token-in-header flows work).
2. The Axios instance attaches `Authorization: Bearer <token>` from `localStorage` on every request.
3. `authMiddleware.protect` verifies the token, loads the user, and rejects suspended/deactivated accounts.
4. `roleMiddleware.authorize(...roles)` gates specific routes (e.g. only `faculty`/`clubadmin`/`superadmin`
   can create events).
5. Socket.IO connections authenticate the same JWT via the `auth` handshake payload before any event
   handler runs.

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- (Optional for full functionality) a Cloudinary account and an SMTP account (e.g. Gmail app password)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET, etc.
npm run seed             # creates demo accounts + sample data
npm run dev               # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # defaults already point at localhost:5000
npm run dev                # starts on http://localhost:5173
```

### Demo Accounts
All seeded accounts use the password `Password123!`:

| Role        | Email                          |
|-------------|---------------------------------|
| Student     | student@campusconnect.demo      |
| Faculty     | faculty@campusconnect.demo      |
| Club Admin  | clubadmin@campusconnect.demo    |
| Superadmin  | admin@campusconnect.demo        |

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. At minimum you need:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — the frontend origin, for CORS and email links

Cloudinary and SMTP variables are optional in development: file uploads will fail gracefully with a clear
error, and emails are skipped with a console warning rather than crashing the request, so you can develop
the rest of the app without setting them up immediately.

## Running Tests

```bash
cd backend
npm test
```

Covers registration/login, protected-route enforcement, role-based authorization (e.g. a student cannot
create an event; a superadmin can view analytics), the event-capacity race-condition guard, and the smart
complaint-priority engine.

> Tests use `mongodb-memory-server` to spin up an isolated in-memory MongoDB instance — no real database or
> internet access is required to run them, aside from the one-time binary download the library performs on
> first run.

## Deployment

- **Frontend** → Vercel (`vercel.json` not included; default Vite build settings work out of the box —
  build command `npm run build`, output directory `dist`).
- **Backend** → Render or Railway (set the environment variables above; the server binds to
  `process.env.PORT`).
- **Database** → MongoDB Atlas (whitelist your backend host's IP, or `0.0.0.0/0` for simplicity in a demo).
- **File storage** → Cloudinary (no server-side disk storage is used, so this works on ephemeral hosts).

Remember to set `CLIENT_URL` on the backend to your deployed frontend URL (for CORS) and `VITE_API_URL` /
`VITE_SOCKET_URL` on the frontend to your deployed backend URL.

## Future Improvements

- Expand automated test coverage to every controller (current suite focuses on auth/RBAC/priority/event
  capacity as the highest-risk logic).
- Add a CI pipeline (GitHub Actions) running lint + tests on every PR.
- Introduce a job queue (e.g. BullMQ) for notification fan-out at scale, instead of synchronous loops.
- Add end-to-end tests (Playwright/Cypress) for the critical user journeys.
- Move from polling-free but still occasionally chatty REST calls to a bit more aggressive client-side
  caching (React Query) for a snappier feel on slow connections.
- Add refresh tokens / token rotation instead of a single long-lived JWT.
- Dark mode toggle (the design tokens already separate color intent from hex values, so this is mostly a
  CSS variable swap away).

## Interview Talking Points

- **Why MongoDB?** The domain is naturally document-shaped (a complaint's status history, a club's
  announcements) and the schema evolves per-module without cross-module migrations; Mongoose gives
  application-level validation while keeping that flexibility.
- **RBAC** is enforced with two small, composable middlewares (`authorize`, `authorizeOwnerOrRoles`) rather
  than scattering `if (user.role !== ...)` checks through controllers.
- **Smart priority** is intentionally a transparent, tunable rules engine (see
  `backend/utils/calculatePriority.js`) rather than a black-box model — it's explainable to a non-technical
  admin and easy to extend with a trained classifier later using the same feature set.
- **Scaling**: read-heavy list endpoints are paginated and indexed; the event-registration race condition
  is closed with a MongoDB transaction + atomic `$expr` guard rather than an application-level lock; the
  notification fan-out is the first thing that would move to a queue under real load.
