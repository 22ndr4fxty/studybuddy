import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/language";
import { t, languageLabels, type Language } from "@/lib/i18n";
import { Upload, BookOpen, Brain, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

const navItems = [
  { path: "/", icon: Upload, labelKey: "nav.upload" },
  { path: "/notes", icon: BookOpen, labelKey: "nav.notes" },
  { path: "/quizzes", icon: Brain, labelKey: "nav.quizzes" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background" data-testid="app-layout">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="StudyBuddy">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7h8M8 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight">StudyBuddy</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    data-testid={`nav-${item.labelKey.split(".")[1]}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(item.labelKey, language)}</span>
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" data-testid="button-language">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{languageLabels[language]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.entries(languageLabels) as [Language, string][]).map(([code, label]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={language === code ? "bg-accent" : ""}
                    data-testid={`lang-${code}`}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleTheme}
              data-testid="button-theme"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
