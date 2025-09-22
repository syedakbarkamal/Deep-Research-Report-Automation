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

      // --- FORMAT CONTENT LIKE renderFormattedField ---
      const lines = (report.generated_report || "").split("\n");
      const formattedContent = lines
        .map((line) => {
          if (line.startsWith("## ")) {
            return `\n**${line.replace("## ", "")}**\n`; // Bold for h2
          }
          if (line.startsWith("### ")) {
            return `\n*${line.replace("### ", "")}*\n`; // Italic for h3
          }
          return line; // Normal text
        })
        .join("\n");

      // --- FINAL DOC CONTENT ---
      const docContent = `
Report Type: ${report.type_of_report || "Untitled Report"}

Generated Report:
${formattedContent}
      `;

      const url = await createGoogleDoc(
        report.type_of_report || "Report",
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

  // Helper to render fields as plain text with h2/h3
  const renderFormattedField = (label: string, value: any, bg: string) => {
    if (!value) return null;

    const formatted = value
      .split("\n")
      .map((line: string, idx: number) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-lg font-semibold mt-4 mb-2">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-base font-medium mt-3 mb-1">
              {line.replace("### ", "")}
            </h3>
          );
        }
        return (
          <p key={idx} className="text-sm leading-relaxed mb-2">
            {line}
          </p>
        );
      });

    return (
      <div className="mt-6">
        <strong>{label}:</strong>
        <div className={`mt-3 p-4 border rounded-lg ${bg}`}>
          {formatted}
        </div>
      </div>
    );
  };

  return (
    <Card className="m-6">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">
            {report.type_of_report || "Untitled Report"}
          </h1>
        </CardTitle>
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

        {/* Render generated_report with formatting */}
        {/* {renderFormattedField(
          "Generated Report",
          report.generated_report,
          "bg-blue-50 border-blue-200"
        )} */}

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
