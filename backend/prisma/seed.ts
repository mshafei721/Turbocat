/**
 * Prisma Seed Script
 *
 * This script populates the database with initial seed data for development
 * and testing purposes. It creates:
 * - An admin user
 * - Sample official templates
 * - Sample agents and workflows for testing
 *
 * Usage:
 *   npx prisma db seed
 *   npm run db:seed
 *
 * Note: This script uses deterministic UUIDs for consistent seeding.
 * Running seed multiple times will update existing records due to upsert.
 *
 * @module prisma/seed
 */

import { PrismaClient, UserRole, AgentType, AgentStatus, TemplateType, WorkflowStatus, WorkflowStepType, ErrorHandling } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// =============================================================================
// Deterministic UUIDs for seed data
// These ensure consistent IDs across multiple seed runs
// =============================================================================

const SEED_IDS = {
  // Users
  ADMIN_USER: '00000000-0000-4000-8000-000000000001',
  DEMO_USER: '00000000-0000-4000-8000-000000000002',

  // Agents
  AGENT_WEB_SCRAPER: '00000000-0000-4000-8000-000000001001',
  AGENT_DATA_TRANSFORMER: '00000000-0000-4000-8000-000000001002',
  AGENT_API_CALLER: '00000000-0000-4000-8000-000000001003',
  AGENT_LLM_SUMMARIZER: '00000000-0000-4000-8000-000000001004',
  AGENT_EMAIL_SENDER: '00000000-0000-4000-8000-000000001005',

  // Workflows
  WORKFLOW_DATA_PIPELINE: '00000000-0000-4000-8000-000000002001',
  WORKFLOW_CONTENT_GENERATOR: '00000000-0000-4000-8000-000000002002',

  // Workflow Steps
  STEP_FETCH_DATA: '00000000-0000-4000-8000-000000003001',
  STEP_TRANSFORM_DATA: '00000000-0000-4000-8000-000000003002',
  STEP_SAVE_DATA: '00000000-0000-4000-8000-000000003003',
  STEP_FETCH_CONTENT: '00000000-0000-4000-8000-000000003004',
  STEP_SUMMARIZE: '00000000-0000-4000-8000-000000003005',
  STEP_NOTIFY: '00000000-0000-4000-8000-000000003006',

  // Templates
  TEMPLATE_WEB_SCRAPER: '00000000-0000-4000-8000-000000004001',
  TEMPLATE_DATA_TRANSFORMER: '00000000-0000-4000-8000-000000004002',
  TEMPLATE_API_INTEGRATION: '00000000-0000-4000-8000-000000004003',
  TEMPLATE_LLM_ASSISTANT: '00000000-0000-4000-8000-000000004004',
  TEMPLATE_EMAIL_AUTOMATION: '00000000-0000-4000-8000-000000004005',
  TEMPLATE_DATA_PIPELINE: '00000000-0000-4000-8000-000000004006',
};

// =============================================================================
// Seed Functions
// =============================================================================

/**
 * Create admin and demo users
 */
async function seedUsers(): Promise<void> {
  console.log('Seeding users...');

  // Admin user - no password hash as we use Supabase Auth
  await prisma.user.upsert({
    where: { id: SEED_IDS.ADMIN_USER },
    update: {
      email: 'admin@turbocat.dev',
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          executionAlerts: true,
        },
        defaultView: 'dashboard',
      },
    },
    create: {
      id: SEED_IDS.ADMIN_USER,
      email: 'admin@turbocat.dev',
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          executionAlerts: true,
        },
        defaultView: 'dashboard',
      },
    },
  });

  // Demo user for testing
  await prisma.user.upsert({
    where: { id: SEED_IDS.DEMO_USER },
    update: {
      email: 'demo@turbocat.dev',
      fullName: 'Demo User',
      role: UserRole.USER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          executionAlerts: true,
        },
      },
    },
    create: {
      id: SEED_IDS.DEMO_USER,
      email: 'demo@turbocat.dev',
      fullName: 'Demo User',
      role: UserRole.USER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          executionAlerts: true,
        },
      },
    },
  });

  console.log('  Created 2 users');
}

/**
 * Create sample agents
 */
