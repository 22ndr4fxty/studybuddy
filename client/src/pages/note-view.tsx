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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Split content into sections by headings to wrap each in a keep-together block
    const sections = note.content.split(/(?=^#{1,3} )/gm);

    const renderSection = (section: string) => {
      const html = section
        .replace(/^#{4,} (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br />');
      return `<section><p>${html}</p></section>`;
    };

    const bodyContent = sections.map(renderSection).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${note.title}</title>
        <style>
          @page {
            margin: 2.2cm 2cm;
          }
          body {
            font-family: 'Noto Sans TC', 'General Sans', -apple-system, sans-serif;
            max-width: 700px;
            margin: 0 auto;
            padding: 0;
            color: #1a1a1a;
            line-height: 1.9;
            font-size: 13.5px;
            letter-spacing: 0.01em;
          }
          /* Keep each topic/section together on one page */
          section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 8px;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            margin-top: 28px;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid #6366f1;
            page-break-after: avoid;
            break-after: avoid;
          }
          h2 {
            font-size: 17px;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 10px;
            color: #2d2d7a;
            page-break-after: avoid;
            break-after: avoid;
          }
          h3 {
            font-size: 15px;
            font-weight: 600;
            margin-top: 18px;
            margin-bottom: 8px;
            page-break-after: avoid;
            break-after: avoid;
          }
          p {
            margin-bottom: 10px;
            line-height: 1.9;
            word-spacing: 0.05em;
          }
          ul, ol {
            padding-left: 22px;
            margin-bottom: 10px;
          }
          li {
            margin-bottom: 5px;
            line-height: 1.8;
          }
          strong { font-weight: 600; }
          code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12.5px;
            font-family: 'JetBrains Mono', 'Menlo', monospace;
          }
          blockquote {
            border-left: 3px solid #6366f1;
            padding-left: 14px;
            margin: 10px 0;
            color: #555;
            line-height: 1.8;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 16px 0;
          }
          /* Title page area */
          .title-block {
            margin-bottom: 20px;
          }
          .title-block h1 {
            margin-top: 0;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="title-block">
          <h1>${note.title}</h1>
        </div>
        ${bodyContent}
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
