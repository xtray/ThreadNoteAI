import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSaga, stdChannel } from 'redux-saga';
import { persistenceSaga } from './persistenceSaga';
import { initDB, saveMessage, saveSession, saveActiveSessionId, saveNote, replaceAllNotesData } from '../../utils/db';

vi.mock('../../utils/db', () => ({
  initDB: vi.fn(), saveMessage: vi.fn(), saveSession: vi.fn(), saveActiveSessionId: vi.fn(),
  saveNote: vi.fn(), replaceAllNotesData: vi.fn(), replaceAllSessionsData: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());

describe('persistence after delayed database initialization', () => {
  it.each(['createSession', 'spawnSession', 'addMessage'])('does not resurrect a deleted session for %s', async (type) => {
    let release!: () => void;
    vi.mocked(initDB).mockReturnValue(new Promise<any>((resolve) => { release = () => resolve({}); }));
    const channel = stdChannel();
    const task = runSaga({ channel, getState: () => ({ sessions: { sessions: {}, activeSessionId: null } }) }, persistenceSaga);
    const session = { id: 'deleted', messages: [] };
    channel.put({ type: `sessions/${type}`, payload: type === 'addMessage'
      ? { sessionId: 'deleted', message: { id: 'message', content: 'old' } } : session });
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    task.cancel();
    await task.toPromise();
    expect(saveSession).not.toHaveBeenCalled();
    expect(saveMessage).not.toHaveBeenCalled();
    expect(saveActiveSessionId).not.toHaveBeenCalled();
  });
});

it('does not resurrect a deleted note after delayed initialization', async () => {
  let release!: () => void;
  vi.mocked(initDB).mockReturnValue(new Promise<any>((resolve) => { release = () => resolve({}); }));
  const channel = stdChannel();
  const task = runSaga({ channel, getState: () => ({ notes: { notes: {} } }) }, persistenceSaga);
  channel.put({ type: 'notes/upsertNote', payload: { id: 'deleted-note', content: 'old' } });
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  task.cancel();
  await task.toPromise();
  expect(saveNote).not.toHaveBeenCalled();
});

it('saves the current message rather than an outdated action payload', async () => {
  let release!: () => void;
  vi.mocked(initDB).mockReturnValue(new Promise<any>((resolve) => { release = () => resolve({}); }));
  const message = { id: 'message', content: 'latest', annotations: [{ id: 'annotation' }] };
  const session = { id: 'session', messages: [message] };
  const channel = stdChannel();
  const task = runSaga({ channel, getState: () => ({ sessions: { sessions: { session } } }) }, persistenceSaga);
  channel.put({ type: 'sessions/addMessage', payload: { sessionId: 'session', message: { id: 'message', content: 'old' } } });
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  task.cancel();
  await task.toPromise();
  expect(saveSession).toHaveBeenCalledWith(session);
  expect(saveMessage).toHaveBeenCalledWith('session', message);
});

it('does not replace current notes with an outdated load payload', async () => {
  let release!: () => void;
  vi.mocked(initDB).mockReturnValue(new Promise<any>((resolve) => { release = () => resolve({}); }));
  const notes = { current: { id: 'current', content: 'latest' } };
  const channel = stdChannel();
  const task = runSaga({ channel, getState: () => ({ notes: { notes } }) }, persistenceSaga);
  channel.put({ type: 'notes/loadNotes', payload: {} });
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  task.cancel();
  await task.toPromise();
  expect(replaceAllNotesData).toHaveBeenCalledWith(notes);
});
