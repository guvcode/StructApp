---
name: checkregression
description: Before committing any change that modifies, deletes, or updates existing code, scan the codebase for all callers, importers, and dependents to validate the change will not cause regressions. Reports impacted surfaces so the developer can assess risk.
---

## Mandatory — Execute Before Every Commit

Do not commit a change to any function, method, route handler, React component, API service, type definition, database migration, or npm package without first verifying that nothing downstream breaks.

Skipping this skill is how regressions get shipped.

---

## Step 1 — Identify Every Surface Changed

Run the following against the current working tree:

```powershell
git diff --name-only
```

For each changed file, identify:
- What **exported symbols** (functions, types, classes, constants) have been added, removed, renamed, or had their signature changed
- What **files** have been added or deleted entirely
- What **dependencies** (npm packages, internal modules) have been added, removed, or upgraded

---

## Step 2 — Trace Every Impacted Surface

For each changed symbol or file, search the entire codebase for:

### For deleted or renamed symbols:
```
rg "oldFunctionName|oldTypeName|oldFilePath"
```

### For signature changes (new required params, removed params, type narrowing):
```
rg "functionName" --include "*.{ts,tsx}"
```

Read every file that references the changed symbol. Not just the import line — read enough context to understand how the symbol is called.

### For deleted files:
```
rg "old/file/path" --include "*.{ts,tsx,js,json}"
```

### For dependency changes:
Search `package.json` files in all apps and packages for the changed dependency.

---

## Step 3 — Classify Each Finding

For each caller found, classify the impact:

| Impact | Meaning | Action |
|---|---|---|
| **BREAKING** | The caller will fail at compile or runtime | Block the commit until fixed or the caller is updated |
| **WARNING** | The caller may behave differently but won't crash | Flag for developer review |
| **CLEAN** | The caller is unaffected | No action needed |

A caller is **BREAKING** if:
- A function it imports has been deleted or renamed
- A required parameter has been added to a function it calls
- A parameter it passes has been removed
- The return type has changed and the caller destructures a now-missing field
- A file it imports has been deleted
- An npm package it depends on has been removed
- A type it uses has been narrowed in a way incompatible with its usage

A caller is **WARNING** if:
- An optional parameter has been added (caller still works but may miss new behaviour)
- The return type has added new optional fields (caller still works)
- A parameter type has widened (caller still passes valid values)

---

## Step 4 — Report Before Committing

```
## Regression Check — [Feature/Change Description]

### Files changed
[list of changed files]

### Impacted surfaces found
[X] total callers checked

### BREAKING — must fix
- [file:line] — [description of breaking change]

### WARNING — review recommended
- [file:line] — [description of potential behavioural difference]

### Summary
[If BREAKING count > 0: "X breaking issues found. Do not commit until resolved."]
[If BREAKING count === 0 and WARNING count > 0: "No breaking issues. Warnings flagged for review."]
[If BREAKING count === 0 and WARNING count === 0: "No regressions detected. Safe to commit."]
```

---

## Step 5 — Prescribe the Response

### If BREAKING found:
1. Map every caller that will break
2. Either:
   - Update the caller to match the new signature/behaviour, OR
   - Add a compatibility wrapper so the old interface still works, OR
   - Revert the change that introduced the breakage
3. Re-run the regression check after fixing
4. Only proceed to commit when BREAKING = 0

### If WARNING only:
1. Present the warnings to the developer
2. The developer decides whether to act or accept
3. Re-run the check if any changes were made

### If CLEAN:
Safe to commit. Proceed.

---

## Tools for Tracing

| Task | Tool |
|---|---|
| Find all files that import a module | `rg "from 'module-path'"` or `rg "require('module-path')"` |
| Find all callers of a function | `rg "functionName\("` |
| Find usages of a type | `rg "TypeName"` |
| Find imports of a file | `rg "file/path/without/extension"` |
| Check npm package usage | `rg "package-name" --glob "package.json"` |
| Find re-exports | `rg "export.*from" --glob "index.ts"` |
| Trace barrel file exports | Read the `index.ts` or barrel file to see what is re-exported |

Always prefer `rg` (ripgrep) over glob + grep for content searches. Use glob for file name searches only.

---

## The Standard

The question this skill answers is "will this change break something else?"

A change that works in isolation but breaks the rest of the system is not done. The whole system must hold. Regression checking is how you verify that.