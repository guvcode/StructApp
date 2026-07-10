# Agent Workflow Rules

Run these rules at the start of EVERY task:

## Task Selection Workflow

1. **Context is restored** — ensure `/remember restore` was run at session start (or run it now if missed)
2. **Use `/architect` to probe the task** — Align on language and decisions before coding
3. **Create task branch** — `git checkout -b task/FEATURE-ID-short-description`; verify with `git symbolic-ref --short HEAD`
4. **Write failing test first** — Write the test, run only that test with `--testNamePattern`, confirm it fails for the right reason
5. **Implement the task** — Build only what was planned; stop when the new test passes
6. **Run `/checkregression`** — Before touching any existing code, scan the codebase for all callers, importers, and dependents. Validate no downstream code breaks. **This is mandatory — never skip.**
7. **Run `/review`** — Verify work matches plan and respects system standards
8. **Apply fixes** identified in checkregression and review
9. **Commit to task branch** — `git add` only task files; `git commit` with descriptive message
10. **Run `/remember save`** — Persist state to `memory.md` for next session

## Branching Convention

- ONE branch per atomic task: `task/FEATURE-ID-short-description`
- NEVER work on a branch that isn't the task branch — check with `git symbolic-ref --short HEAD` before starting
- NEVER cherry-pick across branches to "fix" history — create the work in the right place the first time
- NEVER `git reset --hard` on a branch with shared commits — use `git revert` or start a new branch from the correct base
- NEVER `git checkout -B` or `git branch -D` on branches containing commits used elsewhere

## Task Completion Checklist

After every task, before `/remember save`, the session must show verified completion of all items for the active task:

- [ ] Architect probe completed with clear plan (output "Blueprint ready" achieved)
- [ ] Failing test written first and verified to fail
- [ ] Implementation makes that test pass
- [ ] Tests pass: `npx jest tests/FILE.test.ts --testNamePattern "NEW_TEST_NAME"`
- [ ] TypeScript compiles clean: `npx tsc --noEmit --skipLibCheck` (exclude migration/test rootDir errors)
- [ ] Regression check completed — no breaking changes to existing callers (`/checkregression`)
- [ ] Review completed with no critical issues (output "No issues found" or fixes applied)
- [ ] Changes committed to task branch
- [ ] `.doc/10-progress-tracker.md` updated and committed
- [ ] Memory saved

**STOP:** If any item is unchecked, do NOT run `/remember save`. Return to fix the gap.

## Status Tracking

Update `.doc/10-progress-tracker.md` after each task:
- Mark task status: ⬜ NOT STARTED → 🟨 IN PROGRESS → 🟩 COMPLETED
- Update Sprint counters

## Anti-Patterns to NEVER Repeat

| Anti-Pattern | Why It Breaks | Correct Approach |
|---|---|---|
| Skipping failing-test-first step | Work gets built without verification; bugs hidden | Run test, confirm failure, then implement |
| Cherry-picking across branches to "fix" history | Creates duplicate commits, merge conflicts, lost work | Write code in the right branch the first time |
| `git reset --hard` on shared history | Deletes commits other branches reference; requires re-implementation | Use `git revert` or create a new branch |
| PowerShell `cmd1 \|\| cmd2` syntax | PowerShell 5.1 does not support `||` | Use `; if ($?) { cmd2 }` |
| Test imports wrong module path | Test passes vacuously or fails with module not found | Import must match actual file path |
| Committing to wrong branch | Work gets orphaned or mixed with unrelated tasks | Verify branch before every commit |
| Skipping review skill | Defects compound across features | Run review before committing |
| Modifying or deleting existing code without regression check | Unknowingly breaks downstream callers, causing silent failures or runtime errors | Run `/checkregression` before every commit to scan all dependents |
| No lint step | Type errors accumulate silently | Run `tsc --noEmit --skipLibCheck` before commit |
| Forgetting memory save | Context lost between sessions | `/remember save` is the final step, no exceptions |

## Lint Gate

If `tsc --noEmit --skipLibCheck` produces real TypeScript errors (exclude TS6059 rootDir errors from migrations/tests), fix them before committing.
