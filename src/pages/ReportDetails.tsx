import { useParams, useNavigate } from "react-router-dom";
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
import { X } from "lucide-react";

export default function ReportDetailsModal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Close modal when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.id === "modal-backdrop") {
        navigate(-1);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleClickOutside);
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [navigate]);

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

      // Pass the raw generated_report content directly
      const docContent = `
# Report Name: ${report.type_of_report || "Report"}

# Executive Summary

${report.generated_report || ""}
`;

      const url = await createGoogleDoc(
        report.type_of_report || "Report",
        docContent,
        "https://rzyftbvjjhaiymmovops.supabase.co/storage/v1/object/public/logo/soundcheckinsight.png"
      );

      console.log("Google Doc Link:", url);

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

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div
        id="modal-backdrop"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        id="modal-backdrop"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg p-6">
          <p>Report not found</p>
          <Button onClick={handleClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

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
    <div
      id="modal-backdrop"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <Card className="border-0 h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle>
              <h1 className="text-2xl font-bold">
                {report.type_of_report || "Untitled Report"}
              </h1>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
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
      </div>
    </div>
  );
}