async function seedAgents(): Promise<void> {
  console.log('Seeding agents...');

  const agents = [
    {
      id: SEED_IDS.AGENT_WEB_SCRAPER,
      name: 'Web Scraper',
      description: 'Extracts data from web pages using configurable selectors',
      type: AgentType.CODE,
      status: AgentStatus.ACTIVE,
      userId: SEED_IDS.ADMIN_USER,
      config: {
        runtime: 'nodejs',
        version: '20',
        entrypoint: 'scrape.js',
        dependencies: ['puppeteer', 'cheerio'],
      },
      capabilities: ['http_request', 'html_parsing', 'data_extraction'],
      parameters: {
        url: { type: 'string', required: true, description: 'URL to scrape' },
        selectors: { type: 'object', required: true, description: 'CSS selectors for extraction' },
        waitForSelector: { type: 'string', required: false, description: 'Wait for element before scraping' },
      },
      tags: ['web', 'scraping', 'data-extraction'],
      isPublic: true,
      isTemplate: true,
    },
    {
      id: SEED_IDS.AGENT_DATA_TRANSFORMER,
      name: 'Data Transformer',
      description: 'Transforms and maps data between different formats',
      type: AgentType.DATA,
      status: AgentStatus.ACTIVE,
      userId: SEED_IDS.ADMIN_USER,
      config: {
        operations: ['map', 'filter', 'reduce', 'flatten', 'group'],
        outputFormats: ['json', 'csv', 'xml'],
      },
      capabilities: ['data_transformation', 'format_conversion'],
      parameters: {
        input: { type: 'any', required: true, description: 'Input data to transform' },
        mapping: { type: 'object', required: true, description: 'Field mapping configuration' },
        outputFormat: { type: 'string', required: false, default: 'json' },
      },
      tags: ['data', 'transformation', 'etl'],
      isPublic: true,
      isTemplate: true,
    },
    {
      id: SEED_IDS.AGENT_API_CALLER,
      name: 'API Caller',
      description: 'Makes HTTP requests to external APIs with authentication',
      type: AgentType.API,
      status: AgentStatus.ACTIVE,
      userId: SEED_IDS.ADMIN_USER,
      config: {
        supportedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        authTypes: ['none', 'bearer', 'basic', 'api_key'],
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      },
      capabilities: ['http_request', 'authentication', 'retry'],
      parameters: {
        url: { type: 'string', required: true },
        method: { type: 'string', required: true, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        headers: { type: 'object', required: false },
        body: { type: 'any', required: false },
        auth: { type: 'object', required: false },
      },
      tags: ['api', 'http', 'integration'],
      isPublic: true,
      isTemplate: true,
    },
    {
      id: SEED_IDS.AGENT_LLM_SUMMARIZER,
      name: 'LLM Summarizer',
      description: 'Uses AI to summarize and analyze text content',
      type: AgentType.LLM,
      status: AgentStatus.ACTIVE,
      userId: SEED_IDS.ADMIN_USER,
      config: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.3,
      },
      capabilities: ['text_summarization', 'content_analysis', 'natural_language'],
      parameters: {
        text: { type: 'string', required: true, description: 'Text to summarize' },
        style: { type: 'string', required: false, enum: ['brief', 'detailed', 'bullet_points'] },
        maxLength: { type: 'number', required: false, default: 500 },
      },
      tags: ['ai', 'llm', 'summarization', 'nlp'],
      isPublic: true,
      isTemplate: true,
    },
    {
      id: SEED_IDS.AGENT_EMAIL_SENDER,
      name: 'Email Sender',
      description: 'Sends emails using configurable templates and SMTP',
      type: AgentType.API,
      status: AgentStatus.ACTIVE,
      userId: SEED_IDS.ADMIN_USER,
      config: {
        providers: ['smtp', 'sendgrid', 'resend'],
        templateEngine: 'handlebars',
      },
      capabilities: ['email_send', 'template_rendering'],
      parameters: {
        to: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        body: { type: 'string', required: true },
        templateId: { type: 'string', required: false },
        templateData: { type: 'object', required: false },
      },
      tags: ['email', 'notification', 'communication'],
      isPublic: true,
      isTemplate: true,
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: agent,
      create: agent,
    });
  }

  console.log(`  Created ${agents.length} agents`);
}

/**
 * Create sample workflows
 */
