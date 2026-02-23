---
name: todoist
description: "Manage tasks in Todoist. Use when user asks about tasks, to-dos, reminders, or productivity."
metadata: {"nanobot":{"emoji":"✅","requires":{"bins":["todoist"]}}}
always: true
---

# Todoist CLI

CLI for Todoist task management. All output is JSON.

Every response has `{"ok": true, ...}` on success or `{"ok": false, "error": "..."}` on failure.

## Commands

### List tasks

```bash
todoist list                       # All tasks
todoist list --filter "today"      # Due today or overdue
todoist list --filter "no date"    # Tasks with no due date
```

### Add task

```bash
todoist add "Buy groceries"
todoist add "Meeting" --due "2026-02-23T10:00"
todoist add "Review PR" --due "2026-02-22" --priority 1
todoist add "Call mom" --label "family"
todoist add "Design doc" --description "Draft the v2 spec"
```

### Complete / reopen

```bash
todoist done <id>
todoist reopen <id>
```

### View task

```bash
todoist view <id>
```

### Update task

```bash
todoist update <id> --content "New title"
todoist update <id> --due "2026-03-01"
todoist update <id> --priority 2
todoist update <id> --description "Updated notes"
```

### Delete task

```bash
todoist delete <id>
```

### Search

```bash
todoist search "meeting"
```

## Notes

- Output is always JSON — parse `ok` field to check success
- Task IDs are in every response — use them for done/update/delete
- Due dates use ISO format: `YYYY-MM-DD` for date only, `YYYY-MM-DDTHH:mm` for date+time
- Priority: 1 = highest, 4 = lowest
- Always search or list before completing a task to get the correct ID
- All tasks go in the Inbox
