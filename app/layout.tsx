// Minimal root layout — locale-specific config lives in app/[locale]/layout.tsx
import './globals.css';
// Geen `Geist` meer: de const werd nergens toegepast, maar `next/font` zette hem wél als
// preload (29 KB) in de kop van élke pagina.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
