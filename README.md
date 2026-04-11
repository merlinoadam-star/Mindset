# Mindset — Youth Athlete App

A gamified mindset & habit tracker for youth athletes. Built for wrestlers and
volleyball players.

## Phase 1 — What's in here

Single-device web app with:

- **Onboarding** — name, sport (wrestling or volleyball), age, grade
- **XP + levels** — every action earns XP, levels unlock titles like *Rookie
  Mat Rat → Varsity Starter → Champion*
- **Daily habit tracker** — sport-specific habits across skill, physical,
  mental, and recovery categories
- **Practice log** — type, duration, intensity, notes; XP scales with effort
- **Mindset check-in** — mood, gratitude, daily goal
- **Streak tracking** — stay active every day, don't break the chain
- **Badges** — 13 unlockable badges for streaks, level milestones, perfect
  days, mental training, and more

Data is saved in the browser (`localStorage`). Phase 2 will add cloud sync
and a parent view on a second device.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech

- Vite + React 19 + TypeScript
- Tailwind CSS
- React Router
- Lucide icons
- `localStorage` for persistence
