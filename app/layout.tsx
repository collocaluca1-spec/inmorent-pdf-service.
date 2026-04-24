import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InmoRent · PDF Service',
  description: 'Preview de informes comerciales locativos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}