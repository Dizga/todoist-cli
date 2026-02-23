#!/usr/bin/env bun

import { TodoistApi } from "@doist/todoist-api-typescript";

const token = process.env.TODOIST_API_TOKEN;
if (!token) {
  console.log(JSON.stringify({ ok: false, error: "TODOIST_API_TOKEN not set" }));
  process.exit(1);
}

const api = new TodoistApi(token);

type TaskSummary = {
  id: string;
  content: string;
  description: string;
  priority: number;
  labels: string[];
  due: string | null;
  is_recurring: boolean;
};

function summarize(task: any): TaskSummary {
  return {
    id: task.id,
    content: task.content,
    description: task.description || "",
    priority: 5 - task.priority,
    labels: task.labels || [],
    due: task.due?.date ?? task.due?.datetime ?? null,
    is_recurring: task.due?.isRecurring ?? false,
  };
}

function ok(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ok: true, ...data }));
}

function fail(error: string) {
  console.log(JSON.stringify({ ok: false, error }));
  process.exit(1);
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return flags;
}

const [cmd, ...rest] = process.argv.slice(2);

try {
  switch (cmd) {
    case "list": {
      const flags = parseFlags(rest);
      const filter = flags.filter;
      const resp = await api.getTasks();
      let tasks = resp.results;
      if (filter === "today") {
        const today = new Date().toISOString().slice(0, 10);
        tasks = tasks.filter((t) => {
          const due = t.due?.date ?? t.due?.datetime?.slice(0, 10);
          return due && due <= today;
        });
      } else if (filter === "no date") {
        tasks = tasks.filter((t) => !t.due);
      }
      ok({ tasks: tasks.map(summarize) });
      break;
    }

    case "add": {
      const content = rest.find((a) => !a.startsWith("--"));
      if (!content) fail("Usage: todoist add <content> [--due <date>] [--priority <1-4>] [--label <name>]");
      const flags = parseFlags(rest);
      const task = await api.addTask({
        content,
        ...(flags.due && (flags.due.includes("T")
          ? { dueDatetime: flags.due }
          : { dueDate: flags.due })),
        ...(flags.priority && { priority: 5 - parseInt(flags.priority) }),
        ...(flags.label && { labels: [flags.label] }),
        ...(flags.description && { description: flags.description }),
      });
      ok({ task: summarize(task) });
      break;
    }

    case "done": {
      const id = rest[0];
      if (!id) fail("Usage: todoist done <task_id>");
      await api.closeTask(id);
      ok({ completed: id });
      break;
    }

    case "reopen": {
      const id = rest[0];
      if (!id) fail("Usage: todoist reopen <task_id>");
      await api.reopenTask(id);
      ok({ reopened: id });
      break;
    }

    case "view": {
      const id = rest[0];
      if (!id) fail("Usage: todoist view <task_id>");
      const task = await api.getTask(id);
      ok({ task: summarize(task) });
      break;
    }

    case "update": {
      const id = rest[0];
      if (!id) fail("Usage: todoist update <task_id> [--content <text>] [--due <date>] [--priority <1-4>]");
      const flags = parseFlags(rest.slice(1));
      const task = await api.updateTask(id, {
        ...(flags.content && { content: flags.content }),
        ...(flags.due && (flags.due.includes("T")
          ? { dueDatetime: flags.due }
          : { dueDate: flags.due })),
        ...(flags.priority && { priority: 5 - parseInt(flags.priority) }),
        ...(flags.description && { description: flags.description }),
        ...(flags.label && { labels: [flags.label] }),
      });
      ok({ task: summarize(task) });
      break;
    }

    case "delete": {
      const id = rest[0];
      if (!id) fail("Usage: todoist delete <task_id>");
      await api.deleteTask(id);
      ok({ deleted: id });
      break;
    }

    case "search": {
      const query = rest.find((a) => !a.startsWith("--"));
      if (!query) fail("Usage: todoist search <query>");
      const resp = await api.getTasks();
      const q = query.toLowerCase();
      const matched = resp.results.filter(
        (t) =>
          t.content.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
      ok({ tasks: matched.map(summarize) });
      break;
    }

    case "help":
    case undefined: {
      ok({
        commands: {
          "list": "List tasks. --filter <todoist_filter>",
          "add": "Add task. <content> --due <date> --priority <1-4> --label <name> --description <text>",
          "done": "Complete task. <task_id>",
          "reopen": "Reopen task. <task_id>",
          "view": "View task. <task_id>",
          "update": "Update task. <task_id> --content <text> --due <date> --priority <1-4>",
          "delete": "Delete task. <task_id>",
          "search": "Search tasks. <query>",
        },
      });
      break;
    }

    default:
      fail(`Unknown command: ${cmd}. Run 'todoist help' for usage.`);
  }
} catch (e: any) {
  fail(e.message || String(e));
}
