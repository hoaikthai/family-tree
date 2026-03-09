import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Family Tree</h1>
      <p className="text-gray-600">Document and share your family history.</p>
      <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Get started
      </Link>
    </div>
  )
}