async function seedWorkflows(): Promise<void> {
  console.log('Seeding workflows...');

  // Data Pipeline Workflow
  await prisma.workflow.upsert({
    where: { id: SEED_IDS.WORKFLOW_DATA_PIPELINE },
    update: {
      name: 'Data Pipeline',
      description: 'Fetches data from an API, transforms it, and stores the results',
      userId: SEED_IDS.ADMIN_USER,
      status: WorkflowStatus.ACTIVE,
      definition: {
        version: '1.0',
        description: 'A sample data pipeline workflow',
        inputs: {
          apiUrl: { type: 'string', required: true },
          outputFormat: { type: 'string', default: 'json' },
        },
        outputs: {
          processedData: { type: 'object' },
          recordCount: { type: 'number' },
        },
      },
      triggerConfig: {
        manual: true,
        scheduled: false,
      },
      tags: ['data', 'pipeline', 'etl'],
      isPublic: true,
    },
    create: {
      id: SEED_IDS.WORKFLOW_DATA_PIPELINE,
      name: 'Data Pipeline',
      description: 'Fetches data from an API, transforms it, and stores the results',
      userId: SEED_IDS.ADMIN_USER,
      status: WorkflowStatus.ACTIVE,
      definition: {
        version: '1.0',
        description: 'A sample data pipeline workflow',
        inputs: {
          apiUrl: { type: 'string', required: true },
          outputFormat: { type: 'string', default: 'json' },
        },
        outputs: {
          processedData: { type: 'object' },
          recordCount: { type: 'number' },
        },
      },
      triggerConfig: {
        manual: true,
        scheduled: false,
      },
      tags: ['data', 'pipeline', 'etl'],
      isPublic: true,
    },
  });

  // Content Generator Workflow
  await prisma.workflow.upsert({
    where: { id: SEED_IDS.WORKFLOW_CONTENT_GENERATOR },
    update: {
      name: 'Content Generator',
      description: 'Scrapes web content, summarizes it with AI, and sends a notification',
      userId: SEED_IDS.ADMIN_USER,
      status: WorkflowStatus.ACTIVE,
      definition: {
        version: '1.0',
        description: 'Automated content generation and summarization',
        inputs: {
          sourceUrl: { type: 'string', required: true },
          notifyEmail: { type: 'string', required: true },
        },
        outputs: {
          summary: { type: 'string' },
          sentAt: { type: 'datetime' },
        },
      },
      triggerConfig: {
        manual: true,
        scheduled: true,
      },
      scheduleEnabled: false,
      scheduleCron: '0 9 * * 1', // Every Monday at 9 AM
      scheduleTimezone: 'UTC',
      tags: ['content', 'ai', 'automation'],
      isPublic: true,
    },
    create: {
      id: SEED_IDS.WORKFLOW_CONTENT_GENERATOR,
      name: 'Content Generator',
      description: 'Scrapes web content, summarizes it with AI, and sends a notification',
      userId: SEED_IDS.ADMIN_USER,
      status: WorkflowStatus.ACTIVE,
      definition: {
        version: '1.0',
        description: 'Automated content generation and summarization',
        inputs: {
          sourceUrl: { type: 'string', required: true },
          notifyEmail: { type: 'string', required: true },
        },
        outputs: {
          summary: { type: 'string' },
          sentAt: { type: 'datetime' },
        },
      },
      triggerConfig: {
        manual: true,
        scheduled: true,
      },
      scheduleEnabled: false,
      scheduleCron: '0 9 * * 1',
      scheduleTimezone: 'UTC',
      tags: ['content', 'ai', 'automation'],
      isPublic: true,
    },
  });

  console.log('  Created 2 workflows');
}

/**
 * Create workflow steps
 */
