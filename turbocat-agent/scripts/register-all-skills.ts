import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import matter from 'gray-matter';
import { SkillRegistry } from '../lib/skills/registry';

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

/**
 * Register all skills in the database
 */
async function registerAllSkills() {
  console.log('🚀 Starting skill registration...\n');

  const skillFiles = [
    'database-design.skill.md',
    'api-integration.skill.md',
    'supabase-setup.skill.md',
    'ui-component.skill.md'
  ];

  const registry = new SkillRegistry();
  let successCount = 0;
  let errorCount = 0;

  for (const skillFile of skillFiles) {
    try {
      const skillPath = join(__dirname, '../skills', skillFile);
      console.log(`📄 Processing: ${skillFile}`);

      // Read and parse skill file
      const content = readFileSync(skillPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      // Create skill definition
      const skillDefinition = {
        name: frontmatter.name,
        slug: frontmatter.name,
        description: frontmatter.description,
        version: frontmatter.version,
        category: frontmatter.category || 'core',
        tags: frontmatter.tags || [],
        scope: frontmatter.scope || 'user',
        content: content,
        mcpDependencies: frontmatter.mcp_dependencies || [],
        triggers: frontmatter.triggers || [],
        isActive: true,
        usageCount: 0,
        successRate: 0
      };

      // Register skill
      console.log(`   ✓ Registering ${skillDefinition.name}...`);
      await registry.register(skillDefinition);
      successCount++;
      console.log(`   ✅ Successfully registered: ${skillDefinition.name}\n`);

    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error registering ${skillFile}:`, error);
      console.error('');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Registration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully registered: ${successCount} skills`);
  console.log(`❌ Failed: ${errorCount} skills`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log('\n🎉 Skills are ready to use!');
    console.log('\nVerify registration:');
    console.log('  cd turbocat-agent');
    console.log('  pnpm test lib/skills');
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the registration
registerAllSkills().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
