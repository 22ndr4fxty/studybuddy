import { useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload as UploadIcon, FileText, Image, File, Trash2, BookOpen, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Upload } from "@shared/schema";

export default function UploadPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState<number | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null);

  const { data: uploads = [], isLoading } = useQuery<Upload[]>({
    queryKey: ["/api/uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({ title: "File uploaded successfully" });
      setIsUploading(false);
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({ title: "File deleted" });
    },
  });

  const generateNotesMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      setGeneratingNotes(uploadId);
      const res = await apiRequest("POST", `/api/uploads/${uploadId}/notes`, { language });
      return res.json();
    },
    onSuccess: (data: any) => {
      setGeneratingNotes(null);
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({ title: "Notes generated" });
      navigate(`/notes/${data.id}`);
    },
    onError: (err: Error) => {
      setGeneratingNotes(null);
      toast({ title: "Failed to generate notes", description: err.message, variant: "destructive" });
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      setGeneratingQuiz(uploadId);
      const res = await apiRequest("POST", `/api/uploads/${uploadId}/quiz`, { language });
      return res.json();
    },
    onSuccess: (data: any) => {
      setGeneratingQuiz(null);
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({ title: "Quiz generated" });
      navigate(`/quizzes/${data.id}`);
    },
    onError: (err: Error) => {
      setGeneratingQuiz(null);
      toast({ title: "Failed to generate quiz", description: err.message, variant: "destructive" });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  }, [uploadMutation]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        data-testid="upload-zone"
      >
        <input
          type="file"
          className="absolute inset-0 cursor-pointer opacity-0"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md"
          onChange={handleFileSelect}
          disabled={isUploading}
          data-testid="input-file"
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">{t("upload.processing", language)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <UploadIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t("upload.drop", language)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("upload.formats", language)}</p>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      <div>
        <h2 className="mb-3 text-base font-semibold">{t("label.files", language)}</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : uploads.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8" />
            <p className="text-sm">{t("empty.uploads", language)}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {uploads.map((upload) => (
              <Card key={upload.id} className="flex items-center gap-3 p-3" data-testid={`card-upload-${upload.id}`}>
                {getFileIcon(upload.mimeType)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{upload.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => generateNotesMutation.mutate(upload.id)}
                    disabled={generatingNotes === upload.id}
                    data-testid={`button-gen-notes-${upload.id}`}
                  >
                    {generatingNotes === upload.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {generatingNotes === upload.id ? t("generating.notes", language) : t("btn.genNotes", language)}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => generateQuizMutation.mutate(upload.id)}
                    disabled={generatingQuiz === upload.id}
                    data-testid={`button-gen-quiz-${upload.id}`}
                  >
                    {generatingQuiz === upload.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Brain className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {generatingQuiz === upload.id ? t("generating.quiz", language) : t("btn.genQuiz", language)}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(upload.id)}
                    data-testid={`button-delete-${upload.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
