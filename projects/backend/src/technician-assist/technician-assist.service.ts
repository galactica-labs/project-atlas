import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type {
  CreateTranscriptEntryDto,
  ManualTaskSearchResponseDto,
  RealtimeSessionRequestDto,
  RealtimeSessionResponseDto,
  TranscriptEntryDto,
} from "./dto/technician-assist.dto";
import {
  cosineSimilarity,
  loadTaskDocs,
  loadTaskEmbeddings,
  type ManualTaskView,
  toManualTaskView,
} from "./task-docs";

const MAX_TRANSCRIPT_ENTRIES = 200;

@Injectable()
export class TechnicianAssistService {
  private readonly logger = new Logger(TechnicianAssistService.name);
  private readonly transcripts: TranscriptEntryDto[] = [];

  constructor(private readonly configService: ConfigService) {}

  listManualTasks() {
    return this.loadManualTasks();
  }

  async searchManualTask(description: string): Promise<ManualTaskSearchResponseDto> {
    const manualTasks = this.loadManualTasks();
    const query = description.trim().toLowerCase();
    const availableTasks = manualTasks.map((task) => task.title);

    if (!query) {
      return {
        found: false,
        steps: [],
        availableTasks,
      };
    }

    const directTitle = manualTasks.find((task) => query.includes(task.title.toLowerCase()));
    if (directTitle) {
      return this.toSearchResult(directTitle, "direct");
    }

    const embeddingMatch = await this.searchByEmbedding(query, manualTasks);
    if (embeddingMatch) {
      return this.toSearchResult(embeddingMatch.task, undefined, embeddingMatch.alternatives);
    }

    let bestKeywordTask: ManualTaskView | null = null;
    let bestKeywordLength = 0;

    for (const task of manualTasks) {
      for (const keyword of task.keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedKeyword.length > bestKeywordLength && query.includes(normalizedKeyword)) {
          bestKeywordLength = normalizedKeyword.length;
          bestKeywordTask = task;
        }
      }
    }

    if (bestKeywordTask) {
      return this.toSearchResult(bestKeywordTask, "keyword");
    }

    const queryTokens = this.tokenize(query);
    const scored = manualTasks
      .map((task) => ({
        task,
        score: this.scoreTask(queryTokens, task),
      }))
      .sort((left, right) => right.score - left.score);

    const best = scored[0];
    if (!best || best.score < 2) {
      return {
        found: false,
        steps: [],
        matchMethod: "token",
        availableTasks,
        alternatives: scored.slice(0, 3).map((entry) => entry.task.title),
      };
    }

