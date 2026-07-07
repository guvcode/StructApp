# 23. Operator Workflow

This section defines **what the developer actually types** when operating the AI agent against the StructApp build plan.

The goal is to avoid manually copying the long prompts from every bundle section.  
In normal use, the developer should only need a **small set of reusable prompts** to:

1. start or resume the project
2. start a bundle
3. approve the architect plan and trigger the build
4. request review
5. accept the bundle and move to the next one
6. request fixes for the current bundle
7. recover from a bad implementation

---

## 23.1 Files the developer should keep available to the agent

The agent should always have access to these files:

- `structapp_jsm_skills_build_plan.md`
- `structapp_prioritized_mvp_backlog.md`
- `structapp_screen_navigation_design.md`
- `structapp_menu_navigation_ux_spec.md`
- `structapp_module_personas_user_journeys.md`

If the tool supports persistent workspace context, these files only need to be loaded once.

---

## 23.2 Normal operating model

The developer should use the following workflow for each bundle:

1. start or resume the project
2. ask the agent to architect the current bundle
3. review the architect output
4. approve the architect output and let the agent build
5. review the build result
6. either:
   - accept the bundle and move to the next one, or
   - keep the agent on the same bundle to fix issues
7. if the implementation drifts badly, trigger recovery

---

## 23.3 Prompt library

### 23.3.1 Start or resume the project

Use this at the beginning of the project or the beginning of a new session.

#### Prompt
```text
Follow `structapp_jsm_skills_build_plan.md` as the execution controller for this project.

Also use these supporting files:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Start by restoring memory if supported, then determine the correct next bundle from the build plan.
Do not code immediately.
Run the architect phase for that bundle first and stop for approval.
Do not skip bundle gates.
```

---

### 23.3.2 Start a specific bundle

Use this when you want to explicitly direct the agent to a particular bundle.

#### Prompt
```text
Work on Bundle [X] — [Bundle Name] from `structapp_jsm_skills_build_plan.md`.

Process:
1. restore memory if supported
2. read the bundle section and the referenced StructApp docs
3. run the architect phase for this bundle only
4. stop for approval before coding

Do not build anything yet.
```

#### Example
```text
Work on Bundle 6 — Contractor Mobile Field Workflow from `structapp_jsm_skills_build_plan.md`.

Process:
1. restore memory if supported
2. read the bundle section and the referenced StructApp docs
3. run the architect phase for this bundle only
4. stop for approval before coding

Do not build anything yet.
```

---

### 23.3.3 Approve the architect plan and trigger the build

Use this after you have reviewed the architect output and want the agent to proceed.

#### Prompt
```text
The architect plan for Bundle [X] — [Bundle Name] is approved.

Build the bundle exactly as planned.
Do not add scope outside the approved bundle.

When complete:
1. run the review phase for the bundle
2. summarize issues or gaps
3. save memory/checkpoint if supported
4. stop and wait for my confirmation before moving to the next bundle
```

#### Example
```text
The architect plan for Bundle 6 — Contractor Mobile Field Workflow is approved.

Build the bundle exactly as planned.
Do not add scope outside the approved bundle.

When complete:
1. run the review phase for the bundle
2. summarize issues or gaps
3. save memory/checkpoint if supported
4. stop and wait for my confirmation before moving to the next bundle
```

---

### 23.3.4 Run review only

Use this when the agent built something but did not automatically run the review step, or when you want a second review pass.

#### Prompt
```text
Run the review phase for Bundle [X] — [Bundle Name] from `structapp_jsm_skills_build_plan.md`.

Review against:
- the approved architect plan
- the bundle acceptance criteria
- the relevant StructApp design documents
- role, menu, and route constraints
- loading, empty, error, and offline states where relevant

Return:
1. pass/fail summary
2. issues by severity
3. required fixes before the next bundle
4. optional improvements
5. whether the bundle is ready to accept
```

---

### 23.3.5 Accept the bundle and move to the next one

Use this after the bundle has passed review and you want the agent to continue.

#### Prompt
```text
Bundle [X] is accepted.

Update memory/checkpoint if needed and proceed to the next bundle defined in `structapp_jsm_skills_build_plan.md`.

Start with the architect phase for the next bundle only.
Do not code until the architect output is approved.
```

#### Example
```text
Bundle 6 is accepted.

Update memory/checkpoint if needed and proceed to the next bundle defined in `structapp_jsm_skills_build_plan.md`.

Start with the architect phase for the next bundle only.
Do not code until the architect output is approved.
```

---

### 23.3.6 Stay on the same bundle and fix review findings

