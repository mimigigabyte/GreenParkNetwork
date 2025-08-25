import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '国家级经开区绿色低碳技术推广平台 - National Economic Development Zone Green Low-Carbon Technology Promotion Platform',
  description: '国家级经开区绿色低碳技术推广平台，推动可持续发展，共建绿色未来',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 