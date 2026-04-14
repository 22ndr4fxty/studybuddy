import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/language";
import { Layout } from "@/components/layout";
import UploadPage from "@/pages/upload";
import NotesListPage from "@/pages/notes-list";
import NoteViewPage from "@/pages/note-view";
import QuizzesListPage from "@/pages/quizzes-list";
import QuizViewPage from "@/pages/quiz-view";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={UploadPage} />
        <Route path="/notes" component={NotesListPage} />
        <Route path="/notes/:id" component={NoteViewPage} />
        <Route path="/quizzes" component={QuizzesListPage} />
        <Route path="/quizzes/:id" component={QuizViewPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
