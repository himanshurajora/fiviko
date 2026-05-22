/** Renders AI text (light markdown: bullets, bold, blank-line paragraphs). */
export function AiText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*[-*•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

/** Minimal **bold** support. */
function renderInline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}
