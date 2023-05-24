'use client'

import CssBaseline from '@mui/material/CssBaseline'
import {
  ThemeProvider as MuiThemeProvider,
  Theme,
  ThemeOptions,
  createTheme,
} from '@mui/material/styles'
import { createContext, useEffect, useState } from 'react'

import { roboto } from '@/lib/theme'
import { ReactChildren } from '@/lib/types'

export type ThemeMode = 'light' | 'dark'

export type IThemeContext = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<IThemeContext | null>(null)

const defaultThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
}

const defaultTheme = createTheme(defaultThemeOptions)

export default function ThemeProvider({ children }: ReactChildren) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const newTheme = createTheme({ ...defaultThemeOptions, palette: { mode } })
    setTheme(newTheme)
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
