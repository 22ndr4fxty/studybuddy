import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Brain, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Quiz, QuizQuestion } from "@shared/schema";

export default function QuizzesListPage() {
  const { language } = useLanguage();

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const langBadge = (lang: string) => {
    const labels: Record<string, string> = { en: "EN", "zh-hk": "粵", "zh-tw": "繁" };
    return labels[lang] || lang;
  };

  const getQuestionCount = (questionsJson: string) => {
    try {
      const questions: QuizQuestion[] = JSON.parse(questionsJson);
      return questions.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{t("nav.quizzes", language)}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Brain className="mb-2 h-8 w-8" />
          <p className="text-sm">{t("empty.quizzes", language)}</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const count = getQuestionCount(quiz.questions);
            return (
              <Link key={quiz.id} href={`/quizzes/${quiz.id}`}>
                <Card className="group cursor-pointer p-4 transition-colors hover:border-primary/30 hover:bg-accent/50" data-testid={`card-quiz-${quiz.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{langBadge(quiz.language)}</Badge>
                        <Badge variant="outline" className="text-xs">{count} questions</Badge>
                      </div>
                      <h3 className="text-sm font-medium">Quiz #{quiz.id}</h3>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
