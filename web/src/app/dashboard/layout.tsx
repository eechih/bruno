export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <nav>Dashboard</nav>
      {children}
    </section>
  )
}