    return this.toSearchResult(
      best.task,
      "token",
      scored
        .slice(1, 4)
        .filter((entry) => entry.score >= 2)
        .map((entry) => entry.task.title)
    );
  }

  async createRealtimeSession(
    request: RealtimeSessionRequestDto = {}
  ): Promise<RealtimeSessionResponseDto> {
    const apiKey = this.configService.get<string>("ai.openAiApiKey");
    if (!apiKey) {
      throw new InternalServerErrorException("OPENAI_API_KEY is not set on the server");
    }

    const manualTasks = this.loadManualTasks();
    const taskList = manualTasks.map((task) => `- ${task.title}`).join("\n");
    const contextBits = [request.jobTitle, request.assetName, request.taskHint].filter(Boolean);
    const contextLine =
      contextBits.length > 0
        ? `Current technician context: ${contextBits.join(" | ")}.`
        : "Current technician context: general HP EliteDesk 800 G3 SFF bench support.";

    const payload = {
      session: {
        type: "realtime",
        model: this.configService.get<string>("ai.realtimeModel", "gpt-realtime-2"),
        instructions: [
          "You are Atlas Bench Guide, a real-time visual technician assistant for the HP EliteDesk 800 G3 SFF Business PC.",
          contextLine,
          "You receive camera frames from the technician and respond with short spoken guidance.",
          "Always keep responses brief because the technician is working with hardware.",
          "Always prefer visible spatial language such as 'front-left USB port', 'green jumper', or 'dark blue SATA0 connector'.",
          "Only provide procedural service guidance after first calling the get_manual_task_steps tool.",
          "Do not invent hardware service steps from memory when the tool has not been called.",
          "If the request does not match available documentation, say so clearly and ask the technician to rephrase using one of the supported task names.",
          "When the tool returns steps, guide one step at a time and wait for confirmation before moving forward.",
          "If a step involves opening the chassis or touching internal parts, remind the technician to disconnect AC power first.",
          `Supported manual tasks:\n${taskList}`,
        ].join("\n\n"),
        tools: [
          {
            type: "function",
            name: "get_manual_task_steps",
            description:
              "Look up indexed HP EliteDesk 800 G3 SFF manual steps. Always call this before giving step-by-step hardware guidance.",
            parameters: {
              type: "object",
              properties: {
                task_description: {
                  type: "string",
                  description:
                    "Short keyword phrase such as 'rear panel', 'upgrade memory', 'clear bios', 'password jumper', or 'm.2 ssd'. Use 1-4 keywords.",
                },
              },
              required: ["task_description"],
            },
          },
        ],
        tool_choice: "auto",
        audio: {
          output: {
            voice: this.configService.get<string>("ai.realtimeVoice", "marin"),
          },
        },
      },
    };

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Failed to mint realtime client secret: ${response.status} ${detail}`);
      throw new InternalServerErrorException("Failed to mint realtime client secret");
    }

    const data = (await response.json()) as {
      value?: string;
      expires_at?: number;
      client_secret?: { value?: string; expires_at?: number };
    };

    const value = data.value ?? data.client_secret?.value;
    if (!value) {
      throw new InternalServerErrorException("OpenAI did not return a client secret");
    }

    return {
      value,
      expiresAt: data.expires_at ?? data.client_secret?.expires_at ?? null,
    };
  }

  addTranscript(entry: CreateTranscriptEntryDto) {
    this.transcripts.unshift({
      engineerId: entry.engineerId,
      engineerName: entry.engineerName,
      role: entry.role,
      text: entry.text,
      timestamp: entry.timestamp,
    });

    if (this.transcripts.length > MAX_TRANSCRIPT_ENTRIES) {
      this.transcripts.length = MAX_TRANSCRIPT_ENTRIES;
    }

    return { ok: true };
  }

  listTranscripts() {
    return this.transcripts;
  }

  private toSearchResult(
    task: ManualTaskView,
    matchMethod?: "direct" | "keyword" | "token",
    alternatives: string[] = []
  ): ManualTaskSearchResponseDto {
    return {
      found: true,
      title: task.title,
      summary: task.summary,
      sourceSection: task.sourceSection,
      steps: task.steps,
      matchMethod,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  private loadManualTasks() {
    return loadTaskDocs().map((task) => toManualTaskView(task));
  }

  private async searchByEmbedding(query: string, manualTasks: ManualTaskView[]) {
    const apiKey = this.configService.get<string>("ai.openAiApiKey");
    const embeddings = loadTaskEmbeddings(this.configService.get<string>("ai.taskEmbeddingsPath"));

    if (!apiKey || !embeddings || embeddings.tasks.length === 0) {
      return null;
    }

    try {
      const client = new OpenAI({ apiKey });
      const response = await client.embeddings.create({
        model: this.configService.get<string>("ai.embeddingModel", "text-embedding-3-small"),
        input: query,
      });
      const queryEmbedding = response.data[0]?.embedding ?? [];

      const ranked = embeddings.tasks
        .map((task) => ({
          task,
          score: cosineSimilarity(queryEmbedding, task.embedding),
        }))
        .sort((left, right) => right.score - left.score);

      const best = ranked[0];
      if (!best || best.score < 0.35) {
        return null;
      }

      const selected = manualTasks.find((task) => task.id === best.task.id);
      if (!selected) {
        return null;
      }

      return {
        task: selected,
        alternatives: ranked
          .slice(1, 4)
          .map((entry) => entry.task.title)
          .filter((title) => title !== selected.title),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding search failed, falling back to token search: ${message}`);
      return null;
    }
  }

  private tokenize(value: string) {
    return value
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  private scoreTask(queryTokens: string[], task: ManualTaskView) {
    const corpus = [task.title, task.summary, task.sourceSection, ...task.keywords]
      .join(" ")
      .toLowerCase();

    return queryTokens.reduce((score, token) => {
      if (task.title.toLowerCase().includes(token)) return score + 4;
      if (task.keywords.some((keyword) => keyword.toLowerCase().includes(token))) return score + 3;
      if (corpus.includes(token)) return score + 1;
      return score;
    }, 0);
  }
}
