# Bot Login Harian

## Goal
Sistem bot login harian: NestJS backend + React panel + Playwright headless automation, dengan queue system max 10 concurrent workers.

## Tasks
- [ ] Task 1: Init NestJS project → `cd backend && npm run start:dev` returns 200
- [ ] Task 2: Setup Prisma + PostgreSQL schema → `npx prisma migrate dev` sukses
- [ ] Task 3: Build Account module (CRUD) → `curl POST/GET /api/accounts` works
- [ ] Task 4: Build Worker + Queue Manager → start/stop workers via API, max 10 concurrent
- [ ] Task 5: Build Playwright automation flow → login/wait/logout di headless browser
- [ ] Task 6: Build Log module → `GET /api/logs` returns activity per akun
- [ ] Task 7: Build Settings module → `GET/PUT /api/settings` for wait time, selectors
- [ ] Task 8: Init React Vite project → `cd frontend && npm run dev` loads panel
- [ ] Task 9: Build Dashboard + Account + Log + Settings pages → full CRUD dari panel
- [ ] Task 10: Integration test → queue 15 akun, 10 jalan, 5 antri, auto-proceed

## Done When
- [ ] API CRUD account works
- [ ] Queue runs max 10, auto-continues
- [ ] Logs visible per account in panel
- [ ] Settings configurable from panel

## Notes
- CSS selectors untuk form login akan diberikan user nanti
- UI design detail akan diberikan user nanti
- PostgreSQL harus sudah terinstall & accessible
