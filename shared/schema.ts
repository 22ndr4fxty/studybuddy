import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(), // extracted text content
  createdAt: text("created_at").notNull(),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  language: text("language").notNull().default("en"), // en, zh-hk, zh-tw
  title: text("title").notNull(),
  content: text("content").notNull(), // markdown content
  createdAt: text("created_at").notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  language: text("language").notNull().default("en"),
  questions: text("questions").notNull(), // JSON string of questions
  createdAt: text("created_at").notNull(),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  answers: text("answers").notNull(), // JSON string
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  createdAt: text("created_at").notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads).omit({ id: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Question types for the quiz
export interface MCQuestion {
  type: "mc";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FillBlankQuestion {
  type: "fill";
  question: string; // with _____ for blanks
  answer: string;
  explanation: string;
}

export interface LongQuestion {
  type: "long";
  question: string;
  sampleAnswer: string;
  keyPoints: string[];
}

export type QuizQuestion = MCQuestion | FillBlankQuestion | LongQuestion;
