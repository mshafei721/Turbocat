/**
 * Code Components - Usage Examples
 *
 * Demonstrates how to use CodeBlock and InlineCode components
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/code/code-examples.tsx
 */

import { CodeBlock, InlineCode } from './index'

export function CodeExamples() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Code Components</h2>

        {/* CodeBlock Example */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium">CodeBlock</h3>

          <CodeBlock
            code={`function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
}

greet('Turbocat');`}
            language="typescript"
            filename="greet.ts"
            showLineNumbers
          />
        </div>

        {/* InlineCode Example */}
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-medium">InlineCode</h3>
          <p className="text-muted-foreground">
            Use <InlineCode>npm install</InlineCode> to install dependencies, then run{' '}
            <InlineCode>npm run dev</InlineCode> to start the development server.
          </p>
        </div>
      </div>
    </div>
  )
}
