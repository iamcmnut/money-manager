import { Fragment, type ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        out.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '[') {
      const close = text.indexOf('](', i + 1);
      const paren = close !== -1 ? text.indexOf(')', close + 2) : -1;
      if (close !== -1 && paren !== -1) {
        const label = text.slice(i + 1, close);
        const url = text.slice(close + 2, paren);
        out.push(
          <a key={key++} href={url} className="text-primary underline-offset-4 hover:underline">
            {label}
          </a>,
        );
        i = paren + 1;
        continue;
      }
    }
    // accumulate plain text up to next special marker
    let j = i + 1;
    while (j < text.length && !text.startsWith('**', j) && text[j] !== '[') j++;
    out.push(<Fragment key={key++}>{text.slice(i, j)}</Fragment>);
    i = j;
  }
  return out;
}

export function MarkdownLite({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    if (trimmed === '') {
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const baseClass = 'font-semibold tracking-tight';
      const sized =
        level === 1
          ? 'mt-0 mb-4 text-3xl'
          : level === 2
            ? 'mt-6 mb-2 text-xl'
            : level === 3
              ? 'mt-4 mb-2 text-lg'
              : 'mt-3 mb-1 text-base';
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4');
      blocks.push(
        <Tag key={key++} className={`${baseClass} ${sized}`}>
          {renderInline(content)}
        </Tag>,
      );
      i++;
      continue;
    }

    // Bullet list block
    if (/^\s*-\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-3 ml-6 list-disc space-y-1 text-sm leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraph (consume contiguous non-blank, non-special lines)
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-3 text-sm leading-relaxed">
        {renderInline(paragraph.join(' '))}
      </p>,
    );
  }

  return <div className="prose-warm">{blocks}</div>;
}
