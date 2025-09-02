// components/ResearchStatusCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { OpenAIResearchService, OpenAIResearchJob, updateReportWithResearchResults } from "../lib/openaiResearch";

interface ResearchStatusCardProps {
  reportId: string;
  reportName: string;
  clientName: string;
  openaiJobId?: string;
  status: string;
  createdAt: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export default function ResearchStatusCard({
  reportId,
  reportName,
  clientName,
  openaiJobId,
  status,
  createdAt,
  onStatusUpdate
}: ResearchStatusCardProps) {
  const { toast } = useToast();
  const [researchJob, setResearchJob] = useState<OpenAIResearchJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (status === 'researching') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const created = new Date(createdAt).getTime();
        const elapsed = Math.floor((now - created) / 1000); // in seconds
        setElapsedTime(elapsed);
        
        // Estimate progress based on elapsed time (max 15 minutes)
        const estimatedProgress = Math.min((elapsed / 900) * 100, 95);
        setProgress(estimatedProgress);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, createdAt]);

  // Poll research status
  useEffect(() => {
    if (!openaiJobId || status !== 'researching' || !import.meta.env.VITE_OPENAI_API_KEY) {
      return;
    }

    const pollStatus = async () => {
      setIsPolling(true);
      try {
        const researchService = new OpenAIResearchService(import.meta.env.VITE_OPENAI_API_KEY);
        const job = await researchService.checkJobStatus(openaiJobId);
        setResearchJob(job);

        // Update database if job is completed or failed
        if (job.status === 'completed' || job.status === 'failed') {
          await updateReportWithResearchResults(supabase, reportId, job);
          
          if (onStatusUpdate) {
            onStatusUpdate(job.status);
          }

          if (job.status === 'completed') {
            setProgress(100);
            toast({
              title: "Research completed!",
              description: `Your report "${reportName}" is ready to view.`,
            });
          } else {
            toast({
              title: "Research failed",
              description: job.error?.message || "The research job failed unexpectedly.",
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to check research status:', error);
        toast({
          title: "Status check failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsPolling(false);
      }
    };

    // Poll immediately and then every 30 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 30000);

    return () => clearInterval(interval);
  }, [openaiJobId, status, reportId, reportName, onStatusUpdate]);

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'researching':
        return <Brain className="h-4 w-4 animate-pulse text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'researching':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Researching</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewReport = () => {
    // Navigate to report view
    window.location.href = `/report/${reportId}`;
  };

  const handleRetryResearch = async () => {
    try {
      // Mark report for retry (you might want to implement this logic)
      toast({
        title: "Retry requested",
        description: "The research will be restarted shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{reportName}</CardTitle>
              <CardDescription>Client: {clientName}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === 'researching' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Research Progress</span>
              <div className="flex items-center gap-2">
                {isPolling && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span className="font-medium">{formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              AI is analyzing your materials and conducting web research. This typically takes 5-15 minutes.
            </p>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Research completed successfully</span>
            </div>
            {researchJob?.results?.sources && (
              <div className="text-xs text-muted-foreground">
                Analyzed {researchJob.results.sources.length} sources
              </div>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Research failed</span>
            </div>
            {researchJob?.error?.message && (
              <p className="text-xs text-muted-foreground">
                {researchJob.error.message}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {status === 'completed' && (
            <Button size="sm" onClick={handleViewReport}>
              <FileText className="h-4 w-4 mr-1" />
              View Report
            </Button>
          )}
          
          {status === 'failed' && (
            <Button size="sm" variant="outline" onClick={handleRetryResearch}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry Research
            </Button>
          )}

          {researchJob?.results?.sources && researchJob.results.sources.length > 0 && (
            <Button size="sm" variant="ghost">
              <ExternalLink className="h-4 w-4 mr-1" />
              Sources ({researchJob.results.sources.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing multiple research jobs
export const useResearchJobs = (userId: string) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: "Failed to load reports",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReports();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('reports_changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${userId}`
        }, () => {
          fetchReports();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId]);

  const updateReportStatus = (reportId: string, newStatus: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: newStatus }
        : report
    ));
  };

  return {
    reports,
    loading,
    refetch: fetchReports,
    updateReportStatus
  };
};