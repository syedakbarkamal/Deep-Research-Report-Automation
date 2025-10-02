import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Link2, Trash2, Plus, Loader2, FileUp, Brain } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "../lib/supabaseClient";
import { OpenAIResearchService, ResearchPromptGenerator } from "../lib/openaiResearch";

interface FormData {
  reportName: string;
  clientName: string;
  typeOfReport: string;
  meetingTranscript: string;
  clientUrls: string[];
  files: File[];
}

interface OpenAIResearchJob {
  id: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
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
}

interface ReportType {
  id: string;
  title: string;
  description?: string | null;
  prompt: string;
  assigned_to?: string[] | null;
  status: "active" | "inactive";
  created_at?: string;
}

export default function NewReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableReportTypes, setAvailableReportTypes] = useState<ReportType[]>([]);
  const [isLoadingReportTypes, setIsLoadingReportTypes] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    reportName: "",
    clientName: "",
    typeOfReport: "",
    meetingTranscript: "",
    clientUrls: [""],
    files: [],
  });

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch available report types from database that are assigned to the current user
  useEffect(() => {
    const fetchReportTypes = async () => {
      if (!currentUserId) return;
      
      try {
        setIsLoadingReportTypes(true);
        const { data, error } = await supabase
          .from("report_types")
          .select("*")
          .order("title", { ascending: true });

        if (error) {
          console.error("Error fetching report types:", error);
          toast({
            title: "Error",
            description: "Failed to load report types",
            variant: "destructive",
          });
        } else {
          // Filter report types: show only active ones that are either assigned to this user or not assigned to anyone
          const filteredReportTypes = (data || []).filter(reportType => 
            reportType.status === "active" && 
            (!reportType.assigned_to || 
             reportType.assigned_to.length === 0 || 
             reportType.assigned_to.includes(currentUserId))
          );
          
          setAvailableReportTypes(filteredReportTypes);
        }
      } catch (err) {
        console.error("Error fetching report types:", err);
      } finally {
        setIsLoadingReportTypes(false);
      }
    };

    fetchReportTypes();
  }, [currentUserId, toast]);

  // Google Docs creation function
  async function getGoogleAccessToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.provider_token) {
      console.error("No Google access token:", error);
      return null;
    }
    return data.session.provider_token; // Google OAuth token
  }

  async function createGoogleDoc(title: string, content: string) {
    const token = await getGoogleAccessToken();
    if (!token) throw new Error("Missing Google access token");

    // 1. Create new Google Doc
    const res = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Google Doc creation failed:", err);
      throw new Error("Failed to create Google Doc");
    }

    const doc = await res.json();
    const docId = doc.documentId;

    // 2. Insert initial text
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      console.error("Failed to insert text:", err);
    }

    // Return Google Docs URL instead of just ID
    return `https://docs.google.com/document/d/${docId}/edit`;
  }

  // URL Handlers
  const handleAddUrl = () => {
    if (formData.clientUrls.length < 5) {
      setFormData({ ...formData, clientUrls: [...formData.clientUrls, ""] });
    }
  };

  const handleRemoveUrl = (index: number) => {
    if (formData.clientUrls.length > 1) {
      setFormData({ 
        ...formData, 
        clientUrls: formData.clientUrls.filter((_, i) => i !== index) 
      });
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.clientUrls];
    newUrls[index] = value;
    setFormData({ ...formData, clientUrls: newUrls });
  };

  // File Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = formData.files.length + files.length;
    
    if (totalFiles > 5) {
      toast({
        title: "File limit exceeded",
        description: "You can upload a maximum of 5 files",
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word, and PowerPoint files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB per file)
    const oversizedFiles = files.filter(file => file.size > 14 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each file must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFormData({ ...formData, files: [...formData.files, ...files] });
  };

  const handleRemoveFile = (index: number) => {
    setFormData({ 
      ...formData, 
      files: formData.files.filter((_, i) => i !== index) 
    });
  };

  // Form Validation
  const validateForm = (): boolean => {
    if (!formData.reportName.trim()) {
      toast({
        title: "Validation Error",
        description: "Report name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.clientName.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.typeOfReport) {
      toast({
        title: "Validation Error",
        description: "Please select a report type",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.meetingTranscript.trim()) {
      toast({
        title: "Validation Error",
        description: "Meeting transcript is required",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Extract file content for research context
  const extractFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        // For PDF files, you would typically use a PDF parsing library
        // For now, we'll just return the filename as context
        resolve(`[PDF Document: ${file.name}]`);
      } else if (file.type.includes('word') || file.type.includes('document')) {
        // For Word documents, you would use a document parsing library
        resolve(`[Word Document: ${file.name}]`);
      } else if (file.type.includes('presentation')) {
        // For PowerPoint files
        resolve(`[PowerPoint Presentation: ${file.name}]`);
      } else {
        resolve(`[Document: ${file.name}]`);
      }
    });
  };

  // Get system message based on report type
  const getSystemMessage = (type: string) => {
    // Try to find the report type with its prompt
    const reportType = availableReportTypes.find(rt => rt.title === type);
    
    if (reportType && reportType.prompt) {
      // Use the custom prompt from the report type
      return reportType.prompt;
    }
    
    // Fallback to default message if no custom prompt
    return `You are a professional business research analyst preparing a comprehensive ${type} report. Your task is to analyze the provided materials and conduct thorough web research to create a detailed, data-driven business report.

Key Requirements:
- Focus on actionable insights with specific data, statistics, and trends
- Include inline citations for all claims and data points
- Provide structured analysis with clear sections and headers
- Support recommendations with evidence from reliable sources
- Format the output as a professional business report`;
  };

  // Submit research job to OpenAI Deep Research API
  const submitResearchJob = async (reportData: any, fileContents: string[]): Promise<string> => {
    const systemMessage = getSystemMessage(formData.typeOfReport);
    
    // Construct the research prompt
    const researchPrompt = ResearchPromptGenerator.generatePrompt(
      formData.typeOfReport, 
      formData.clientName,
      formData.meetingTranscript,
      formData.clientUrls.filter(url => url.trim()),
      fileContents
    );

    // Create research service and submit job
    const researchService = new OpenAIResearchService(import.meta.env.VITE_OPENAI_API_KEY);
    return await researchService.submitResearchJob(researchPrompt, systemMessage);
  };

  // Check research job status
  const checkResearchStatus = async (jobId: string): Promise<OpenAIResearchJob> => {
    const response = await fetch(`https://api.openai.com/v1/research/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check research status: ${response.status}`);
    }

    return await response.json();
  };

  // Form Submit with OpenAI Integration and Google Docs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Please sign in to create a report");
      }

      // Show progress toast
      toast({
        title: "Starting research process",
        description: "Uploading files and initiating AI research...",
      });

      // Upload files to Supabase Storage
      const fileUrls: string[] = [];
      const fileContents: string[] = [];

      for (const file of formData.files) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("reports")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("reports")
          .getPublicUrl(filePath);

        fileUrls.push(publicUrl);

        // Extract file content for research context
        const content = await extractFileContent(file);
        fileContents.push(content);
      }

      // Clean URLs
      const cleanUrls = formData.clientUrls
        .filter((url) => url.trim() !== "")
        .map((url) => url.trim());

      // Prepare report data
      const reportData = {
        report_name: formData.reportName.trim(),
        client_name: formData.clientName.trim(),
        type_of_report: formData.typeOfReport,
        meeting_transcript: formData.meetingTranscript.trim(),
        client_urls: cleanUrls,
        file_urls: fileUrls,
        user_id: user?.id,
        status: 'researching' // Updated status
      };

      // Insert initial report record
      const { data: insertedReport, error: insertError } = await supabase
        .from("reports")
        .insert(reportData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to save report: " + insertError.message);
      }

      // Submit research job to OpenAI
      toast({
        title: "Submitting to AI research",
        description: "This may take several minutes to complete...",
      });

      const researchJobId = await submitResearchJob(reportData, fileContents);

      // Update report with research job ID
      const { error: updateError } = await supabase
        .from("reports")
        .update({ 
          openai_job_id: researchJobId,
          status: 'researching',
          updated_at: new Date().toISOString()
        })
        .eq('id', insertedReport.id);

      if (updateError) {
        console.error("Update error:", updateError);
        // Don't throw here, as the research is already started
      }

      // Create Google Doc with initial content
      try {
        toast({
          title: "Creating Google Doc",
          description: "Setting up your collaborative document...",
        });

        const initialContent = `
# ${formData.reportName}
**Client:** ${formData.clientName}
**Report Type:** ${formData.typeOfReport}
**Date:** ${new Date().toLocaleDateString()}

## Meeting Transcript Summary
${formData.meetingTranscript.substring(0, 500)}${formData.meetingTranscript.length > 500 ? '...' : ''}

## Research URLs
${cleanUrls.map(url => `- ${url}`).join('\n')}

## Uploaded Documents
${formData.files.map(file => `- ${file.name}`).join('\n')}

---
*AI Research Report will be generated and appended to this document shortly...*
        `;

        const googleDocLink = await createGoogleDoc(
          `${formData.reportName} - ${formData.clientName}`,
          initialContent
        );

        // Update report with Google Doc link
        await supabase
          .from("reports")
          .update({ 
            google_doc_link: googleDocLink,
            updated_at: new Date().toISOString()
          })
          .eq('id', insertedReport.id);

        toast({
          title: "Research initiated successfully",
          description: "Your AI research report is being generated and Google Doc has been created!",
        });

      } catch (docError) {
        // Google Doc creation failed, but research is still running
        console.error("Google Doc creation failed:", docError);
        toast({
          title: "Research initiated successfully",
          description: "Your AI research report is being generated. Google Doc creation encountered an issue.",
        });
      }

      // Navigate to dashboard with a flag to show the research status
      navigate(`/dashboard?research_started=${insertedReport.id}`);

    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error creating report",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Create New Research Report</h1>
              <p className="text-muted-foreground">
                Submit your materials and let OpenAI Deep Research generate a comprehensive analysis
              </p>
            </div>
          </div>
          
          {/* Research Process Info */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    AI-Powered Research Process
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Once submitted, our AI will analyze your materials, conduct web research, 
                    and generate a comprehensive report. This typically takes 5-15 minutes depending 
                    on complexity. A Google Doc will be created for collaborative editing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the basic details for your research report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    placeholder="e.g., Q4 Market Analysis"
                    value={formData.reportName}
                    onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Client Name"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="typeOfReport">Type of report *</Label>
                <Select
                  value={formData.typeOfReport}
                  onValueChange={(value) => setFormData({ ...formData, typeOfReport: value })}
                  required
                  disabled={isSubmitting || isLoadingReportTypes}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingReportTypes
                          ? "Loading report types..."
                          : availableReportTypes.length === 0
                          ? "No report types available"
                          : "Select a report type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ✅ Dynamic options (only active report types assigned to this user) */}
                    {availableReportTypes.map((reportType) => (
                      <SelectItem key={reportType.id} value={reportType.title}>
                        {reportType.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {availableReportTypes.length === 0 && !isLoadingReportTypes && (
                  <p className="text-sm text-muted-foreground">
                    No report types available. Please contact an administrator to assign report types to you.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meeting Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Transcript</CardTitle>
              <CardDescription>
                Paste your meeting transcript or notes - this will be the primary source for AI research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript *</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your meeting transcript here... The AI will use this as the foundation for research and analysis."
                  value={formData.meetingTranscript}
                  onChange={(e) => setFormData({ ...formData, meetingTranscript: e.target.value })}
                  className="min-h-[200px]"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference URLs */}
          <Card>
            <CardHeader>
              <CardTitle>Reference URLs</CardTitle>
              <CardDescription>Add relevant URLs for AI research context (max 5)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.clientUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formData.clientUrls.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleRemoveUrl(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.clientUrls.length < 5 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddUrl} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add URL
                </Button>
              )}
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Document Uploads</CardTitle>
              <CardDescription>
                Upload supporting documents for AI analysis (PDF, DOCX, PPT - max 5 files, 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveFile(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors ${
                  formData.files.length >= 5 || isSubmitting 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, PPT (max {5 - formData.files.length} files remaining)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.doc,.ppt,.pptx"
                  onChange={handleFileUpload}
                  disabled={formData.files.length >= 5 || isSubmitting}
                />
              </label>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/dashboard")} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gradient" 
              disabled={isSubmitting || !formData.typeOfReport} 
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Starting AI Research...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Start AI Research
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}