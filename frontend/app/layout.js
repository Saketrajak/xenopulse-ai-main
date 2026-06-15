import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'XenoPulse AI — AI Marketing Copilot',
  description: 'AI-powered CRM and marketing campaign platform. Segment customers, launch campaigns, and track conversions — all in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }} className={inter.variable}>
        <div className="app-shell">
          <Sidebar />
          <div className="page-main">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