async function seedWorkflowSteps(): Promise<void> {
  console.log('Seeding workflow steps...');

  // Data Pipeline Steps
  const dataPipelineSteps = [
    {
      id: SEED_IDS.STEP_FETCH_DATA,
      workflowId: SEED_IDS.WORKFLOW_DATA_PIPELINE,
      agentId: SEED_IDS.AGENT_API_CALLER,
      stepKey: 'fetch_data',
      stepName: 'Fetch Data from API',
      stepType: WorkflowStepType.AGENT,
      position: 0,
      config: {},
      inputs: {
        url: '{{inputs.apiUrl}}',
        method: 'GET',
      },
      outputs: {
        data: '{{response.body}}',
      },
      dependsOn: [],
      retryCount: 3,
      retryDelayMs: 2000,
      timeoutMs: 30000,
      onError: ErrorHandling.RETRY,
    },
    {
      id: SEED_IDS.STEP_TRANSFORM_DATA,
      workflowId: SEED_IDS.WORKFLOW_DATA_PIPELINE,
      agentId: SEED_IDS.AGENT_DATA_TRANSFORMER,
      stepKey: 'transform_data',
      stepName: 'Transform Data',
      stepType: WorkflowStepType.AGENT,
      position: 1,
      config: {},
      inputs: {
        input: '{{fetch_data.data}}',
        outputFormat: '{{inputs.outputFormat}}',
      },
      outputs: {
        processedData: '{{result}}',
        recordCount: '{{result.length}}',
      },
      dependsOn: ['fetch_data'],
      retryCount: 0,
      retryDelayMs: 1000,
      timeoutMs: 60000,
      onError: ErrorHandling.FAIL,
    },
    {
      id: SEED_IDS.STEP_SAVE_DATA,
      workflowId: SEED_IDS.WORKFLOW_DATA_PIPELINE,
      agentId: null, // Internal step
      stepKey: 'save_data',
      stepName: 'Save Results',
      stepType: WorkflowStepType.AGENT,
      position: 2,
      config: {
        storage: 'workflow_output',
      },
      inputs: {
        data: '{{transform_data.processedData}}',
      },
      outputs: {},
      dependsOn: ['transform_data'],
      retryCount: 1,
      retryDelayMs: 1000,
      timeoutMs: 10000,
      onError: ErrorHandling.CONTINUE,
    },
  ];

  // Content Generator Steps
  const contentGeneratorSteps = [
    {
      id: SEED_IDS.STEP_FETCH_CONTENT,
      workflowId: SEED_IDS.WORKFLOW_CONTENT_GENERATOR,
      agentId: SEED_IDS.AGENT_WEB_SCRAPER,
      stepKey: 'fetch_content',
      stepName: 'Fetch Web Content',
      stepType: WorkflowStepType.AGENT,
      position: 0,
      config: {},
      inputs: {
        url: '{{inputs.sourceUrl}}',
        selectors: {
          title: 'h1',
          content: 'article, .content, main',
        },
      },
      outputs: {
        rawContent: '{{result.content}}',
        title: '{{result.title}}',
      },
      dependsOn: [],
      retryCount: 2,
      retryDelayMs: 3000,
      timeoutMs: 45000,
      onError: ErrorHandling.RETRY,
    },
    {
      id: SEED_IDS.STEP_SUMMARIZE,
      workflowId: SEED_IDS.WORKFLOW_CONTENT_GENERATOR,
      agentId: SEED_IDS.AGENT_LLM_SUMMARIZER,
      stepKey: 'summarize',
      stepName: 'Summarize with AI',
      stepType: WorkflowStepType.AGENT,
      position: 1,
      config: {},
      inputs: {
        text: '{{fetch_content.rawContent}}',
        style: 'detailed',
        maxLength: 1000,
      },
      outputs: {
        summary: '{{result}}',
      },
      dependsOn: ['fetch_content'],
      retryCount: 1,
      retryDelayMs: 5000,
      timeoutMs: 120000,
      onError: ErrorHandling.FAIL,
    },
    {
      id: SEED_IDS.STEP_NOTIFY,
      workflowId: SEED_IDS.WORKFLOW_CONTENT_GENERATOR,
      agentId: SEED_IDS.AGENT_EMAIL_SENDER,
      stepKey: 'notify',
      stepName: 'Send Notification',
      stepType: WorkflowStepType.AGENT,
      position: 2,
      config: {},
      inputs: {
        to: '{{inputs.notifyEmail}}',
        subject: 'Content Summary: {{fetch_content.title}}',
        body: '{{summarize.summary}}',
      },
      outputs: {
        sentAt: '{{result.sentAt}}',
      },
      dependsOn: ['summarize'],
      retryCount: 2,
      retryDelayMs: 5000,
      timeoutMs: 30000,
      onError: ErrorHandling.RETRY,
    },
  ];

  // Delete existing steps first (to handle updates)
  await prisma.workflowStep.deleteMany({
    where: {
      workflowId: {
        in: [SEED_IDS.WORKFLOW_DATA_PIPELINE, SEED_IDS.WORKFLOW_CONTENT_GENERATOR],
      },
    },
  });

  // Create all steps
  for (const step of [...dataPipelineSteps, ...contentGeneratorSteps]) {
    await prisma.workflowStep.create({
      data: step,
    });
  }

  console.log(`  Created ${dataPipelineSteps.length + contentGeneratorSteps.length} workflow steps`);
}

/**
 * Create official templates
 */
