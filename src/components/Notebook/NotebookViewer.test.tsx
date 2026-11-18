import { afterEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, effects: [] as (() => void)[], dispatch: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: () => harness.dispatch }));
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<any>();
    const hooks = {
        useState: (initial: any) => {
            const index = harness.cursor++;
            if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? initial() : initial;
            return [harness.slots[index], (next: any) => { harness.slots[index] = typeof next === 'function' ? next(harness.slots[index]) : next; }];
        },
        useRef: (initial: any) => {
            const index = harness.cursor++;
            return harness.slots[index] ||= { current: initial };
        },
        useMemo: (fn: any) => fn(),
        useCallback: (fn: any) => fn,
        useEffect: (fn: any, deps: any[]) => {
            const index = harness.cursor++;
            const previous = harness.slots[index];
            if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
                harness.effects.push(() => { previous?.cleanup?.(); harness.slots[index] = { deps, cleanup: fn() }; });
            }
        },
    };
    return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
import NotebookViewer from './NotebookViewer';
const note = { id: 'one', title: 'One', fileName: 'one.md', content: 'first\n\n\n\nsecond\n', updatedAt: 1 };
function render(value = note) {
    harness.cursor = 0;
    const tree = NotebookViewer({ note: value });
    const effects = harness.effects.splice(0);
    effects.forEach((run) => run());
    return tree;
}
function find(tree: any, predicate: (value: any) => boolean): any {
    if (!tree || typeof tree !== 'object') return undefined;
    if (predicate(tree)) return tree;
    return [tree.props?.children].flat(Infinity).map(child => find(child, predicate)).find(Boolean);
}
afterEach(() => { harness.slots = []; harness.effects = []; harness.dispatch.mockClear(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('notebook draft persistence', () => {
    it('does not rewrite blank lines merely by opening a note', () => {
        vi.useFakeTimers(); vi.stubGlobal('window', globalThis);
        render(); render(); vi.advanceTimersByTime(250);
        expect(harness.dispatch).not.toHaveBeenCalled();
    });
    it('saves the final edit before switching to another note', () => {
        vi.useFakeTimers(); vi.stubGlobal('window', { setTimeout, clearTimeout, requestAnimationFrame: () => 0 });
        render();
        const tree = render();
        find(tree, node => node.props?.className === 'notebook-render-view markdown-body').props.onMouseDown({ preventDefault() {} });
        const editing = render();
        find(editing, node => node.type === 'textarea').props.onChange({ target: { value: 'edited' } });
        render();
        render({ ...note, id: 'two', content: 'other' }); render({ ...note, id: 'two', content: 'other' });
        vi.advanceTimersByTime(250);
        expect(harness.dispatch.mock.calls.some(([action]) => action.payload.id === 'one' && action.payload.content.startsWith('edited'))).toBe(true);
        expect(harness.dispatch.mock.calls.some(([action]) => action.payload.id === 'two')).toBe(false);
    });
    it('keeps the active editor open when its saved content returns through Redux', () => {
        vi.stubGlobal('window', { requestAnimationFrame: () => 0 });
        render();
        const tree = render();
        find(tree, node => node.props?.className === 'notebook-render-view markdown-body').props.onMouseDown({ preventDefault() {} });
        const editing = render();
        find(editing, node => node.type === 'textarea').props.onChange({ target: { value: 'edited' } });
        const saved = harness.dispatch.mock.calls[0][0].payload;
        render(saved);
        expect(find(render(saved), node => node.type === 'textarea')).toBeDefined();
    });

    it('restores the saved draft after visiting another note and returning', () => {
        vi.stubGlobal('window', { requestAnimationFrame: () => 0 });
        render();
        const tree = render();
        find(tree, node => node.props?.className === 'notebook-render-view markdown-body').props.onMouseDown({ preventDefault() {} });
        find(render(), node => node.type === 'textarea').props.onChange({ target: { value: 'edited' } });
        const saved = harness.dispatch.mock.calls[0][0].payload;
        render(saved);
        render({ ...note, id: 'two', content: 'other' });
        render(saved);
        const returned = render(saved);
        const block = find(returned, node => node.props?.className === 'notebook-render-view markdown-body');
        expect(block.props.children.props.children).toBe('edited');
    });

});
