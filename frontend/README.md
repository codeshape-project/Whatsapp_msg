# Codeshape Hospital – WhatsApp Bulk Messaging (Frontend)

React + Vite + Tailwind CSS. All data is dummy data (`src/data/dummyData.js`, served through `src/services/api.js`).

## Run
```bash
npm install
npm run dev
```
Open http://localhost:5173 – the login page opens first. Any email and password (even empty) logs you in.

## Structure
```
src/
  components/  Sidebar, Navbar, Layout, DataTable, Modal, StatCard, charts...
  pages/       Login, Dashboard, Contacts, Templates, Campaigns, ScheduledMessages, Reports, Settings
  services/    api.js  (dummy API – swap in real fetch calls later)
  hooks/       useAuth, useFetch, useModal
  data/        dummyData.js
  App.jsx      Routing
```
