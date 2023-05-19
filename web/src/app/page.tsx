import Link from 'next/link'

export default function Page() {
  return (
    <>
      <h1>Hello, Next.js!</h1>
      <Link href="/dashboard">
        <b>Dashboard</b>
      </Link>
    </>
  )
}
