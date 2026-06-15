'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WorkspaceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CampaignIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="nav-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const XLogo = () => (
  <svg viewBox="0 0 24 24" fill="white">
    <path d="M13.6 12L20 4H17.5L12.4 9.8 8.1 4H2L8.7 13.3 2 22H4.5L10 15.8 14.6 22H21L13.6 12ZM5.4 5.8H7.2L17.6 20.3H15.8L5.4 5.8Z"/>
  </svg>
);

const navItems = [
  { href: '/',           label: 'Workspace', Icon: WorkspaceIcon },
  { href: '/campaigns',  label: 'Campaigns', Icon: CampaignIcon  },
  { href: '/analytics',  label: 'Analytics', Icon: AnalyticsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '20px 18px 16px' }}>
        <img src="/xeno-logo.png" alt="xenopulse" style={{ height: '38px', objectFit: 'contain' }} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item${active ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* AI Status */}
      <div className="sidebar-footer">
        <div className="ai-status">
          <div className="status-avatar">
            N
            <span className="status-dot" />
          </div>
          <span className="ai-status-text">AI Connected</span>
        </div>
      </div>
    </aside>
  );
}
