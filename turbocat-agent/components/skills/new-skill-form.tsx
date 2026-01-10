/**
 * New Skill Form Component
 *
 * Client-side form for creating new skills.
 *
 * @file components/skills/new-skill-form.tsx
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'

interface NewSkillFormProps {
  userId: string
}

const SKILL_TEMPLATE = `---
name: My New Skill
description: A brief description of what this skill does
version: 1.0.0
category: general
tags:
  - automation
  - productivity
scope: user
mcp_dependencies: []
triggers:
  - pattern: "help me with"
    confidence: 0.8
    examples:
      - "help me with task automation"
---

# My New Skill

## Overview
Describe what this skill does and when it should be triggered.

## Instructions
1. Step one of what the AI should do
2. Step two of the process
3. Final step and expected outcome

## Examples
- Example input: "help me with task automation"
- Expected behavior: The AI will...
`

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'development', label: 'Development' },
  { value: 'database', label: 'Database' },
  { value: 'api', label: 'API Integration' },
  { value: 'automation', label: 'Automation' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'testing', label: 'Testing' },
  { value: 'deployment', label: 'Deployment' },
]

/**
 * NewSkillForm Component
 */
export function NewSkillForm({ userId }: NewSkillFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [content, setContent] = useState(SKILL_TEMPLATE)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Skill name is required')
      return
    }

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          content,
          userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create skill')
      }

      const result = await response.json()

      toast.success('Skill created successfully!')
      router.push(`/skills/${result.slug}`)
    } catch (error) {
      console.error('Error creating skill:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create skill')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseTemplate = () => {
    setContent(SKILL_TEMPLATE)
    toast.info('Template loaded')
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/skills">
          <Button variant="ghost" size="sm" className="gap-2" type="button">
            <ArrowLeft className="h-4 w-4" />
            Back to Skills
          </Button>
        </Link>
      </div>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Create New Skill
          </CardTitle>
          <CardDescription>
            Define a new AI agent skill using the SKILL.md format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Database Migration Helper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe what this skill does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* SKILL.md Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">SKILL.md Content</CardTitle>
              <CardDescription>
                Define the full skill with frontmatter and instructions
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseTemplate}>
              Use Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm min-h-[400px]"
            placeholder="Enter your SKILL.md content..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use YAML frontmatter for metadata and Markdown for instructions
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/skills">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Creating...' : 'Create Skill'}
        </Button>
      </div>
    </form>
  )
}
