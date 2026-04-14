export type Language = "en" | "zh-hk" | "zh-tw";

export const languageLabels: Record<Language, string> = {
  en: "English",
  "zh-hk": "廣東話",
  "zh-tw": "繁體中文",
};

const translations: Record<string, Record<Language, string>> = {
  "app.title": { en: "StudyBuddy", "zh-hk": "StudyBuddy", "zh-tw": "StudyBuddy" },
  "app.subtitle": { en: "Smart Study Notes & Quizzes", "zh-hk": "智能學習筆記同測驗", "zh-tw": "智能學習筆記與測驗" },
  "nav.upload": { en: "Upload", "zh-hk": "上傳", "zh-tw": "上傳" },
  "nav.notes": { en: "Notes", "zh-hk": "筆記", "zh-tw": "筆記" },
  "nav.quizzes": { en: "Quizzes", "zh-hk": "測驗", "zh-tw": "測驗" },
  "upload.title": { en: "Upload Study Material", "zh-hk": "上傳學習材料", "zh-tw": "上傳學習材料" },
  "upload.desc": { en: "Upload a PDF, image, or text file to generate notes and quizzes", "zh-hk": "上傳 PDF、圖片或文字檔案嚟生成筆記同測驗", "zh-tw": "上傳 PDF、圖片或文字檔案來生成筆記與測驗" },
  "upload.drop": { en: "Drop files here or click to browse", "zh-hk": "將檔案拖放到呢度或者按一下瀏覽", "zh-tw": "將檔案拖放到這裡或點擊瀏覽" },
  "upload.formats": { en: "Supports PDF, images (JPG, PNG), and text files", "zh-hk": "支援 PDF、圖片 (JPG, PNG) 同文字檔案", "zh-tw": "支援 PDF、圖片 (JPG, PNG) 和文字檔案" },
  "upload.uploading": { en: "Uploading...", "zh-hk": "上傳中...", "zh-tw": "上傳中..." },
  "upload.processing": { en: "Processing file...", "zh-hk": "處理檔案中...", "zh-tw": "處理檔案中..." },
  "btn.genNotes": { en: "Generate Notes", "zh-hk": "生成筆記", "zh-tw": "生成筆記" },
  "btn.genQuiz": { en: "Generate Quiz", "zh-hk": "生成測驗", "zh-tw": "生成測驗" },
  "btn.download": { en: "Download PDF", "zh-hk": "下載 PDF", "zh-tw": "下載 PDF" },
  "btn.submit": { en: "Submit", "zh-hk": "提交", "zh-tw": "提交" },
  "btn.next": { en: "Next", "zh-hk": "下一題", "zh-tw": "下一題" },
  "btn.prev": { en: "Previous", "zh-hk": "上一題", "zh-tw": "上一題" },
  "btn.finish": { en: "Finish Quiz", "zh-hk": "完成測驗", "zh-tw": "完成測驗" },
  "btn.retry": { en: "Try Again", "zh-hk": "再試一次", "zh-tw": "再試一次" },
  "btn.back": { en: "Back", "zh-hk": "返回", "zh-tw": "返回" },
  "quiz.mc": { en: "Multiple Choice", "zh-hk": "選擇題", "zh-tw": "選擇題" },
  "quiz.fill": { en: "Fill in the Blank", "zh-hk": "填充題", "zh-tw": "填空題" },
  "quiz.long": { en: "Long Question", "zh-hk": "長答題", "zh-tw": "問答題" },
  "quiz.score": { en: "Score", "zh-hk": "分數", "zh-tw": "分數" },
  "quiz.correct": { en: "Correct!", "zh-hk": "正確！", "zh-tw": "正確！" },
  "quiz.incorrect": { en: "Incorrect", "zh-hk": "錯誤", "zh-tw": "錯誤" },
  "quiz.results": { en: "Quiz Results", "zh-hk": "測驗結果", "zh-tw": "測驗結果" },
  "quiz.grading": { en: "Grading...", "zh-hk": "批改中...", "zh-tw": "批改中..." },
  "generating.notes": { en: "Generating notes...", "zh-hk": "生成筆記中...", "zh-tw": "生成筆記中..." },
  "generating.quiz": { en: "Generating quiz...", "zh-hk": "生成測驗中...", "zh-tw": "生成測驗中..." },
  "empty.uploads": { en: "No uploads yet", "zh-hk": "未有上傳", "zh-tw": "尚無上傳" },
  "empty.notes": { en: "No notes generated yet", "zh-hk": "未有筆記", "zh-tw": "尚無筆記" },
  "empty.quizzes": { en: "No quizzes generated yet", "zh-hk": "未有測驗", "zh-tw": "尚無測驗" },
  "label.language": { en: "Language", "zh-hk": "語言", "zh-tw": "語言" },
  "label.question": { en: "Question", "zh-hk": "題目", "zh-tw": "題目" },
  "label.answer": { en: "Your Answer", "zh-hk": "你嘅答案", "zh-tw": "你的答案" },
  "label.explanation": { en: "Explanation", "zh-hk": "解釋", "zh-tw": "解釋" },
  "label.sampleAnswer": { en: "Sample Answer", "zh-hk": "參考答案", "zh-tw": "參考答案" },
  "label.keyPoints": { en: "Key Points", "zh-hk": "重點", "zh-tw": "重點" },
  "label.feedback": { en: "Feedback", "zh-hk": "反饋", "zh-tw": "反饋" },
  "label.of": { en: "of", "zh-hk": "/", "zh-tw": "/" },
  "label.delete": { en: "Delete", "zh-hk": "刪除", "zh-tw": "刪除" },
  "label.view": { en: "View", "zh-hk": "查看", "zh-tw": "查看" },
  "label.files": { en: "My Files", "zh-hk": "我嘅檔案", "zh-tw": "我的檔案" },
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}
