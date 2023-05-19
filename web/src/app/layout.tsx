import '@aws-amplify/ui-react/styles.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'

import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'
import config from '@/lib/config'
import { ReactChildren } from '@/lib/types'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.siteName,
  description: config.siteDescription,
}

export default function RootLayout({ children }: ReactChildren) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