Use this when the review found issues and you want the agent to correct the current bundle rather than move on.

#### Prompt
```text
Do not move to the next bundle.

Stay on Bundle [X] — [Bundle Name] and fix only the review findings.
Do not add new scope.

After the fixes:
1. rerun review for this bundle
2. summarize what changed
3. stop for approval
```

---

### 23.3.7 Recover from a bad implementation

Use this when the implementation has drifted from the plan or become unstable.

#### Prompt
```text
Use the recovery workflow for Bundle [X] — [Bundle Name].

The implementation has drifted or become unstable.

Do this:
1. restore memory if supported
2. analyze the current bundle against the build plan and supporting docs
3. classify the issue as one of:
   - Targeted fix
   - Hard reset
   - Rethink
4. recommend the safest recovery path
5. do not implement changes until I approve the recovery plan
```

---

## 23.4 Recommended day-to-day loop

For each bundle, the developer should follow this sequence:

### Step 1 — Start or resume the session
Use the **Start or resume the project** prompt.

### Step 2 — Architect the bundle
Use the **Start a specific bundle** prompt.

### Step 3 — Review the architect output
Check the following before approving:

- Is the scope limited to the current bundle?
- Is the agent trying to sneak in future bundle work?
- Is it respecting the route and menu rules?
- Is it referencing the correct StructApp documents?
- Does the implementation order make sense?

### Step 4 — Approve the build
Use the **Approve the architect plan and trigger the build** prompt.

### Step 5 — Review the implementation result
If the build looks good, continue to Step 6.  
If it does not, use **Stay on the same bundle and fix review findings**.

### Step 6 — Accept and advance
Use **Accept the bundle and move to the next one**.

### Step 7 — Recover if needed
If the bundle drifted badly, use **Recover from a bad implementation**.

---

## 23.5 Fast prompts by scenario

### Scenario A — Start the project correctly
```text
Follow `structapp_jsm_skills_build_plan.md` as the execution controller for this project.

Also use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Start with the next required bundle.
Restore memory if supported.
Run the architect phase first and stop for approval.
Do not code yet.
```

---

### Scenario B — Move to the next bundle
```text
Proceed to the next bundle in `structapp_jsm_skills_build_plan.md`.

Restore memory if supported.
Run only the architect phase for that next bundle.
Stop before coding.
```

---

### Scenario C — Build the bundle that was just planned
```text
The architect plan is approved.

Build the current bundle exactly as planned.
Do not expand scope.
Run review after implementation and then stop.
```

---

### Scenario D — Fix only the review findings
```text
Stay on the current bundle.

Fix only the issues raised in the review.
Do not add new scope.
Rerun review after the fixes and stop.
```

---

### Scenario E — Recover the current bundle
```text
Use the recovery workflow for the current bundle.

Compare the implementation to:
- structapp_jsm_skills_build_plan.md
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Classify the issue as:
- Targeted fix
- Hard reset
- Rethink

Do not make changes until I approve the recovery plan.
```

---

## 23.6 What the developer should check before approving a bundle

Before approving a bundle architect plan or build result, check the following:

### Scope control
- Is the agent building only the current bundle?
- Did it avoid future bundles?
- Did it avoid P1/P2 features unless the bundle explicitly allows them?

### Route and menu safety
- Are routes aligned with `structapp_menu_navigation_ux_spec.md`?
- Are menu labels and visibility rules correct?
- Did it avoid inventing extra top-level navigation?

### Screen correctness
- Are the screens aligned with `structapp_screen_navigation_design.md`?
- Are empty/loading/error/offline states included where needed?

### Workflow correctness
- Did it follow the backlog and journey rules?
- Did it preserve approval, return, reopen, and override constraints?

### Maintainability
- Is the work broken into sane files/components?
- Is the implementation plan realistic for a single bundle?

If the answer to any of these is no, do not approve the bundle yet.

---

## 23.7 Recommended lightweight bundle tracking habit

For each bundle, keep a short checkpoint note with:

- bundle number
- architect approved? yes/no
- build complete? yes/no
- review passed? yes/no
- accepted? yes/no
- follow-up fixes needed?

This gives the developer a simple control layer even if the agent is also using memory checkpoints.

---

## 23.8 Usage note

The prompts in this section are intended to replace day-to-day manual use of the longer prompts scattered through the bundle sections.

Use the detailed bundle prompts only when:

- the agent is misunderstanding the bundle
- you need tighter control over a tricky feature
- you need to debug drift between architect, build, and review
- the agent does not reliably follow the shorter operator prompts
