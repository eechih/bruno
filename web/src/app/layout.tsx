import '@aws-amplify/ui-react/styles.css'
import { Metadata } from 'next'

import AppDrawer from '@/components/app-drawer'
import ThemeProvider from '@/components/theme-provider'
import config from '@/lib/config'
import { roboto } from '@/lib/theme'
import { ReactChildren } from '@/lib/types'
// import './globals.css'

export const metadata: Metadata = {
  title: config.siteName,
  description: config.siteDescription,
}

export default function RootLayout({ children }: ReactChildren) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <ThemeProvider>
          <AppDrawer>{children}</AppDrawer>
        </ThemeProvider>
      </body>
    </html>
  )
}
