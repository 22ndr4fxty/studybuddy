import {
  type Upload, type InsertUpload, uploads,
  type Note, type InsertNote, notes,
  type Quiz, type InsertQuiz, quizzes,
  type QuizAttempt, type InsertQuizAttempt, quizAttempts,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Uploads
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  getUploadsByVisitor(visitorId: string): Promise<Upload[]>;
  deleteUpload(id: number): Promise<void>;

  // Notes
  createNote(note: InsertNote): Promise<Note>;
  getNote(id: number): Promise<Note | undefined>;
  getNotesByUpload(uploadId: number): Promise<Note[]>;
  getNotesByVisitor(visitorId: string): Promise<Note[]>;

  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByUpload(uploadId: number): Promise<Quiz[]>;
  getQuizzesByVisitor(visitorId: string): Promise<Quiz[]>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByQuiz(quizId: number): Promise<QuizAttempt[]>;
}

export class DatabaseStorage implements IStorage {
  async createUpload(upload: InsertUpload): Promise<Upload> {
    return db.insert(uploads).values(upload).returning().get();
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    return db.select().from(uploads).where(eq(uploads.id, id)).get();
  }

  async getUploadsByVisitor(visitorId: string): Promise<Upload[]> {
    return db.select().from(uploads).where(eq(uploads.visitorId, visitorId)).orderBy(desc(uploads.id)).all();
  }

  async deleteUpload(id: number): Promise<void> {
    db.delete(uploads).where(eq(uploads.id, id)).run();
    db.delete(notes).where(eq(notes.uploadId, id)).run();
    db.delete(quizzes).where(eq(quizzes.uploadId, id)).run();
  }

  async createNote(note: InsertNote): Promise<Note> {
    return db.insert(notes).values(note).returning().get();
  }

  async getNote(id: number): Promise<Note | undefined> {
    return db.select().from(notes).where(eq(notes.id, id)).get();
  }

  async getNotesByUpload(uploadId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.uploadId, uploadId)).orderBy(desc(notes.id)).all();
  }

  async getNotesByVisitor(visitorId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.visitorId, visitorId)).orderBy(desc(notes.id)).all();
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    return db.insert(quizzes).values(quiz).returning().get();
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return db.select().from(quizzes).where(eq(quizzes.id, id)).get();
  }

  async getQuizzesByUpload(uploadId: number): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.uploadId, uploadId)).orderBy(desc(quizzes.id)).all();
  }

  async getQuizzesByVisitor(visitorId: string): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.visitorId, visitorId)).orderBy(desc(quizzes.id)).all();
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    return db.insert(quizAttempts).values(attempt).returning().get();
  }

  async getQuizAttemptsByQuiz(quizId: number): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId)).orderBy(desc(quizAttempts.id)).all();
  }
}

export const storage = new DatabaseStorage();
