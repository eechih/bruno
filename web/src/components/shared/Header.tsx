import AppBar from '@/components/AppBar'
import HeaderDescription from './HeaderDesccription'

/**
 * The shared header component.
 */
export default function Header() {
  return (
    <header className="text-center sm:text-left">
      <AppBar />

      <HeaderDescription />
    </header>
  )
}
