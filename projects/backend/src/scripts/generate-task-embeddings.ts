import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import OpenAI from "openai";
import { loadTaskDocs, toEmbeddingInput, toManualTaskView } from "../technician-assist/task-docs";

const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const outputPath =
  process.env.TASK_EMBEDDINGS_PATH ||
  join(process.cwd(), "src/technician-assist/data/task-embeddings.generated.json");

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const tasks = loadTaskDocs();
  if (tasks.length === 0) {
    throw new Error("No task docs found in tasks.json");
  }

  const client = new OpenAI({ apiKey });
  const inputs = tasks.map((task) => toEmbeddingInput(task));
  const response = await client.embeddings.create({
    model,
    input: inputs,
  });

  const records = tasks.map((task, index) => ({
    ...task,
    ...toManualTaskView(task),
    embedding: response.data[index]?.embedding ?? [],
  }));

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model,
        tasks: records,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Wrote ${records.length} task embeddings to ${outputPath}`);
}

void main();
