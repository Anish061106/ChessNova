# ♟️ ChessNova

> **A modern digital chess universe where players compete, learn, analyze, and improve.**

ChessNova is a production-grade full-stack online chess platform built with modern web technologies, offering low-latency gameplay architecture, sleek cosmic visual branding, responsive ergonomics, and robust developer toolchains.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with centralized theme system & custom cosmic palette
- **Routing**: [React Router 6](https://reactrouter.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+)
- **Framework**: [Express](https://expressjs.com/) with TypeScript
- **Real-time Engine**: [Socket.IO](https://socket.io/)
- **Database ORM**: [Prisma](https://www.prisma.io/) (PostgreSQL-ready)
- **Testing**: [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest)

---

## 📁 Project Structure

```text
ChessNova/
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── assets/             # Brand logos & icons (SVG)
│   │   ├── components/         # Reusable UI components & layouts
│   │   │   ├── brand/          # ChessNovaLogo, ChessNovaIcon
│   │   │   ├── common/         # ErrorBoundary, PageShell, ThemeToggle
│   │   │   └── ui/             # Button, Card, Input, Badge, Modal, Toast
│   │   ├── layouts/            # MainLayout (Responsive Sidebar), AuthLayout
│   │   ├── pages/              # Home, Play, Puzzles, Learn, Watch, Leaderboard, Friends, Games, Profile, Settings, Login, Register
│   │   ├── store/              # Zustand theme store (dark, light, system)
│   │   ├── utils/              # Utility functions (cn, clsx)
│   │   ├── App.tsx             # Application router
│   │   └── main.tsx            # DOM root mounting
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                     # Backend Express + Socket.IO server
│   ├── src/
│   │   ├── controllers/        # Health and API controllers
│   │   ├── middleware/         # Error handling, 404, CORS
│   │   ├── routes/             # API routing (/api/health)
│   │   ├── socket/             # Socket.IO connection handling
│   │   ├── utils/              # Configuration & structured logger
│   │   ├── app.ts              # Express application factory
│   │   └── index.ts            # Server entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/
│   └── schema.prisma           # Prisma baseline configuration
├── .env.example                # Example environment variables
├── .gitignore
├── package.json                # Monorepo orchestration scripts
└── README.md
```

---

## ⚙️ Requirements

- **Node.js**: `v20.0.0` or higher (verified on v22.19.0)
- **npm**: `v10.0.0` or higher
- **PostgreSQL** (optional for Phase 1, required for Phase 3+ database migrations)

---

## 🛠️ Installation

Clone the repository and install all dependencies:

```bash
# Install root, client, and server dependencies
npm run install:all
```

Or install individually:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

---

## 🔑 Environment Variables

Copy `.env.example` to configure local variables:

```bash
cp .env.example .env
```

Default variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Client
CLIENT_URL=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chessnova?schema=public

# Security
JWT_SECRET=your_jwt_secret_key_placeholder
```

---

## 💻 Development Commands

Run both backend and frontend concurrently:

```bash
npm run dev
```

Run individually:

```bash
# Frontend development server (Vite on http://localhost:5173)
npm run dev:client

# Backend development server (Express + Socket.IO on http://localhost:5000)
npm run dev:server
```

---

## 🗄️ Database Setup

Generate Prisma Client:

```bash
npm --prefix server run prisma:generate
```

---

## 🧪 Testing

Run comprehensive automated test suites across both client and server:

```bash
# Run all tests
npm test

# Run frontend tests only (Vitest + React Testing Library)
npm --prefix client test

# Run backend tests only (Vitest + Supertest)
npm --prefix server test
```

Typecheck without emitting:

```bash
npm run typecheck
```

---

## 📦 Production Build

Build both client and server:

```bash
npm run build
```

This compiles:
- `client/dist/` — Optimized production web bundle
- `server/dist/` — Compiled TypeScript output for Node.js

---

## 🗺️ Roadmap & Phases

- **Phase 1 (Completed)**: Project Foundation, Branding, Theme Engine, Layouts, API & Socket.IO Foundation, Test Suite.
- **Phase 2 (Upcoming)**: Professional Interactive Chess Board, Chess.js rule validation, move sound effects, clock timers.
- **Phase 3**: User Authentication, PostgreSQL & Prisma migrations, Player Profiles.
- **Phase 4**: Real-time Multiplayer, Socket.IO Matchmaking & Rooms.
- **Phase 5**: Stockfish Engine Integration & Interactive Game Analysis.
- **Phase 6**: Puzzles, Friends, Social Hub & Leaderboards.
