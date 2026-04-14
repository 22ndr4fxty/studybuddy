interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown to HTML converter
  const html = content
    .replace(/^#{4,} (.*$)/gm, '<h4>$1</h4>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('<li>')) return `<ul>${match}</ul>`;
      return match;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}
