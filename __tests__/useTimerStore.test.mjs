import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';

const rootDir = process.cwd();

const loaderSource = `
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = ${JSON.stringify(rootDir)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = path.join(rootDir, specifier.slice(2) + '.ts');
    return { shortCircuit: true, url: pathToFileURL(target).href };
  }
  if (specifier === 'react-native') {
    return { shortCircuit: true, url: 'mock:react-native' };
  }
  if (specifier === '@react-native-async-storage/async-storage') {
    return { shortCircuit: true, url: 'mock:async-storage' };
  }
  if (specifier === 'expo-haptics') {
    return { shortCircuit: true, url: 'mock:expo-haptics' };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === 'mock:react-native') {
    return {
      shortCircuit: true,
      format: 'module',
      source: \`
        export const Platform = { OS: 'android', Version: 34 };
        export const NativeModules = {};
        export class NativeEventEmitter {
          addListener() { return { remove() {} }; }
        }
        export const PermissionsAndroid = {
          PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
          RESULTS: { GRANTED: 'granted' },
          request: async () => 'granted',
        };
      \`,
    };
  }
  if (url === 'mock:async-storage') {
    return {
      shortCircuit: true,
      format: 'module',
      source: \`
        const store = globalThis.__mockAsyncStorageMap ?? (globalThis.__mockAsyncStorageMap = new Map());
        const api = {
          getItem: async (k) => (store.has(k) ? store.get(k) : null),
          setItem: async (k, v) => { store.set(k, v); },
          removeItem: async (k) => { store.delete(k); },
        };
        export default api;
      \`,
    };
  }
  if (url === 'mock:expo-haptics') {
    return {
      shortCircuit: true,
      format: 'module',
      source: \`
        export const impactAsync = async () => {};
        export const notificationAsync = async () => {};
        export const ImpactFeedbackStyle = { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' };
        export const NotificationFeedbackType = { Success: 'Success', Warning: 'Warning', Error: 'Error' };
      \`,
    };
  }
  return nextLoad(url, context);
}
`;

register(`data:text/javascript;base64,${Buffer.from(loaderSource).toString('base64')}`);

const {
  buildSequence,
  computeTotalPlanMinutes,
  DEFAULT_PLAN,
  useTimerStore,
} = await import(pathToFileURL(path.join(rootDir, 'store/useTimerStore.ts')).href);

const getMockStorage = () => globalThis.__mockAsyncStorageMap ?? (globalThis.__mockAsyncStorageMap = new Map());

test.beforeEach(() => {
  getMockStorage().clear();
  useTimerStore.getState().resetPlanToDefaults();
});

test('buildSequence builds standard alternating focus and break blocks', () => {
  const blocks = buildSequence({
    ...DEFAULT_PLAN,
    focusMinutes: 25,
    shortBreakMinutes: 5,
    sessionCount: 3,
    breakCount: 2,
    customSequenceEnabled: false,
  });

  assert.equal(blocks.length, 5);
  assert.deepEqual(
    blocks.map((b) => [b.type, b.minutes]),
    [
      ['focus', 25],
      ['short', 5],
      ['focus', 25],
      ['short', 5],
      ['focus', 25],
    ]
  );
  assert.equal(
    computeTotalPlanMinutes({
      ...DEFAULT_PLAN,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      sessionCount: 3,
      breakCount: 2,
      customSequenceEnabled: false,
    }),
    85
  );
});

test('start, pause, resume, and extendCurrentBlock maintain accurate remainingMs', async () => {
  const store = useTimerStore.getState();
  await store.start();
  let state = useTimerStore.getState();
  assert.equal(state.status, 'running');
  assert.ok(state.targetEndTime > Date.now());

  store.extendCurrentBlock(5);
  state = useTimerStore.getState();
  assert.equal(state.totalDurationMs, 30 * 60 * 1000);

  store.pause();
  state = useTimerStore.getState();
  assert.equal(state.status, 'paused');
  assert.equal(state.targetEndTime, null);
  assert.ok(state.remainingMs > 29 * 60 * 1000);

  store.resume();
  state = useTimerStore.getState();
  assert.equal(state.status, 'running');
  assert.ok(state.targetEndTime > Date.now());
});

test('reconcile completes block when targetEndTime is in the past', async () => {
  const store = useTimerStore.getState();
  await store.start();
  useTimerStore.setState({ targetEndTime: Date.now() - 1000 });

  store.reconcile();
  const state = useTimerStore.getState();
  assert.equal(state.status, 'idle');
  assert.equal(state.currentBlockIndex, 1);
  assert.equal(state.remainingMs, 5 * 60 * 1000);
});

test('loadPersistedState advances block when timer expired while app was closed', async () => {
  getMockStorage().set(
    '@chrono_pomodoro_plan_v3',
    JSON.stringify({
      plan: DEFAULT_PLAN,
      currentBlockIndex: 0,
      status: 'running',
      targetEndTime: Date.now() - 5000,
      remainingMs: 1000,
      totalDurationMs: 25 * 60 * 1000,
    })
  );

  await useTimerStore.getState().loadPersistedState();
  const state = useTimerStore.getState();
  assert.equal(state.currentBlockIndex, 1);
  assert.equal(state.status, 'idle');
  assert.equal(state.remainingMs, 5 * 60 * 1000);
});

test('autoStartNext timeout is cancelled if reset is called before it fires', async () => {
  useTimerStore.getState().updatePlan({ autoStartNext: true });
  useTimerStore.getState().skip();
  assert.equal(useTimerStore.getState().currentBlockIndex, 1);

  // User resets within the 500ms autoStartNext window
  useTimerStore.getState().reset();
  assert.equal(useTimerStore.getState().currentBlockIndex, 0);
  assert.equal(useTimerStore.getState().status, 'idle');

  await new Promise((r) => setTimeout(r, 600));
  assert.equal(useTimerStore.getState().status, 'idle');
});
