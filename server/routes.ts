import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
// @ts-ignore
import pdfParse from "pdf-parse";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const anthropic = new Anthropic();

function getVisitorId(req: Request): string {
  return req.headers["x-visitor-id"] as string || "local";
}

async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType.startsWith("image/")) {
    // Use Claude vision to extract text from images
    const base64 = buffer.toString("base64");
    const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const response = await anthropic.messages.create({
      model: "claude_sonnet_4_6",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [{
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        }, {
          type: "text",
          text: "Extract ALL text content from this image. Preserve the structure, headings, and formatting as much as possible. If it's handwritten notes, transcribe them accurately. Return only the extracted text.",
        }],
      }],
    });
    return (response.content[0] as any).text || "";
  }
  // Plain text files
  return buffer.toString("utf-8");
}

async function generateNotes(content: string, language: string): Promise<{ title: string; notes: string }> {
  const langInstruction = language === "zh-hk"
    ? "Generate the notes in Cantonese (廣東話/粵語). Use traditional Chinese characters."
    : language === "zh-tw"
    ? "Generate the notes in Traditional Chinese (繁體中文)."
    : "Generate the notes in English.";

  const response = await anthropic.messages.create({
    model: "claude_sonnet_4_6",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `You are a study notes expert. Analyze the following content and create well-organized, comprehensive study notes.

${langInstruction}

Requirements:
1. Create a clear, descriptive title
2. Organize into logical sections with headers
3. Use bullet points for key facts
4. Highlight important terms and definitions
5. Include summaries for each section
6. Add "Key Takeaways" at the end
7. Use markdown formatting

Return your response in this exact JSON format:
{"title": "...", "notes": "...markdown content..."}

Content to summarize:
${content.slice(0, 30000)}`,
    }],
  });

  const text = (response.content[0] as any).text || "{}";
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { title: "Study Notes", notes: text };
  } catch {
    return { title: "Study Notes", notes: text };
  }
}

async function generateQuiz(content: string, language: string): Promise<string> {
  const langInstruction = language === "zh-hk"
    ? "Generate the quiz in Cantonese (廣東話/粵語). Use traditional Chinese characters."
    : language === "zh-tw"
    ? "Generate the quiz in Traditional Chinese (繁體中文)."
    : "Generate the quiz in English.";

  const response = await anthropic.messages.create({
    model: "claude_sonnet_4_6",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `You are a quiz generator for students. Based on the following study material, create a comprehensive quiz.

${langInstruction}

Create exactly:
- 5 Multiple Choice questions
- 3 Fill-in-the-blank questions
- 2 Long answer questions

Return ONLY a JSON array of questions in this exact format (no other text):
[
  {
    "type": "mc",
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctIndex": 0,
    "explanation": "..."
  },
  {
    "type": "fill",
    "question": "The _____ is responsible for ...",
    "answer": "correct word",
    "explanation": "..."
  },
  {
    "type": "long",
    "question": "Explain...",
    "sampleAnswer": "A comprehensive answer...",
    "keyPoints": ["point1", "point2", "point3"]
  }
]

Study material:
${content.slice(0, 30000)}`,
    }],
  });

  const text = (response.content[0] as any).text || "[]";
  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : "[]";
}

