import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@shared/schema";

export default function NotesListPage() {
  const { language } = useLanguage();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const langBadge = (lang: string) => {
    const labels: Record<string, string> = { en: "EN", "zh-hk": "粵", "zh-tw": "繁" };
    return labels[lang] || lang;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{t("nav.notes", language)}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BookOpen className="mb-2 h-8 w-8" />
          <p className="text-sm">{t("empty.notes", language)}</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="group cursor-pointer p-4 transition-colors hover:border-primary/30 hover:bg-accent/50" data-testid={`card-note-${note.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{langBadge(note.language)}</Badge>
                    </div>
                    <h3 className="truncate text-sm font-medium">{note.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {note.content.slice(0, 120).replace(/[#*_]/g, "")}...
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
