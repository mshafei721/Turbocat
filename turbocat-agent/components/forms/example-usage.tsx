/**
 * Example Usage - Form Components
 *
 * This file demonstrates how to use the form components
 * with React Hook Form and Zod validation.
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormField, FormLabel, FormMessage, RichTextEditor, MarkdownRenderer } from '@/components/forms'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Slider } from '@/components/ui/slider'

// Define validation schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  dueDate: z.date().optional(),
  priority: z.number().min(1).max(10),
})

type FormValues = z.infer<typeof formSchema>

export function ExampleFormUsage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      priority: 5,
    },
  })

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Example Form with AI Native Components</h1>

      {/* Simple text field */}
      <FormField
        control={form.control}
        name="title"
        label="Title"
        required
        render={({ field }) => <Input {...field} placeholder="Enter title" />}
      />

      {/* Optional textarea */}
      <FormField
        control={form.control}
        name="description"
        label="Description"
        description="Optional short description"
        render={({ field }) => <Textarea {...field} placeholder="Enter description" rows={3} />}
      />

      {/* Rich text editor */}
      <div className="space-y-2">
        <FormLabel required>Content</FormLabel>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Write your content here..."
            />
          )}
        />
      </div>

      {/* Date picker */}
      <FormField
        control={form.control}
        name="dueDate"
        label="Due Date"
        render={({ field }) => (
          <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Select a due date" />
        )}
      />

      {/* Slider */}
      <FormField
        control={form.control}
        name="priority"
        label="Priority"
        description="1 = Low, 10 = High"
        render={({ field }) => (
          <div className="space-y-2">
            <Slider
              value={[field.value]}
              onValueChange={(values) => field.onChange(values[0])}
              min={1}
              max={10}
              step={1}
            />
            <p className="text-sm text-muted-foreground text-center">Priority: {field.value}/10</p>
          </div>
        )}
      />

      {/* Submit button */}
      <div className="flex gap-3">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
      </div>

      {/* Markdown preview example */}
      {form.watch('content') && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Content Preview</h2>
          <div className="rounded-xl border bg-muted/30 p-4">
            <MarkdownRenderer content={form.watch('content')} />
          </div>
        </div>
      )}
    </form>
  )
}
