/**
 * Tests for Agent Executor Factory
 */

import { AgentType } from '@prisma/client';
import {
  createAgentExecutor,
  getExecutorClass,
  hasExecutor,
  getSupportedAgentTypes,
  createCodeExecutor,
  createApiExecutor,
  createLLMExecutor,
  createDataExecutor,
  CodeAgentExecutor,
  ApiAgentExecutor,
  LLMAgentExecutor,
  DataAgentExecutor,
} from '../index';

describe('Agent Executor Factory', () => {
  describe('createAgentExecutor', () => {
    it('should create CodeAgentExecutor for CODE type', () => {
      const executor = createAgentExecutor(AgentType.CODE);
      expect(executor).toBeInstanceOf(CodeAgentExecutor);
    });

    it('should create ApiAgentExecutor for API type', () => {
      const executor = createAgentExecutor(AgentType.API);
      expect(executor).toBeInstanceOf(ApiAgentExecutor);
    });

    it('should create LLMAgentExecutor for LLM type', () => {
      const executor = createAgentExecutor(AgentType.LLM);
      expect(executor).toBeInstanceOf(LLMAgentExecutor);
    });

    it('should create DataAgentExecutor for DATA type', () => {
      const executor = createAgentExecutor(AgentType.DATA);
      expect(executor).toBeInstanceOf(DataAgentExecutor);
    });

    it('should create CodeAgentExecutor for WORKFLOW type (placeholder)', () => {
      const executor = createAgentExecutor(AgentType.WORKFLOW);
      expect(executor).toBeInstanceOf(CodeAgentExecutor);
    });

    it('should pass config to executor', () => {
      const executor = createAgentExecutor(AgentType.CODE, { timeoutMs: 5000 });
      expect((executor as any).config.timeoutMs).toBe(5000);
    });
  });

  describe('getExecutorClass', () => {
    it('should return correct executor class for each type', () => {
      expect(getExecutorClass(AgentType.CODE)).toBe(CodeAgentExecutor);
      expect(getExecutorClass(AgentType.API)).toBe(ApiAgentExecutor);
      expect(getExecutorClass(AgentType.LLM)).toBe(LLMAgentExecutor);
      expect(getExecutorClass(AgentType.DATA)).toBe(DataAgentExecutor);
    });
  });

  describe('hasExecutor', () => {
    it('should return true for supported types', () => {
      expect(hasExecutor(AgentType.CODE)).toBe(true);
      expect(hasExecutor(AgentType.API)).toBe(true);
      expect(hasExecutor(AgentType.LLM)).toBe(true);
      expect(hasExecutor(AgentType.DATA)).toBe(true);
      expect(hasExecutor(AgentType.WORKFLOW)).toBe(true);
    });
  });

  describe('getSupportedAgentTypes', () => {
    it('should return all supported agent types', () => {
      const types = getSupportedAgentTypes();
      expect(types).toContain(AgentType.CODE);
      expect(types).toContain(AgentType.API);
      expect(types).toContain(AgentType.LLM);
      expect(types).toContain(AgentType.DATA);
      expect(types).toContain(AgentType.WORKFLOW);
    });
  });

  describe('convenience creators', () => {
    it('should create CodeAgentExecutor', () => {
      const executor = createCodeExecutor();
      expect(executor).toBeInstanceOf(CodeAgentExecutor);
      expect(executor.getAgentType()).toBe(AgentType.CODE);
    });

    it('should create ApiAgentExecutor', () => {
      const executor = createApiExecutor();
      expect(executor).toBeInstanceOf(ApiAgentExecutor);
      expect(executor.getAgentType()).toBe(AgentType.API);
    });

    it('should create LLMAgentExecutor', () => {
      const executor = createLLMExecutor();
      expect(executor).toBeInstanceOf(LLMAgentExecutor);
      expect(executor.getAgentType()).toBe(AgentType.LLM);
    });

    it('should create DataAgentExecutor', () => {
      const executor = createDataExecutor();
      expect(executor).toBeInstanceOf(DataAgentExecutor);
      expect(executor.getAgentType()).toBe(AgentType.DATA);
    });

    it('should pass config to convenience creators', () => {
      const executor = createCodeExecutor({ verbose: true });
      expect((executor as any).config.verbose).toBe(true);
    });
  });
});
