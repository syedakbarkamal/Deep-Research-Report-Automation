import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { initGoogleClient, signIn, createGoogleDoc } from "../lib/googleAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Initialize Google API
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initGoogleClient();
        setGoogleInitialized(true);
      } catch (error) {
        console.error("Error initializing Google client:", error);
      }
    };
    initGoogle();
  }, []);

  // Fetch report from Supabase
  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setReport(data);
      else console.error("Error fetching report:", error.message);

      setLoading(false);
    };
    fetchReport();
  }, [id]);

  // Create Google Doc
const handleCreateDoc = async () => {
  if (!googleInitialized || !report) return;
  setCreatingDoc(true);

  try {
    await signIn();

    // Only include report_name and meeting_transcript
    const docContent = `
      Report Name: ${report.report_name || "Untitled Report"}\n
      Meeting Transcript:\n${report.meeting_transcript || "No transcript available."}
    `;

    const url = await createGoogleDoc(
      report.report_name || "Report",
      docContent
    );

    // Save URL in Supabase
    const { error } = await supabase
      .from("reports")
      .update({ google_docs_url: url })
      .eq("id", id);

    if (error) {
      console.error("Error updating Supabase:", error.message);
    } else {
      setReport({ ...report, google_docs_url: url });
    }
  } catch (err) {
    console.error("Error creating Google Doc:", err);
  } finally {
    setCreatingDoc(false);
  }
};





  if (loading) return <p className="p-6">Loading...</p>;
  if (!report) return <p className="p-6">Report not found</p>;

  // Helper to render fields
  const renderField = (label: string, value: any, bg: string) => {
    if (!value) return null;
    return (
      <div className="mt-6">
        <strong>{label}:</strong>
        <div className={`mt-3 p-4 border rounded-lg ${bg}`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {value}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Card className="m-6">
      <CardHeader>
        <CardTitle>{report.report_name || "Untitled Report"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.client_name && (
          <p>
            <strong>Client:</strong> {report.client_name}
          </p>
        )}
        {report.status && (
          <p>
            <strong>Status:</strong> {report.status}
          </p>
        )}
        {report.created_at && (
          <p>
            <strong>Created:</strong>{" "}
            {new Date(report.created_at).toLocaleString()}
          </p>
        )}

        {/* Render known fields with color backgrounds */}
        {renderField("AI Generated Report", report.ai_generated_content, "bg-blue-50 border-blue-200")}
        {renderField("Report Content", report.report_content, "bg-green-50 border-green-200")}
        {renderField("Analysis", report.analysis, "bg-purple-50 border-purple-200")}
        {renderField("Summary", report.summary, "bg-yellow-50 border-yellow-200")}

        {/* Show all fields for debugging */}
        <details className="mt-6">
          <summary className="cursor-pointer font-semibold text-gray-600">
            Show All Fields (debug)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(report, null, 2)}
          </pre>
        </details>

        {/* Google Doc Section */}
        {report.google_docs_url ? (
          <Button asChild variant="gradient">
            <a
              href={report.google_docs_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Google Doc
            </a>
          </Button>
        ) : (
          <Button
            onClick={handleCreateDoc}
            variant="outline"
            disabled={!googleInitialized || creatingDoc}
          >
            {creatingDoc
              ? "Creating..."
              : googleInitialized
              ? "Create Google Doc"
              : "Initializing Google..."}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
