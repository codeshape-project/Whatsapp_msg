
import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import DepartmentContacts from "./pages/DepartmentContacts";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import ScheduledMessages from "./pages/ScheduledMessages";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MasterManagement from "./pages/MasterManagement";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="min-w-0 pt-16 lg:pl-52">
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/master-management"
          element={<MasterManagement />}
        />

        {/* Existing page: shows all contacts */}
        <Route path="/contacts" element={<Contacts />} />

        {/* New page: shows contacts for a selected department */}
        <Route
          path="/department-contacts"
          element={<DepartmentContacts />}
        />

        <Route path="/templates" element={<Templates />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/scheduled" element={<ScheduledMessages />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
