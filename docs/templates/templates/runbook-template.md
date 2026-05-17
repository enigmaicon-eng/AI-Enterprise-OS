---
type: runbook
system: <system name>
operation: <what operation this covers>
created: <YYYY-MM-DD>
author: docs-agent
last-tested: <YYYY-MM-DD>
status: current | needs-update | deprecated
---

# Runbook: <Operation Name>

## Purpose

`<One sentence: what does this runbook help you do?>`

## When to Use This Runbook

`<Describe the situation where you'd reach for this>`

---

## Prerequisites

**Access required:**
- [ ] `<permission or role>`
- [ ] `<tool or credential>`

**Tools required:**
- `<tool name>` — `<how to install/access>`

---

## Steps

### 1. `<Step Name>`

```bash
<exact command>
```

**Expected output:**
```
<what you should see>
```

**If you see something different:** `<what to check>`

---

### 2. `<Step Name>`

```bash
<exact command>
```

**Expected output:**
```
<what you should see>
```

---

### N. Verify Success

```bash
<verification command>
```

**Success looks like:** `<description>`
**Failure looks like:** `<description + what to do>`

---

## Rollback

If something goes wrong during this operation:

```bash
<rollback command>
```

**Expected rollback time:** `<N minutes>`

---

## Escalation

If this runbook fails or produces unexpected results:
1. Stop immediately — do not continue
2. Contact: `<on-call handle or team>`
3. Preserve: `<what logs or state to preserve>`
4. Reference: `<where to find additional help>`

---

## Notes

`<Any important context, known issues, or gotchas>`

---

## Change Log

| Date | Changed By | Change |
|------|-----------|--------|
| | | Initial version |
