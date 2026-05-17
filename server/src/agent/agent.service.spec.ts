import 'reflect-metadata';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { AgentService } from './agent.service';

const createService = (prisma: any) =>
  new AgentService(
    prisma,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

async function testCreateThread() {
  const now = 1710000000000;
  const originalDateNow = Date.now;
  const originalRandomUUID = crypto.randomUUID;
  Date.now = () => now;
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    value: () => '11111111-1111-4111-8111-111111111111',
  });

  try {
    const createdThread = {
      id: 10n,
      agent_id: 1n,
      user_id: 'user-1',
      uuid: '11111111-1111-4111-8111-111111111111',
      name: null,
      created_at: BigInt(now),
      updated_at: BigInt(now),
    };
    const prisma = {
      agent: {
        findFirst: async (args: any) => {
          assert.deepEqual(args, { where: { id: 1n, enabled: true } });
          return { id: 1n };
        },
      },
      agentThread: {
        create: async (args: any) => {
          assert.deepEqual(args, {
            data: {
              agent_id: 1n,
              user_id: 'user-1',
              uuid: '11111111-1111-4111-8111-111111111111',
              created_at: BigInt(now),
              updated_at: BigInt(now),
            },
          });
          return createdThread;
        },
      },
    };

    const result = await createService(prisma).createThread({
      agentId: '1',
      userId: 'user-1',
    });

    assert.deepEqual(result, {
      data: {
        threadId: '11111111-1111-4111-8111-111111111111',
        name: '新会话',
        createdAt: new Date(now).toISOString(),
        agentId: '1',
      },
    });
  } finally {
    Date.now = originalDateNow;
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: originalRandomUUID,
    });
  }
}

async function testCreateThreadRejectsNonNumericAgentId() {
  const prisma = {
    agent: {
      findFirst: async () => {
        throw new Error('agent lookup should not run');
      },
    },
  };

  await assert.rejects(
    () =>
      createService(prisma).createThread({
        agentId: 'test',
        userId: 'user-1',
      }),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'agentId must be a numeric string');
      return true;
    },
  );
}

async function testDeleteThread() {
  const calls: string[] = [];
  const txPrisma = {
    agentMessage: {
      deleteMany: async (args: any) => {
        calls.push('messages');
        assert.deepEqual(args, { where: { thread_id: 10n } });
      },
    },
    agentChat: {
      deleteMany: async (args: any) => {
        calls.push('chats');
        assert.deepEqual(args, { where: { thread_id: 10n } });
      },
    },
    agentThread: {
      delete: async (args: any) => {
        calls.push('thread');
        assert.deepEqual(args, { where: { id: 10n } });
      },
    },
  };
  const prisma = {
    agentThread: {
      findFirst: async (args: any) => {
        assert.deepEqual(args, {
          where: { uuid: 'thread-1', user_id: 'user-1' },
        });
        return { id: 10n };
      },
    },
    $transaction: async (callback: (tx: typeof txPrisma) => Promise<void>) => {
      calls.push('transaction:start');
      await callback(txPrisma);
      calls.push('transaction:end');
    },
  };

  const result = await createService(prisma).deleteThread({
    threadId: 'thread-1',
    userId: 'user-1',
  });

  assert.deepEqual(calls, ['transaction:start', 'messages', 'chats', 'thread', 'transaction:end']);
  assert.deepEqual(result, { data: { threadId: 'thread-1' } });
}

async function main() {
  await testCreateThread();
  await testCreateThreadRejectsNonNumericAgentId();
  await testDeleteThread();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
