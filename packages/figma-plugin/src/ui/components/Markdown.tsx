import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Custom components for rendering markdown elements with Figma-style styling
 */
const components: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),

  // Headings
  h1: ({ children }) => (
    <h1 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Code
  code: ({ className, children }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1 py-0.5 bg-figma-bg-tertiary rounded text-2xs font-mono">
          {children}
        </code>
      );
    }
    // Block code - extract language from className (e.g., "language-javascript")
    return (
      <code className="block bg-figma-bg-tertiary rounded p-2 text-2xs font-mono overflow-x-auto whitespace-pre-wrap">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-figma-border-brand pl-3 my-2 text-figma-text-secondary italic">
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-figma-text-brand underline hover:no-underline"
    >
      {children}
    </a>
  ),

  // Strong and emphasis
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  // Horizontal rule
  hr: () => <hr className="my-3 border-figma-border" />,

  // Tables (basic support)
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full text-2xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-figma-bg-tertiary">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-figma-border">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="px-2 py-1">{children}</td>,
};

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