async function gradeAnswer(question: string, sampleAnswer: string, keyPoints: string[], userAnswer: string, language: string): Promise<{ score: number; feedback: string }> {
  const langInstruction = language === "zh-hk"
    ? "Provide feedback in Cantonese (廣東話/粵語). Use traditional Chinese characters."
    : language === "zh-tw"
    ? "Provide feedback in Traditional Chinese (繁體中文)."
    : "Provide feedback in English.";

  const response = await anthropic.messages.create({
    model: "claude_sonnet_4_6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Grade this student's answer. ${langInstruction}

Question: ${question}
Sample Answer: ${sampleAnswer}
Key Points to cover: ${keyPoints.join(", ")}
Student's Answer: ${userAnswer}

Return JSON only: {"score": <0-100>, "feedback": "..."}`,
    }],
  });

  const text = (response.content[0] as any).text || '{"score": 0, "feedback": "Unable to grade"}';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { score: 0, feedback: text };
  } catch {
    return { score: 0, feedback: text };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Upload a file
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const content = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);

      const saved = await storage.createUpload({
        visitorId,
        filename: file.originalname,
        mimeType: file.mimetype,
        content,
        createdAt: new Date().toISOString(),
      });

      res.json(saved);
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(422).json({ error: err.message || "Upload failed" });
    }
  });

  // Get all uploads for visitor
  app.get("/api/uploads", async (req, res) => {
    const visitorId = getVisitorId(req);
    const items = await storage.getUploadsByVisitor(visitorId);
    res.json(items);
  });

  // Delete upload
  app.delete("/api/uploads/:id", async (req, res) => {
    await storage.deleteUpload(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Generate notes from upload
  app.post("/api/uploads/:id/notes", async (req, res) => {
    try {
      const uploadItem = await storage.getUpload(parseInt(req.params.id));
      if (!uploadItem) return res.status(404).json({ error: "Upload not found" });

      const language = req.body.language || "en";
      const result = await generateNotes(uploadItem.content, language);

      const note = await storage.createNote({
        uploadId: uploadItem.id,
        visitorId: getVisitorId(req),
        language,
        title: result.title,
        content: result.notes,
        createdAt: new Date().toISOString(),
      });

      res.json(note);
    } catch (err: any) {
      console.error("Notes generation error:", err);
      res.status(422).json({ error: err.message || "Failed to generate notes" });
    }
  });

  // Get notes for an upload
  app.get("/api/uploads/:id/notes", async (req, res) => {
    const items = await storage.getNotesByUpload(parseInt(req.params.id));
    res.json(items);
  });

  // Get single note
  app.get("/api/notes/:id", async (req, res) => {
    const note = await storage.getNote(parseInt(req.params.id));
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  });

  // Generate quiz from upload
  app.post("/api/uploads/:id/quiz", async (req, res) => {
    try {
      const uploadItem = await storage.getUpload(parseInt(req.params.id));
      if (!uploadItem) return res.status(404).json({ error: "Upload not found" });

      const language = req.body.language || "en";
      const questions = await generateQuiz(uploadItem.content, language);

      const quiz = await storage.createQuiz({
        uploadId: uploadItem.id,
        visitorId: getVisitorId(req),
        language,
        questions,
        createdAt: new Date().toISOString(),
      });

      res.json(quiz);
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      res.status(422).json({ error: err.message || "Failed to generate quiz" });
    }
  });

  // Get quizzes for upload
  app.get("/api/uploads/:id/quizzes", async (req, res) => {
    const items = await storage.getQuizzesByUpload(parseInt(req.params.id));
    res.json(items);
  });

  // Get single quiz
  app.get("/api/quizzes/:id", async (req, res) => {
    const quiz = await storage.getQuiz(parseInt(req.params.id));
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  });

  // Grade a long answer
  app.post("/api/grade", async (req, res) => {
    try {
      const { question, sampleAnswer, keyPoints, userAnswer, language } = req.body;
      const result = await gradeAnswer(question, sampleAnswer, keyPoints, userAnswer, language || "en");
      res.json(result);
    } catch (err: any) {
      console.error("Grading error:", err);
      res.status(422).json({ error: err.message || "Failed to grade" });
    }
  });

  // Save quiz attempt
  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const attempt = await storage.createQuizAttempt({
        ...req.body,
        visitorId: getVisitorId(req),
        createdAt: new Date().toISOString(),
      });
      res.json(attempt);
    } catch (err: any) {
      console.error("Quiz attempt error:", err);
      res.status(422).json({ error: err.message || "Failed to save attempt" });
    }
  });

  // Get all notes for visitor
  app.get("/api/notes", async (req, res) => {
    const visitorId = getVisitorId(req);
    const items = await storage.getNotesByVisitor(visitorId);
    res.json(items);
  });

  // Get all quizzes for visitor
  app.get("/api/quizzes", async (req, res) => {
    const visitorId = getVisitorId(req);
    const items = await storage.getQuizzesByVisitor(visitorId);
    res.json(items);
  });

  return httpServer;
}
