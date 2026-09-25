import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASRC TECH WATCH',
  description: 'Veille technologique Systèmes, Réseaux & Cybersécurité — H1 / H2 / H3'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
