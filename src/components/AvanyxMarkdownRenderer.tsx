import React, { useState } from 'react';
import Markdown, { Components } from 'react-markdown';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

export interface AvanyxMarkdownRendererProps {
  content: string;
  isUserMessage?: boolean;
  accentColor?: string;
}

const CodeBlock: React.FC<{
  language?: string;
  children: React.ReactNode;
}> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const displayLang = language ? language.toUpperCase() : 'CODE';

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-900 text-slate-100 shadow-sm">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-extrabold text-slate-300 tracking-wider">{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3 overflow-x-auto text-[12px] font-mono leading-relaxed text-slate-200">
        <pre className="m-0 p-0 font-mono">{children}</pre>
      </div>
    </div>
  );
};

export const AvanyxMarkdownRenderer: React.FC<AvanyxMarkdownRendererProps> = ({
  content,
  isUserMessage = false,
  accentColor = '#5B5CE2',
}) => {
  if (isUserMessage) {
    return (
      <div className="text-xs sm:text-[13px] leading-relaxed text-white whitespace-pre-wrap break-words font-normal">
        {content}
      </div>
    );
  }

  const customComponents: Components = {
    // Headings
    h1: ({ children }) => (
      <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white mt-4 mb-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
        <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: accentColor }} />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-2">
        <span className="w-1 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-2.5 mb-1">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 mb-1">
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className="text-xs sm:text-[13px] leading-[1.65] text-slate-700 dark:text-slate-300 mb-2.5 last:mb-0 font-normal break-words">
        {children}
      </p>
    ),

    // Bold / Strong (High contrast, crisp weight)
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-white tracking-tight">
        {children}
      </strong>
    ),

    // Italic / Em
    em: ({ children }) => (
      <em className="italic text-slate-700 dark:text-slate-300 font-medium">
        {children}
      </em>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="space-y-1.5 my-2.5 pl-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-1.5 my-2.5 pl-1 list-decimal list-inside text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 marker:font-bold marker:text-slate-500 dark:marker:text-slate-400">
        {children}
      </ol>
    ),
    li: ({ children }) => {
      return (
        <li className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-slate-400 dark:bg-slate-500" />
          <div className="flex-1 min-w-0">{children}</div>
        </li>
      );
    },

    // Code (inline vs block)
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-300/50 dark:border-slate-700/60"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock language={match ? match[1] : undefined}>
          {children}
        </CodeBlock>
      );
    },

    // Pre
    pre: ({ children }) => <>{children}</>,

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="my-3 pl-3.5 py-1.5 border-l-2 rounded-r-xl bg-slate-100/60 dark:bg-[#141B2E]/60 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px] italic leading-relaxed" style={{ borderColor: accentColor }}>
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#101627] shadow-xs">
        <table className="w-full text-left text-xs sm:text-[13px] border-collapse min-w-[320px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-100/90 dark:bg-[#141C30] border-b border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white font-extrabold">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50 dark:hover:bg-[#141C30]/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-3.5 py-2.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-[13px] align-top">
        {children}
      </td>
    ),

    // Horizontal Rule
    hr: () => (
      <hr className="my-4 border-t border-slate-200/80 dark:border-slate-800/80" />
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="font-bold underline hover:opacity-80 transition cursor-pointer"
        style={{ color: accentColor }}
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="avanyx-markdown-content avanyx-markdown-content overflow-x-auto break-words min-w-0">
      <Markdown components={customComponents}>{content}</Markdown>
    </div>
  );
};

