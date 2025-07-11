import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../src/hooks/useAuth'

export const metadata: Metadata = {
  title: 'FlexFit - Your AI-Powered Fitness Journey',
  description: 'Track workouts, get personalized recommendations, and achieve your fitness goals with our intelligent assistant.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
