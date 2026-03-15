import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with proper styling and code highlighting.
 * Follows clean architecture principles with separation of concerns.
 */
const MarkdownRenderer = memo<MarkdownRendererProps>(
  ({ content, className }) => {
    return (
      <div
        className={cn(
          "markdown-content prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          className
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Custom paragraph component to maintain consistent spacing
            p: ({ children, ...props }) => (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0 mb-3 last:mb-0"
                {...props}
              >
                {children}
              </p>
            ),
            // Custom code block component
            pre: ({ children, ...props }) => (
              <pre
                className="bg-muted border border-border rounded-lg p-3 overflow-x-auto text-sm my-3"
                {...props}
              >
                {children}
              </pre>
            ),
            // Custom inline code component
            code: ({ children, className, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // Custom heading components
            h1: ({ children, ...props }) => (
              <h1
                className="text-lg font-semibold mt-4 mb-2 first:mt-0"
                {...props}
              >
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2
                className="text-base font-semibold mt-3 mb-2 first:mt-0"
                {...props}
              >
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3
                className="text-sm font-semibold mt-3 mb-1 first:mt-0"
                {...props}
              >
                {children}
              </h3>
            ),
            // Custom list components
            ul: ({ children, ...props }) => (
              <ul className="my-2 space-y-1" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal pl-4 my-2 space-y-1" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li
                className="text-sm leading-relaxed relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-foreground before:font-bold"
                {...props}
              >
                {children}
              </li>
            ),
            // Custom blockquote component
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="border-l-4 border-border pl-4 my-3 italic text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            ),
            // Custom table components
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full border-collapse border border-border rounded-none bg-background"
                  {...props}
                >
                  {children}
                </table>
              </div>
            ),
            thead: ({ children, ...props }) => (
              <thead className="bg-muted/50" {...props}>
                {children}
              </thead>
            ),
            tbody: ({ children, ...props }) => (
              <tbody {...props}>{children}</tbody>
            ),
            tr: ({ children, ...props }) => (
              <tr
                className="border-b border-border rounded-lg last:border-b-0"
                {...props}
              >
                {children}
              </tr>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-border px-4 py-3 bg-muted text-left font-semibold text-sm first:rounded-tl-lg last:rounded-tr-lg"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-border px-4 py-3 text-sm" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

MarkdownRenderer.displayName = "MarkdownRenderer";

export { MarkdownRenderer };
