import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { Note } from "@shared/schema";

export default function NoteViewPage() {
  const { language } = useLanguage();
  const [, params] = useRoute("/notes/:id");
  const [, navigate] = useLocation();
  const noteId = params?.id;

  const { data: note, isLoading } = useQuery<Note>({
    queryKey: ["/api/notes", noteId],
    enabled: !!noteId,
  });

  const handleDownloadPDF = () => {
    if (!note) return;
    // Create a printable version and trigger browser print
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = note.content
      .replace(/^### (.*$)/gm, '<h3 style="margin-top:16px;margin-bottom:8px;font-size:16px;font-weight:600;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="margin-top:20px;margin-bottom:10px;font-size:18px;font-weight:600;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="margin-top:24px;margin-bottom:12px;font-size:22px;font-weight:700;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:13px;">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid #6366f1;padding-left:12px;margin:8px 0;color:#666;">$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li style="margin-left:20px;margin-bottom:4px;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin-bottom:10px;line-height:1.7;">')
      .replace(/\n/g, '<br />');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${note.title}</title>
        <style>
          body { font-family: 'Noto Sans TC', 'General Sans', -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.7; font-size: 14px; }
          h1 { border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
          ul { padding-left: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px;">${note.title}</h1>
        <p style="margin-bottom:10px;line-height:1.7;">${htmlContent}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Note not found</p>
      </div>
    );
  }

  const langBadge = (lang: string) => {
    const labels: Record<string, string> = { en: "English", "zh-hk": "廣東話", "zh-tw": "繁體中文" };
    return labels[lang] || lang;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/notes")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("btn.back", language)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleDownloadPDF}
          data-testid="button-download-pdf"
        >
          <Download className="h-4 w-4" />
          {t("btn.download", language)}
        </Button>
      </div>

      {/* Note content */}
      <Card className="p-6" data-testid="card-note-content">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary">{langBadge(note.language)}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleString()}
          </span>
        </div>
        <h1 className="text-xl font-bold mb-4" data-testid="text-note-title">{note.title}</h1>
        <MarkdownRenderer content={note.content} />
      </Card>
    </div>
  );
}
