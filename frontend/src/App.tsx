import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ValidationQueue } from './pages/ValidationQueue';
import { NewValidation } from './pages/NewValidation';
import { DocumentReviewer } from './pages/DocumentReviewer';
import { AuditTrail } from './pages/AuditTrail';
import { ChecklistsRules } from './pages/ChecklistsRules';
import { IssuingAuthorities } from './pages/IssuingAuthorities';
import { Alerts } from './pages/Alerts';

export const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen flex text-[#171827]">
        {/* Persistent Desktop & Collapsible Mobile Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          alertsCount={5}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <TopHeader
            onMenuClick={() => setSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<ValidationQueue searchQuery={searchQuery} />} />
              <Route path="/new-validation" element={<NewValidation />} />
              <Route path="/reviewer/:id" element={<DocumentReviewer />} />
              <Route path="/reviewer" element={<Navigate to="/reviewer/EoA-2026-00418" replace />} />
              <Route path="/audit-trail" element={<AuditTrail />} />
              <Route path="/rules" element={<ChecklistsRules />} />
              <Route path="/authorities" element={<IssuingAuthorities />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
