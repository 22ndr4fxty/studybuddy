import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, X, Loader2, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import type { Quiz, QuizQuestion, MCQuestion, FillBlankQuestion, LongQuestion } from "@shared/schema";

interface QuizAnswer {
  questionIndex: number;
  answer: string | number; // index for MC, string for fill/long
  isCorrect?: boolean;
  feedback?: string;
  score?: number;
}

export default function QuizViewPage() {
  const { language } = useLanguage();
  const [, params] = useRoute("/quizzes/:id");
  const [, navigate] = useLocation();
  const quizId = params?.id;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, QuizAnswer>>(new Map());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [longAnswer, setLongAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });

  const gradeMutation = useMutation({
    mutationFn: async (params: { question: string; sampleAnswer: string; keyPoints: string[]; userAnswer: string }) => {
      const res = await apiRequest("POST", "/api/grade", { ...params, language });
      return res.json();
    },
  });

  const questions: QuizQuestion[] = quiz ? (() => {
    try { return JSON.parse(quiz.questions); } catch { return []; }
  })() : [];

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers.get(currentQuestion);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleMCSubmit = () => {
    if (selectedOption === null) return;
    const q = currentQ as MCQuestion;
    const isCorrect = selectedOption === q.correctIndex;
    setAnswers(new Map(answers.set(currentQuestion, {
      questionIndex: currentQuestion,
      answer: selectedOption,
      isCorrect,
      feedback: q.explanation,
    })));
    setShowResult(true);
  };

  const handleFillSubmit = () => {
    if (!fillAnswer.trim()) return;
    const q = currentQ as FillBlankQuestion;
    const isCorrect = fillAnswer.trim().toLowerCase() === q.answer.toLowerCase();
    setAnswers(new Map(answers.set(currentQuestion, {
      questionIndex: currentQuestion,
      answer: fillAnswer.trim(),
      isCorrect,
      feedback: q.explanation,
    })));
    setShowResult(true);
  };

  const handleLongSubmit = async () => {
    if (!longAnswer.trim()) return;
    const q = currentQ as LongQuestion;
    
    setAnswers(new Map(answers.set(currentQuestion, {
      questionIndex: currentQuestion,
      answer: longAnswer.trim(),
    })));
    setShowResult(true);

    try {
      const result = await gradeMutation.mutateAsync({
        question: q.question,
        sampleAnswer: q.sampleAnswer,
        keyPoints: q.keyPoints,
        userAnswer: longAnswer.trim(),
      });
      setAnswers(new Map(answers.set(currentQuestion, {
        questionIndex: currentQuestion,
        answer: longAnswer.trim(),
        score: result.score,
        feedback: result.feedback,
      })));
    } catch {
      // Grading failed, still show result
    }
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowResult(false);
      setSelectedOption(null);
      setFillAnswer("");
      setLongAnswer("");
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswer = answers.get(currentQuestion - 1);
      setShowResult(!!prevAnswer);
      setSelectedOption(typeof prevAnswer?.answer === "number" ? prevAnswer.answer : null);
      setFillAnswer(typeof prevAnswer?.answer === "string" && questions[currentQuestion - 1]?.type === "fill" ? prevAnswer.answer : "");
      setLongAnswer(typeof prevAnswer?.answer === "string" && questions[currentQuestion - 1]?.type === "long" ? prevAnswer.answer : "");
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(new Map());
    setSelectedOption(null);
    setFillAnswer("");
    setLongAnswer("");
    setShowResult(false);
    setQuizFinished(false);
  };

  const getTypeLabel = (type: string) => {
    if (type === "mc") return t("quiz.mc", language);
    if (type === "fill") return t("quiz.fill", language);
    return t("quiz.long", language);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Quiz not found</p>
      </div>
    );
  }

  // Results screen
  if (quizFinished) {
    const totalAnswered = answers.size;
    const mcAndFill = Array.from(answers.values()).filter(a => a.isCorrect !== undefined);
    const correctCount = mcAndFill.filter(a => a.isCorrect).length;
    const longAnswers = Array.from(answers.values()).filter(a => a.score !== undefined);
    const avgLongScore = longAnswers.length > 0
      ? Math.round(longAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / longAnswers.length)
      : null;

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/quizzes")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          {t("btn.back", language)}
        </Button>

        <Card className="p-6 text-center" data-testid="card-quiz-results">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h2 className="text-lg font-bold mb-2">{t("quiz.results", language)}</h2>
          
          <div className="flex justify-center gap-6 my-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{correctCount}/{mcAndFill.length}</div>
              <div className="text-xs text-muted-foreground">MC & Fill</div>
            </div>
            {avgLongScore !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{avgLongScore}%</div>
                <div className="text-xs text-muted-foreground">Long Q Avg</div>
              </div>
            )}
          </div>

          {/* Review all questions */}
          <div className="mt-6 space-y-4 text-left">
            {questions.map((q, i) => {
              const answer = answers.get(i);
              return (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{getTypeLabel(q.type)}</Badge>
                    {answer?.isCorrect === true && <Check className="h-4 w-4 text-green-500" />}
                    {answer?.isCorrect === false && <X className="h-4 w-4 text-red-500" />}
                    {answer?.score !== undefined && (
                      <span className="text-xs font-medium text-primary">{answer.score}%</span>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{q.question}</p>
                  {answer?.feedback && (
                    <p className="text-xs text-muted-foreground">{answer.feedback}</p>
                  )}
                </div>
              );
            })}
          </div>

          <Button className="mt-6 gap-1.5" onClick={resetQuiz} data-testid="button-retry">
            <RotateCcw className="h-4 w-4" />
            {t("btn.retry", language)}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/quizzes")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          {t("btn.back", language)}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("label.question", language)} {currentQuestion + 1} {t("label.of", language)} {questions.length}
        </span>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1.5" />

      {/* Question card */}
      <Card className="p-6" data-testid="card-question">
        <div className="mb-4">
          <Badge variant="secondary" className="mb-3">{getTypeLabel(currentQ.type)}</Badge>
          <h2 className="text-base font-semibold leading-relaxed" data-testid="text-question">
            {currentQ.question}
          </h2>
        </div>

        {/* MC Question */}
        {currentQ.type === "mc" && (
          <div className="space-y-2">
            {(currentQ as MCQuestion).options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isAnswered = showResult && currentAnswer;
              const isCorrectOption = idx === (currentQ as MCQuestion).correctIndex;

              let optionClass = "border border-border hover:border-primary/40 hover:bg-accent/50";
              if (isAnswered) {
                if (isCorrectOption) optionClass = "border-green-500 bg-green-50 dark:bg-green-500/10";
                else if (isSelected && !isCorrectOption) optionClass = "border-red-500 bg-red-50 dark:bg-red-500/10";
                else optionClass = "border border-border opacity-60";
              } else if (isSelected) {
                optionClass = "border-primary bg-primary/5";
              }

              return (
                <button
                  key={idx}
                  className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${optionClass}`}
                  onClick={() => !showResult && setSelectedOption(idx)}
                  disabled={showResult}
                  data-testid={`option-${idx}`}
                >
                  <div className="flex items-center gap-2">
                    {isAnswered && isCorrectOption && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                    {isAnswered && isSelected && !isCorrectOption && <X className="h-4 w-4 shrink-0 text-red-500" />}
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Fill in the blank */}
        {currentQ.type === "fill" && (
          <div className="space-y-3">
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              placeholder={t("label.answer", language)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={showResult}
              data-testid="input-fill-answer"
              onKeyDown={(e) => e.key === "Enter" && !showResult && handleFillSubmit()}
            />
            {showResult && currentAnswer && (
              <div className={`rounded-lg p-3 text-sm ${currentAnswer.isCorrect ? "bg-green-50 dark:bg-green-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {currentAnswer.isCorrect ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span className="font-medium">{currentAnswer.isCorrect ? t("quiz.correct", language) : t("quiz.incorrect", language)}</span>
                </div>
                <p className="text-muted-foreground">
                  {t("label.answer", language)}: <strong>{(currentQ as FillBlankQuestion).answer}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Long question */}
        {currentQ.type === "long" && (
          <div className="space-y-3">
            <Textarea
              value={longAnswer}
              onChange={(e) => setLongAnswer(e.target.value)}
              placeholder={t("label.answer", language)}
              rows={6}
              disabled={showResult}
              data-testid="input-long-answer"
            />
            {showResult && currentAnswer && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                {gradeMutation.isPending ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("quiz.grading", language)}
                  </div>
                ) : currentAnswer.score !== undefined ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t("quiz.score", language)}:</span>
                      <Badge variant={currentAnswer.score >= 70 ? "default" : "destructive"}>
                        {currentAnswer.score}%
                      </Badge>
                    </div>
                    {currentAnswer.feedback && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("label.feedback", language)}</p>
                        <p className="text-sm">{currentAnswer.feedback}</p>
                      </div>
                    )}
                  </>
                ) : null}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("label.sampleAnswer", language)}</p>
                  <p className="text-sm">{(currentQ as LongQuestion).sampleAnswer}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("label.keyPoints", language)}</p>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {(currentQ as LongQuestion).keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation for MC and Fill */}
        {showResult && currentAnswer?.feedback && currentQ.type !== "long" && (
          <div className="mt-3 rounded-lg bg-accent/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("label.explanation", language)}</p>
            <p className="text-sm">{currentAnswer.feedback}</p>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={goToPrev}
          disabled={currentQuestion === 0}
          data-testid="button-prev"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("btn.prev", language)}
        </Button>

        <div className="flex gap-2">
          {!showResult && (
            <Button
              size="sm"
              onClick={() => {
                if (currentQ.type === "mc") handleMCSubmit();
                else if (currentQ.type === "fill") handleFillSubmit();
                else handleLongSubmit();
              }}
              disabled={
                (currentQ.type === "mc" && selectedOption === null) ||
                (currentQ.type === "fill" && !fillAnswer.trim()) ||
                (currentQ.type === "long" && !longAnswer.trim())
              }
              data-testid="button-submit"
            >
              {t("btn.submit", language)}
            </Button>
          )}

          {showResult && currentQuestion < questions.length - 1 && (
            <Button size="sm" className="gap-1.5" onClick={goToNext} data-testid="button-next">
              {t("btn.next", language)}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {showResult && currentQuestion === questions.length - 1 && (
            <Button size="sm" className="gap-1.5" onClick={finishQuiz} data-testid="button-finish">
              <Trophy className="h-4 w-4" />
              {t("btn.finish", language)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
