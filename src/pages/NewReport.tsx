import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Link2, Trash2, Plus, Loader2, FileUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "../lib/supabaseClient";

interface FormData {
  reportName: string;
  clientName: string;
  typeOfReport: string;
  meetingTranscript: string;
  clientUrls: string[];
  files: File[];
}

export default function NewReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    reportName: "",
    clientName: "",
    typeOfReport: "",
    meetingTranscript: "",
    clientUrls: [""],
    files: [],
  });

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
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
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

  // Form Submit
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

    // Skip file upload for now - just use empty array
    // Upload files to Supabase Storage
const fileUrls: string[] = [];

for (const file of formData.files) {
  const filePath = `${user.id}/${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("reports") // bucket name
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("reports")
    .getPublicUrl(filePath);

  fileUrls.push(publicUrl);
}// Clean URLs
const cleanUrls = formData.clientUrls
  .filter((url) => url.trim() !== "")
  .map((url) => url.trim());


    // Insert report into database
    const reportData = {
      report_name: formData.reportName.trim(),
      client_name: formData.clientName.trim(),
      type_of_report: formData.typeOfReport,
      meeting_transcript: formData.meetingTranscript.trim(),
      client_urls: cleanUrls,
      file_urls: fileUrls, // Empty for now
      user_id: user.id,
      status: 'draft'
    };

    const { data: insertedReport, error: insertError } = await supabase
      .from("reports")
      .insert(reportData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save report: " + insertError.message);
    }

    toast({
      title: "Report created successfully",
      description: "Your research report has been saved",
    });

    navigate(`/dashboard`);

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
          <h1 className="text-3xl font-bold mb-2">Create New Research Report</h1>
          <p className="text-muted-foreground">
            Submit your materials and let AI generate a comprehensive research report
          </p>
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
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="American CPG Growth Plan">
                      American CPG Growth Plan
                    </SelectItem>
                    <SelectItem value="American Service Growth Plan">
                      American Service Growth Plan
                    </SelectItem>
                    <SelectItem value="Relatório de Viabilidade de Expansão aos EUA">
                      Relatório de Viabilidade de Expansão aos EUA
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Transcript</CardTitle>
              <CardDescription>Paste your meeting transcript or notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript *</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your meeting transcript here..."
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
              <CardDescription>Add relevant URLs for research (max 5)</CardDescription>
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
                Upload supporting documents (PDF, DOCX, PPT - max 5 files, 10MB each)
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
              disabled={isSubmitting} 
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Creating Report...
                </>
              ) : (
                "Create Report"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}