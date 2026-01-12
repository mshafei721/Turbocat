/**
 * Data Components - Usage Examples
 *
 * Demonstrates how to use DataTable, VirtualList, and EmptyState components
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/data/data-examples.tsx
 */

'use client'

import { useState } from 'react'
import { DataTable, VirtualList, VirtualListItem, EmptyState } from './index'
import { ColumnDef } from '@tanstack/react-table'

// Sample data types
interface User {
  id: string
  name: string
  email: string
  role: string
}

const sampleUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Moderator' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan@example.com', role: 'User' },
]

const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('email')}</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <span className="px-2 py-1 rounded-md bg-amber-100 dark:bg-orange-900/30 text-amber-700 dark:text-orange-400 text-xs font-medium">
        {row.getValue('role')}
      </span>
    ),
  },
]

export function DataExamples() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Data Components</h2>

        {/* DataTable Example */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium">DataTable</h3>
          <DataTable
            columns={userColumns}
            data={sampleUsers}
            onRowClick={(user) => setSelectedUser(user)}
            enableSorting
            enablePagination
            pageSize={5}
          />
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{selectedUser.name}</span>
            </p>
          )}
        </div>

        {/* VirtualList Example */}
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-medium">VirtualList</h3>
          <div className="h-64 border border-border rounded-xl overflow-hidden">
            <VirtualList
              items={sampleUsers}
              renderItem={(user, index) => (
                <VirtualListItem key={user.id} onClick={() => console.log('Clicked', user.name)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                </VirtualListItem>
              )}
              estimateSize={60}
            />
          </div>
        </div>

        {/* EmptyState Examples */}
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-medium">EmptyState</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EmptyState
              variant="no-data"
              action={{
                label: 'Create Item',
                onClick: () => console.log('Create clicked'),
              }}
            />
            <EmptyState variant="no-results" />
            <EmptyState
              variant="error"
              action={{
                label: 'Retry',
                onClick: () => console.log('Retry clicked'),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
