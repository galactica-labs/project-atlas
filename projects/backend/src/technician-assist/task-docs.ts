import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const taskDocSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  keywords: z.array(z.string().min(1)).default([]),
  category: z.string().min(1),
  content: z.string().min(1),
});

const taskDocsSchema = z.array(taskDocSchema);

const taskEmbeddingSchema = taskDocSchema.extend({
  embedding: z.array(z.number()),
  summary: z.string(),
  sourceSection: z.string(),
  steps: z.array(z.string()),
});

const taskEmbeddingsFileSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  tasks: z.array(taskEmbeddingSchema),
});

export type TaskDoc = z.infer<typeof taskDocSchema>;
export type TaskEmbeddingRecord = z.infer<typeof taskEmbeddingSchema>;

export interface ManualTaskView {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  sourceSection: string;
  steps: string[];
  category: string;
  content: string;
}

function resolveBackendFilePath(relativePath: string, envPath?: string) {
  const candidates = [
    envPath,
    join(process.cwd(), relativePath),
    join(process.cwd(), "projects/backend", relativePath),
  ].filter((value): value is string => Boolean(value));

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Could not find file for ${relativePath}`);
  }

  return found;
}

function stripMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSteps(content: string) {
  const steps = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim());

  return steps;
}

function extractSummary(content: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((part) => stripMarkdown(part))
    .filter(Boolean)
    .filter((part) => !part.startsWith("Steps"));

  return paragraphs[1] ?? paragraphs[0] ?? "Task reference";
}

function titleCaseCategory(category: string) {
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toManualTaskView(task: TaskDoc): ManualTaskView {
  return {
    id: task.id,
    title: task.title,
    keywords: task.keywords,
    category: task.category,
    content: task.content,
    summary: extractSummary(task.content),
    sourceSection: `Category: ${titleCaseCategory(task.category)}`,
    steps: extractSteps(task.content),
  };
}

export function loadTaskDocs(taskDocsPath?: string) {
  const resolvedPath = resolveBackendFilePath(
    "src/technician-assist/data/tasks.json",
    taskDocsPath ?? process.env.TASK_DOCS_PATH
  );
  const raw = readFileSync(resolvedPath, "utf8");
  return taskDocsSchema.parse(JSON.parse(raw));
}

export function loadTaskEmbeddings(taskEmbeddingsPath?: string) {
  try {
    const resolvedPath = resolveBackendFilePath(
      "src/technician-assist/data/task-embeddings.generated.json",
      taskEmbeddingsPath ?? process.env.TASK_EMBEDDINGS_PATH
    );
    const raw = readFileSync(resolvedPath, "utf8");
    return taskEmbeddingsFileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function toEmbeddingInput(task: TaskDoc) {
  return [
    `Title: ${task.title}`,
    `Category: ${task.category}`,
    `Keywords: ${task.keywords.join(", ")}`,
    task.content,
  ].join("\n\n");
}
