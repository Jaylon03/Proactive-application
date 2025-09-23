// app/layout.tsx
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/app/hooks/useAuth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EarlyJob Alerts - Get Job Alerts Before Anyone Else',
  description: 'Track your target companies and get notified when they\'re about to hire. Access hiring signals, employee connections, and referral opportunities before jobs are posted publicly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}