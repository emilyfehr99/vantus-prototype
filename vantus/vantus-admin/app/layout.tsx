import type { Metadata } from 'next'
import './globals.css'
import SystemMessageTerminal from '../components/SystemMessageTerminal'

export const metadata: Metadata = {
  title: 'Vantus Admin',
  description: 'Vantus Administration Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen relative overflow-hidden">
        {children}
        <SystemMessageTerminal />
      </body>
    </html>
  )
}
