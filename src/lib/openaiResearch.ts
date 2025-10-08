// lib/openaiResearch.ts

import React from "react";

// Define Job interface
export interface OpenAIResearchJob {
  id: string;
  status: "in_progress" | "completed" | "failed" | "cancelled";
  created_at: string;
  updated_at: string;
  results?: {
    report: string;
    sources: Array<{
      url: string;
      title: string;
      snippet: string;
    }>;
  };
  error?: {
    message: string;
    type: string;
  };
}

// OpenAI Research Service
export class OpenAIResearchService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async submitResearchJob(
    prompt: string,
    systemMessage?: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "o3-deep-research-2025-06-26",
        reasoning: { effort: "medium" },
        input: [
          {
            role: "system",
            content:
              systemMessage ||
              "You are a professional business research analyst. Provide comprehensive, well-structured research reports with citations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tools: [{ type: "web_search_preview" }],
        background: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    return data.id;
  }

  async checkJobStatus(responseId: string): Promise<OpenAIResearchJob> {
    const response = await fetch(`${this.baseUrl}/responses/${responseId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to check research status: ${response.status}`);
    }

    const data = await response.json();

    // Debugging — check exact API response
    console.log("🔍 OpenAI Job Data:", JSON.stringify(data, null, 2));

    const transformedJob: OpenAIResearchJob = {
      id: data.id,
      status:
        data.status === "completed"
          ? "completed"
          : data.status === "failed"
          ? "failed"
          : data.status === "cancelled"
          ? "cancelled"
          : "in_progress",
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
    };

    // ✅ Parse output if job completed
    if (data.status === "completed" && data.output) {
      let reportText = "";
      let sources = [];

      // Handle different possible output structures
      if (Array.isArray(data.output)) {
        // Extract text content from all output items
        reportText = data.output
          .map((item: any) => {
            if (item.role === "assistant" && item.content) {
              // Handle both string and array content formats
              if (Array.isArray(item.content)) {
                return item.content
                  .filter((c: any) => c.type === "text" || c.type === "output_text")
                  .map((c: any) => c.text || c.output_text || "")
                  .join("\n");
              } else if (typeof item.content === "string") {
                return item.content;
              }
            }
            return "";
          })
          .filter((text: string) => text.length > 0)
          .join("\n\n");

        // Extract sources from tool calls
        sources = data.output
          .flatMap((item: any) => item.tool_calls || [])
          .filter((tool: any) => tool.type === "function" && tool.function?.name === "web_search_preview")
          .flatMap((tool: any) => {
            try {
              const result = JSON.parse(tool.function.arguments);
              return result.results || [];
            } catch (e) {
              console.error("Error parsing tool arguments:", e);
              return [];
            }
          })
          .map((r: any) => ({
            url: r.url || "",
            title: r.title || "",
            snippet: r.snippet || r.body || "",
          }));
      } else if (typeof data.output === "string") {
        // Handle case where output is a simple string
        reportText = data.output;
      }

      transformedJob.results = { report: reportText, sources };
    }

    if (data.status === "failed" && data.error) {
      transformedJob.error = {
        message: data.error.message || "Research job failed",
        type: data.error.type || "unknown",
      };
    }

    return transformedJob;
  }

  async cancelJob(responseId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/responses/${responseId}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel research job: ${response.status}`);
    }
  }

  async pollJobStatus(
    jobId: string,
    onUpdate?: (job: OpenAIResearchJob) => void,
    maxAttempts: number = 60,
    intervalMs: number = 30000
  ): Promise<OpenAIResearchJob> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const job = await this.checkJobStatus(jobId);
          if (onUpdate) onUpdate(job);

          if (job.status === "completed") return resolve(job);
          if (job.status === "failed")
            return reject(new Error(job.error?.message || "Research job failed"));
          if (job.status === "cancelled")
            return reject(new Error("Research job was cancelled"));
          if (attempts >= maxAttempts)
            return reject(new Error("Research job polling timeout"));

          if (job.status === "in_progress") {
            setTimeout(poll, intervalMs);
          }
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
  }
}

// Hook for React components
export const useResearchJobPolling = (
  jobId: string | null,
  onComplete?: (job: OpenAIResearchJob) => void
) => {
  const [job, setJob] = React.useState<OpenAIResearchJob | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!jobId || !import.meta.env.VITE_OPENAI_API_KEY) return;

    const researchService = new OpenAIResearchService(
      import.meta.env.VITE_OPENAI_API_KEY
    );
    setIsPolling(true);
    setError(null);

    researchService
      .pollJobStatus(jobId, (updatedJob) => setJob(updatedJob))
      .then((completedJob) => {
        setJob(completedJob);
        setIsPolling(false);
        if (onComplete) onComplete(completedJob);
      })
      .catch((err) => {
        setError(err.message);
        setIsPolling(false);
      });

    return () => {
      setIsPolling(false);
    };
  }, [jobId]);

  return { job, isPolling, error };
};

// Supabase updater
export const updateReportWithResearchResults = async (
  supabase: any,
  reportId: string,
  job: OpenAIResearchJob
) => {
  const updateData: any = { updated_at: new Date().toISOString() };

  if (job.status === "completed" && job.results) {
    updateData.generated_report = job.results.report;
    updateData.research_sources = job.results.sources;
    updateData.status = "completed";
  } else if (job.status === "failed") {
    updateData.status = "failed";
    updateData.error_message = job.error?.message || "Research job failed";
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData)
    .eq("id", reportId);

  if (error) {
    console.error("Failed to update report:", error);
    throw new Error("Failed to update report with research results");
  }
};

export default OpenAIResearchService;

// Prompt Generator
export class ResearchPromptGenerator {
  static generatePrompt(
    reportType: string,
    clientName: string,
    transcript: string,
    urls: string[],
    fileContents: string[]
  ): string {
    return `
      Report Type: ${reportType}
      Client: ${clientName}

      Meeting Transcript:
      ${transcript || "N/A"}

      Reference URLs:
      ${urls && urls.length > 0 ? urls.join("\n") : "No URLs provided"}

      Uploaded Documents:
      ${
        fileContents && fileContents.length > 0
          ? fileContents.join("\n")
          : "No documents uploaded"
      }
    `;
  }
}