'use client';
import { useState, useEffect } from 'react';
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

const navItems = [
  { href: '/',           label: 'Workspace', Icon: WorkspaceIcon },
  { href: '/campaigns',  label: 'Campaigns', Icon: CampaignIcon  },
  { href: '/analytics',  label: 'Analytics', Icon: AnalyticsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const loadRecentChats = () => {
    if (typeof window !== 'undefined') {
      const chats = JSON.parse(sessionStorage.getItem('xp_recent_chats') || '[]');
      const activeId = sessionStorage.getItem('xp_current_chat_id');
      setRecentChats(chats);
      setCurrentChatId(activeId);
    }
  };

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Sync recent chats on mount & update events
  useEffect(() => {
    loadRecentChats();

    window.addEventListener('xp_recent_chats_updated', loadRecentChats);
    return () => {
      window.removeEventListener('xp_recent_chats_updated', loadRecentChats);
    };
  }, []);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay backdrop — visible only when mobile sidebar is open */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Close button — visible only on mobile */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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

        {/* Recent Chats Section */}
        {recentChats.length > 0 && (
          <div className="recent-chats-section border-t border-[var(--border)] pt-4 px-3.5 pb-2 flex flex-col gap-1.5 mt-auto">
            <div className="recent-chats-header text-[10.5px] font-bold text-[var(--text-3)] uppercase tracking-wider px-3 mb-1">
              Recent Chats
            </div>
            <div className="recent-chats-list flex flex-col gap-1 overflow-y-auto max-h-[200px] pr-1">
              {recentChats.map((chat) => {
                const active = currentChatId === chat.id && pathname === '/';
                return (
                  <Link
                    key={chat.id}
                    href="/"
                    onClick={(e) => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('xp_current_chat_id', chat.id);
                        window.dispatchEvent(new Event('xp_recent_chats_updated'));
                        window.dispatchEvent(new Event('xp_active_chat_changed'));
                      }
                      if (pathname === '/') {
                        e.preventDefault();
                      }
                    }}
                    className={`recent-chat-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] hover:translate-x-0.5 transition-all duration-200 ${active ? 'bg-[var(--brand-light)] text-[var(--brand)] font-semibold' : ''}`}
                  >
                    <span className="recent-chat-icon text-[13px] flex-shrink-0">💬</span>
                    <span className="recent-chat-title truncate flex-1" title={chat.title}>
                      {chat.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

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
    </>
  );
}
