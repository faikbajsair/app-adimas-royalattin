import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal KB-TK Royal Attin - Islamic Character School',
  description: 'Portal resmi KB-TK Royal Attin. Menghubungkan orang tua, guru, pelamar, dan yayasan dalam satu platform terintegrasi dengan database Google Sheets & Vercel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
