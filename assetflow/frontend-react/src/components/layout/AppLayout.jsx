import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-wrapper">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

// Page container wrapper
export function PageContainer({ title, subtitle, actions, children }) {
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--text-color)' }}>{title}</h2>
          {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
