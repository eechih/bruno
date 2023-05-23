import '@aws-amplify/ui-react/styles.css'
import { Metadata } from 'next'
import { Roboto } from 'next/font/google'

import AppDrawer from '@/components/AppDrawer'
import config from '@/lib/config'
import { ReactChildren } from '@/lib/types'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: config.siteName,
  description: config.siteDescription,
}

export default function RootLayout({ children }: ReactChildren) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <AppDrawer>{children}</AppDrawer>
      </body>
    </html>
  )
}
