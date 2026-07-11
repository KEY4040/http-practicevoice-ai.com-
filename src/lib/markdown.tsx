import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Minimal, safe Markdown-subset renderer for our own blog content (trusted
 * authors, so no dangerouslySetInnerHTML and no XSS surface). Supports:
 *   ## / ### headings, paragraphs, - and 1. lists, > callouts,
 *   **bold**, *italic*, `code`, and [text](url) links (internal -> <Link>).
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Tokenize on links, bold, italic, code — process links first.
  const pattern =
    /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(`[^`]+`)|(\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("[")) {
      const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith("/")) {
          nodes.push(
            <Link key={key} to={href} className="text-primary hover:underline">
              {label}
            </Link>
          );
        } else {
          nodes.push(
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {label}
            </a>
          );
        }
      } else nodes.push(tok);
    } else if (tok.startsWith("**")) {
      nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("*")) {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="mt-8 text-lg font-semibold tracking-tight">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="mt-10 text-2xl font-bold tracking-tight">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={key++} className="mt-10 text-2xl font-bold tracking-tight">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquote / callout
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-6 rounded-r-xl border-l-4 border-primary bg-primary/[0.04] px-5 py-4 text-[0.95em] font-medium text-foreground"
        >
          {renderInline(quote.join(" "), `bq-${key}`)}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-4 list-disc space-y-1.5 pl-6">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-4 list-decimal space-y-1.5 pl-6">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Table:  | a | b |  /  |---|---|  / rows…
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|/.test(lines[i + 1])) {
      const parseRow = (row: string) =>
        row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const header = parseRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {header.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 font-semibold text-foreground">
                    {renderInline(h, `th-${key}-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-border">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 align-top text-muted-foreground">
                      {renderInline(c, `td-${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Paragraph (gather consecutive non-blank, non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-4 leading-relaxed text-muted-foreground">
        {renderInline(para.join(" "), `p-${key}`)}
      </p>
    );
  }

  return <Fragment>{blocks}</Fragment>;
}
