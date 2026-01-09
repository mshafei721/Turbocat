import { redirect } from 'next/navigation'

/**
 * Legacy tasks list page - redirects to new /dashboard route
 * Kept for backward compatibility with existing links/bookmarks
 */
export default async function TasksListPage() {
  redirect('/dashboard')
}
