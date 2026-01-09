import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getServerSession } from '@/lib/session/get-server-session'
import { getUserGitHubToken } from '@/lib/github/user-token'
import { PROJECT_DIR } from '@/lib/sandbox/commands'

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()
    const { repoFullName } = body

    if (!repoFullName) {
      return NextResponse.json(
        { success: false, error: 'Repository name is required' },
        { status: 400 }
      )
    }

    // Get task from database and verify ownership (exclude soft-deleted)
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
      .limit(1)

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    if (!task.sandboxId) {
      return NextResponse.json({ success: false, error: 'Sandbox not available' }, { status: 400 })
    }

    // Get user's GitHub token
    const githubToken = await getUserGitHubToken()
    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: 'GitHub not connected' },
        { status: 401 }
      )
    }

    // Get sandbox
    const { getSandbox } = await import('@/lib/sandbox/sandbox-registry')
    const { Sandbox } = await import('@vercel/sandbox')

    let sandbox = getSandbox(taskId)

    // Try to reconnect if not in registry
    if (!sandbox) {
      const sandboxToken = process.env.SANDBOX_VERCEL_TOKEN
      const teamId = process.env.SANDBOX_VERCEL_TEAM_ID
      const projectId = process.env.SANDBOX_VERCEL_PROJECT_ID

      if (sandboxToken && teamId && projectId) {
        sandbox = await Sandbox.get({
          sandboxId: task.sandboxId,
          teamId,
          projectId,
          token: sandboxToken,
        })
      }
    }

    if (!sandbox) {
      return NextResponse.json(
        { success: false, error: 'Sandbox not found or inactive' },
        { status: 400 }
      )
    }

    // Configure git with user info
    const configUserResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['config', 'user.email', 'turbocat@example.com'],
      cwd: PROJECT_DIR,
    })

    const configNameResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['config', 'user.name', 'Turbocat'],
      cwd: PROJECT_DIR,
    })

    // Check if git is already initialized
    const gitCheckResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['rev-parse', '--git-dir'],
      cwd: PROJECT_DIR,
    })

    if (gitCheckResult.exitCode !== 0) {
      // Initialize git
      const initResult = await sandbox.runCommand({
        cmd: 'git',
        args: ['init'],
        cwd: PROJECT_DIR,
      })

      if (initResult.exitCode !== 0) {
        const stderr = await initResult.stderr()
        console.error('Failed to init git:', stderr)
        return NextResponse.json(
          { success: false, error: 'Failed to initialize git' },
          { status: 500 }
        )
      }
    }

    // Add all files
    const addResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['add', '.'],
      cwd: PROJECT_DIR,
    })

    if (addResult.exitCode !== 0) {
      const stderr = await addResult.stderr()
      console.error('Failed to add files:', stderr)
      return NextResponse.json(
        { success: false, error: 'Failed to add files' },
        { status: 500 }
      )
    }

    // Check if there are changes to commit
    const statusResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['status', '--porcelain'],
      cwd: PROJECT_DIR,
    })

    const statusOutput = await statusResult.stdout()
    const hasChanges = statusOutput.trim().length > 0

    // Check if there are any commits
    const hasCommitsResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['rev-parse', 'HEAD'],
      cwd: PROJECT_DIR,
    })

    const hasExistingCommits = hasCommitsResult.exitCode === 0

    if (hasChanges || !hasExistingCommits) {
      // Commit changes
      const commitResult = await sandbox.runCommand({
        cmd: 'git',
        args: ['commit', '-m', 'Initial commit from Turbocat'],
        cwd: PROJECT_DIR,
      })

      if (commitResult.exitCode !== 0 && hasChanges) {
        const stderr = await commitResult.stderr()
        console.error('Failed to commit:', stderr)
        return NextResponse.json(
          { success: false, error: 'Failed to commit changes' },
          { status: 500 }
        )
      }
    }

    // Set up remote with authentication
    const remoteUrl = `https://x-access-token:${githubToken}@github.com/${repoFullName}.git`

    // Remove existing remote if any
    await sandbox.runCommand({
      cmd: 'git',
      args: ['remote', 'remove', 'origin'],
      cwd: PROJECT_DIR,
    })

    // Add new remote
    const addRemoteResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['remote', 'add', 'origin', remoteUrl],
      cwd: PROJECT_DIR,
    })

    if (addRemoteResult.exitCode !== 0) {
      const stderr = await addRemoteResult.stderr()
      console.error('Failed to add remote:', stderr)
      return NextResponse.json(
        { success: false, error: 'Failed to configure GitHub remote' },
        { status: 500 }
      )
    }

    // Rename branch to main if needed
    await sandbox.runCommand({
      cmd: 'git',
      args: ['branch', '-M', 'main'],
      cwd: PROJECT_DIR,
    })

    // Force push to overwrite (for new repos, this is fine)
    const pushResult = await sandbox.runCommand({
      cmd: 'git',
      args: ['push', '-u', 'origin', 'main', '--force'],
      cwd: PROJECT_DIR,
    })

    if (pushResult.exitCode !== 0) {
      const stderr = await pushResult.stderr()
      console.error('Failed to push:', stderr)
      return NextResponse.json(
        { success: false, error: 'Failed to push to GitHub' },
        { status: 500 }
      )
    }

    // Update task with GitHub repo info
    await db
      .update(tasks)
      .set({
        repoUrl: `https://github.com/${repoFullName}`,
        branchName: 'main',
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))

    return NextResponse.json({
      success: true,
      message: 'Successfully pushed to GitHub',
      repoUrl: `https://github.com/${repoFullName}`,
    })
  } catch (error) {
    console.error('Error pushing to GitHub:', error)

    // Check if it's a 410 error (sandbox not running)
    if (error && typeof error === 'object' && 'status' in error && error.status === 410) {
      return NextResponse.json(
        { success: false, error: 'Sandbox is not running. Please restart it first.' },
        { status: 410 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred while pushing to GitHub' },
      { status: 500 }
    )
  }
}