async function seedTemplates(): Promise<void> {
  console.log('Seeding templates...');

  const templates = [
    {
      id: SEED_IDS.TEMPLATE_WEB_SCRAPER,
      name: 'Web Scraper',
      description: 'A template for creating web scraping agents that extract data from websites using CSS selectors.',
      category: 'data-extraction',
      type: TemplateType.AGENT,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        type: 'CODE',
        config: {
          runtime: 'nodejs',
          version: '20',
        },
        parameters: {
          url: { type: 'string', required: true, description: 'Target URL' },
          selectors: { type: 'object', required: true, description: 'CSS selectors' },
        },
        capabilities: ['http_request', 'html_parsing'],
      },
      tags: ['web', 'scraping', 'data'],
      isOfficial: true,
      isPublic: true,
    },
    {
      id: SEED_IDS.TEMPLATE_DATA_TRANSFORMER,
      name: 'Data Transformer',
      description: 'Transform and map data between different formats with powerful operations.',
      category: 'data-processing',
      type: TemplateType.AGENT,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        type: 'DATA',
        config: {
          operations: ['map', 'filter', 'reduce'],
        },
        parameters: {
          input: { type: 'any', required: true },
          mapping: { type: 'object', required: true },
        },
        capabilities: ['data_transformation'],
      },
      tags: ['data', 'transformation', 'etl'],
      isOfficial: true,
      isPublic: true,
    },
    {
      id: SEED_IDS.TEMPLATE_API_INTEGRATION,
      name: 'API Integration',
      description: 'Connect to external REST APIs with authentication and error handling.',
      category: 'integration',
      type: TemplateType.AGENT,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        type: 'API',
        config: {
          retryPolicy: { maxRetries: 3 },
        },
        parameters: {
          url: { type: 'string', required: true },
          method: { type: 'string', required: true },
          auth: { type: 'object', required: false },
        },
        capabilities: ['http_request', 'authentication'],
      },
      tags: ['api', 'rest', 'integration'],
      isOfficial: true,
      isPublic: true,
    },
    {
      id: SEED_IDS.TEMPLATE_LLM_ASSISTANT,
      name: 'LLM Assistant',
      description: 'AI-powered text processing using large language models.',
      category: 'ai',
      type: TemplateType.AGENT,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        type: 'LLM',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          maxTokens: 2000,
        },
        parameters: {
          prompt: { type: 'string', required: true },
          context: { type: 'string', required: false },
        },
        capabilities: ['text_generation', 'analysis'],
      },
      tags: ['ai', 'llm', 'nlp'],
      isOfficial: true,
      isPublic: true,
    },
    {
      id: SEED_IDS.TEMPLATE_EMAIL_AUTOMATION,
      name: 'Email Automation',
      description: 'Send automated emails with templating support.',
      category: 'communication',
      type: TemplateType.AGENT,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        type: 'API',
        config: {
          providers: ['sendgrid', 'resend'],
        },
        parameters: {
          to: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          template: { type: 'string', required: false },
        },
        capabilities: ['email_send'],
      },
      tags: ['email', 'notification', 'automation'],
      isOfficial: true,
      isPublic: true,
    },
    {
      id: SEED_IDS.TEMPLATE_DATA_PIPELINE,
      name: 'Data Pipeline',
      description: 'A complete workflow template for ETL data pipelines with fetch, transform, and load steps.',
      category: 'data-processing',
      type: TemplateType.WORKFLOW,
      userId: SEED_IDS.ADMIN_USER,
      templateData: {
        definition: {
          version: '1.0',
          steps: [
            { key: 'fetch', type: 'AGENT', agentType: 'API' },
            { key: 'transform', type: 'AGENT', agentType: 'DATA' },
            { key: 'load', type: 'AGENT', agentType: 'API' },
          ],
        },
        inputs: {
          sourceUrl: { type: 'string', required: true },
          destinationUrl: { type: 'string', required: true },
        },
      },
      tags: ['pipeline', 'etl', 'workflow'],
      isOfficial: true,
      isPublic: true,
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }

  console.log(`  Created ${templates.length} templates`);
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function main(): Promise<void> {
  console.log('');
  console.log('===========================================');
  console.log('  Turbocat Database Seed');
  console.log('===========================================');
  console.log('');

  try {
    // Run seed functions in order (respecting foreign key constraints)
    await seedUsers();
    await seedAgents();
    await seedWorkflows();
    await seedWorkflowSteps();
    await seedTemplates();

    console.log('');
    console.log('===========================================');
    console.log('  Seed completed successfully!');
    console.log('===========================================');
    console.log('');
    console.log('Summary:');
    console.log('  - 2 users (admin@turbocat.dev, demo@turbocat.dev)');
    console.log('  - 5 sample agents');
    console.log('  - 2 sample workflows with 6 steps');
    console.log('  - 6 official templates');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('Seed failed with error:');
    console.error(error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
