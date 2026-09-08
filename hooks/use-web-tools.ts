'use client';
import { useEffect, useRef } from 'react';
import type { CaseRecord } from '@/lib/dashboard-data';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
export function useWebTools(actions: {
  go: (id: string) => void;
  retry: (id: string) => Promise<void>;
  cases: CaseRecord[];
}) {
  const current = useRef(actions);
  useEffect(() => {
    current.current = actions;
  }, [actions]);
  useEffect(() => {
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'read_cict_tasks',
        description: 'Read the current fictional CICT task statuses.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () =>
          current.current.cases.map((c) => ({ id: c.id, status: c.status })),
      },
      {
        name: 'retry_demo_cict_case',
        description:
          'Simulate re-parsing a CICT case in the front-end demo. Updates visible task status; does not call a server.',
        inputSchema: {
          type: 'object',
          properties: { caseId: { type: 'string' } },
          required: ['caseId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input) => {
          const id = (input as { caseId?: unknown })?.caseId;
          const c = current.current.cases.find((c) => c.id === id);
          if (!c || c.status === 'running' || c.status === 'queued')
            throw new Error('Choose an existing completed or failed case');
          current.current.go('cict');
          await current.current.retry(c.id);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return { caseId: c.id, status: 'success', simulated: true };
        },
      },
    ];
    for (const t of tools) {
      try {
        Promise.resolve(
          ctx.registerTool(t, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Unsupported implementations do not affect the UI. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
