import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
      background: '#f2f4f7',
      gap: 16,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117' }}>
        InmoRent · PDF Service
      </h1>
      <p style={{ fontSize: 13, color: '#8890a4' }}>
        Previews disponibles:
      </p>
      <Link
        href="/preview/locativo-demo"
        style={{
          background: '#0f1117',
          color: 'white',
          padding: '10px 24px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Informe Locativo — Demo →
      </Link>
    </main>
  );
}