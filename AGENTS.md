# AGENTS.md

## Default Workflow
- Use skill `using-superpowers` at conversation start.
- Feature or behavior changes: run `brainstorming` -> `writing-plans` -> `test-driven-development` before implementation.
- When adding new features, preserve existing behavior and avoid breaking existing features.
- Bugfix/debug work: run `systematic-debugging` before proposing or applying fixes.
- Before claiming completion: run `verification-before-completion`.

## Parallel Development Default
- If a task can be split into independent subtasks, default to parallel development.
- Default parallel mode: `dispatching-parallel-agents` + `using-git-worktrees`.
- One independent subtask must use one isolated branch and one isolated worktree.
- Branch names must start with `codex/`.
- Prefer project-local `.worktrees/` as the worktree directory.
- Parallel agents must not edit the same files unless explicitly planned and synchronized.
- If subtasks are not independent or require shared state, do not force parallelization.

## Git Safety
- Never run destructive commands (`git reset --hard`, `git checkout --`) unless explicitly requested.
- Never revert unrelated local changes.
- Do not amend commits unless explicitly requested.

## Completion Gate
- Run project verification commands (tests/lint/typecheck as applicable) and report results.
- After code modifications, run `npm run build` to generate a fresh build and report the result.
- If verification fails, report failures and do not claim "done".

## Finishing and Integration
- Preferred integration path is Pull Request to `main` (or repository default branch).
- Before opening PR: `git fetch` and rebase branch onto latest `origin/main`, then rerun verification.
- For multiple parallel branches: merge lower-conflict PRs first; remaining branches must rebase onto updated `main` before merge.
- Merge to `main` only after review and required checks pass.
- After merge: sync local `main`, delete merged feature branch (local/remote as applicable), and remove corresponding worktree.
