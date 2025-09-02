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

  async submitResearchJob(prompt: string, systemMessage?: string): Promise<string> {
    const input = [
      {
        role: "developer",
        content: [
          {
            type: "input_text",
            text:
              systemMessage ||
              "You are a professional business research analyst. Provide comprehensive, well-structured research reports with citations.",
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ];

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
     body: JSON.stringify({
  model: "gpt-4o-mini",   
  input,
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

    if (data.status === "completed" && data.output) {
      const finalOutput = data.output.find(
        (item: any) =>
          item.type === "response" ||
          (item.content &&
            Array.isArray(item.content) &&
            item.content.some((c: any) => c.type === "text"))
      );

      if (finalOutput) {
        let reportText = "";
        if (finalOutput.content && Array.isArray(finalOutput.content)) {
          reportText = finalOutput.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("\n");
        }

        const sources = data.output
          .filter(
            (item: any) =>
              item.type === "tool_call" &&
              item.tool_call?.name === "web_search_preview"
          )
          .map((item: any) => {
            const result = item.tool_call?.result;
            if (result && result.results) {
              return result.results.map((r: any) => ({
                url: r.url || "",
                title: r.title || "",
                snippet: r.snippet || r.body || "",
              }));
            }
            return [];
          })
          .flat();

        transformedJob.results = { report: reportText, sources };
      }
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
    const response = await fetch(`${this.baseUrl}/responses/${responseId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

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

  const { error } = await supabase.from("reports").update(updateData).eq("id", reportId);

  if (error) {
    console.error("Failed to update report:", error);
    throw new Error("Failed to update report with research results");
  }
};

export default OpenAIResearchService;
// lib/openaiResearch.ts ke andar, OpenAIResearchService ke neeche ya end me

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
      ${fileContents && fileContents.length > 0 ? fileContents.join("\n") : "No documents uploaded"}
    `;
  }
}
