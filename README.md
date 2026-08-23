# 🌸 Pooja Flower — Garland Task & Earnings Management Software

A full-stack (React + Express + MongoDB) application for tracking flower-garland
production work, daily quantities, automatic earnings calculation, payments, and
printable/PDF owner statements. Supports English and Kannada.

---

## 1. What's included

```
Pooja-Flower/
├── backend/     Node.js + Express + MongoDB (Mongoose) REST API, JWT auth
├── frontend/    React (Vite) + Tailwind CSS dashboard, i18n (en/kn), charts, PDF export
└── README.md
```

**Real, wired-up functionality — no mock data.** Every number on the dashboard,
every task total, and every report is computed from your MongoDB data via the
backend APIs. The `backend/scripts/seed.js` script is optional and only for
local testing — it is never run automatically.

### Honesty note on testing
This code was written and syntax/build-checked (both `npm install` and
`npm run build` succeed cleanly, and the calculation/naming utilities were
unit-tested), but it has **not** been exercised end-to-end against a live
MongoDB instance and a running browser session, since no database server was
available in the environment this was built in. Please treat first run as a
"final integration" step — if anything doesn't behave as expected, the most
likely culprits are environment variables (below) or a MongoDB connection
issue, not the application logic itself.

---

## 2. Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either:
  - **Local MongoDB**: install MongoDB Community Server and run it locally, or
  - **MongoDB Atlas** (free tier works fine): https://www.mongodb.com/cloud/atlas

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in:

```
PORT=5000
NODE_ENV=development

# Local example:
MONGO_URI=mongodb://127.0.0.1:27017/pooja-flower
# OR Atlas example:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pooja-flower

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate a strong `JWT_SECRET` quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start the backend:

```bash
npm run dev
```

You should see:
```
MongoDB connected: ...
Pooja Flower API running on http://localhost:5000
```

Optional: seed a demo user/master/task for local testing (safe, does nothing
in production, never runs automatically):
```bash
npm run seed
# creates demo@poojaflower.test / password123
```

---

## 4. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should point at your backend:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Open **http://localhost:5173** — register a new account (or log in with the
seed account if you ran `npm run seed`), and start creating masters and tasks.

---

## 5. Production build

```bash
cd frontend
npm run build
```
This outputs static files to `frontend/dist/`, which can be deployed to any
static host (Vercel, Netlify, Nginx, etc.) — just make sure `VITE_API_URL`
points at your deployed backend.

For the backend in production, set `NODE_ENV=production`, use a process
manager (pm2, systemd, Docker), and make sure `CLIENT_URL` matches your
deployed frontend origin for CORS.

---

## 6. Core feature walkthrough

1. **Register / Login** — JWT-based auth, passwords hashed with bcrypt.
2. **Masters** (`/masters`) — create a garland type with a name, price, and
   unit (Piece/KG/Meter/etc.). Deleting a master that's already used by a
   task archives it instead of destroying history.
3. **Create Task** (`/tasks/create`) — pick a master, a day count (7/10/15/30/60
   or custom), and a start date. The backend auto-generates one daily-record
   placeholder per day and snapshots the master's current price/unit onto the
   task, so later price changes never retroactively affect existing tasks.
4. **Task Detail** (`/tasks/:id`) — enter the quantity for each day; the
   amount (`quantity × rate`) is always recalculated **server-side**, never
   trusted from the browser. Mark days completed/missed, record payments,
   download a PDF statement, print, or share (uses the Web Share API on
   supported devices, otherwise falls back to clipboard copy).
5. **Payments** — global view across all tasks with totals and per-task
   payment status (Pending / Partially Paid / Paid). Advance payments (paid >
   earned) are blocked unless explicitly allowed per-payment.
6. **Dashboard** — real MongoDB aggregation queries power every stat card and
   chart (earnings over time, quantity, task-status pie chart, recent
   activity feed).
7. **Reports** — monthly summary + a sortable/exportable table of every task
   (CSV export included).
8. **Settings** — business name, contact info, and report branding fields
   used on generated PDF statements.
9. **Language switcher** (header, top-right) — toggles the entire UI between
   English and ಕನ್ನಡ (Kannada) using `react-i18next`, backed by
   `frontend/src/locales/en.json` and `kn.json`.

---

## 7. API overview

All routes are prefixed with `/api` and (except auth) require a
`Authorization: Bearer <token>` header.

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/me

GET    /api/masters            POST /api/masters
GET    /api/masters/:id        PUT /api/masters/:id       DELETE /api/masters/:id

GET    /api/tasks              POST /api/tasks
GET    /api/tasks/:id          PUT /api/tasks/:id         DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status

GET    /api/tasks/:taskId/days                 POST /api/tasks/:taskId/days
PUT    /api/tasks/:taskId/days/:dayId          DELETE /api/tasks/:taskId/days/:dayId

GET    /api/tasks/:taskId/payments             POST /api/tasks/:taskId/payments
PUT    /api/payments/:id                       DELETE /api/payments/:id

GET    /api/dashboard/stats
GET    /api/dashboard/earnings?range=7d|30d|3m|6m|1y|all
GET    /api/dashboard/quantity
GET    /api/dashboard/task-status
GET    /api/dashboard/payment-summary
GET    /api/dashboard/recent-activity

GET    /api/reports/task/:id
GET    /api/reports/daily?date=YYYY-MM-DD
GET    /api/reports/monthly?year=&month=
```

---

## 8. Troubleshooting

- **"MongoDB connection error"** — check `MONGO_URI` in `backend/.env`. For
  Atlas, make sure your current IP is allow-listed under Network Access.
- **CORS errors in the browser console** — make sure `CLIENT_URL` in
  `backend/.env` exactly matches the URL the frontend is served from.
- **401 / logged out unexpectedly** — the JWT may have expired
  (`JWT_EXPIRES_IN`), or `JWT_SECRET` was changed after tokens were issued.
- **Kannada text not rendering nicely** — the app loads the "Noto Sans
  Kannada" web font in `index.html`; confirm you have internet access to
  Google Fonts in the browser you're testing in.

---

## 9. What's intentionally scoped down from the original spec

To ship a genuinely working, coherent codebase rather than a pile of stubs,
a few of the more exotic asks were simplified or omitted, and can be added
incrementally on this foundation:

- The **image-report generator** (a rendered PNG statement card) is not
  included; PDF download, print, and text-summary share cover the same
  "send this to an owner" use case.
- **Multer/logo upload** dependency is included on the backend but no
  upload route/UI is wired up yet — `logoUrl` is a plain text field in
  Settings for now.
- Backend **rate limiting** and **helmet** are configured on the whole app
  and specifically on auth routes, but no CAPTCHA/2FA.
- The **forgot-password** flow returns the reset token directly in the API
  response (since no transactional email service is configured) rather than
  emailing it — wire up an email provider (SendGrid, SES, etc.) to complete
  that flow for production use.
