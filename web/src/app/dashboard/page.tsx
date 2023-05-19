import Link from 'next/link'

export default async function Page() {
  return (
    <>
      <h1>Hello, Next.js!</h1>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>

        <li>
          <Link href="/dashboard/products">Projects</Link>
        </li>
      </ol>
    </>
  )
}
