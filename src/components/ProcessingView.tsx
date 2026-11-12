import type { ReactNode } from "react";
const STAGES = [
  "Merakit strip",
  "Mengunggah file",
  "Membuat tautan dan QR",
] as const;
export function ProcessingView({
  stage,
  content,
}: {
  stage: number;
  content: ReactNode;
}) {
  return (
    <section className="workflow-page processing-page">
      <header className="processing-heading">
        <span className="eyebrow">Snapbooth / proses</span>
        <h1>Menyiapkan strip</h1>
        <p>Foto mentah tidak disimpan. Strip sedang diproses.</p>
      </header>
      <div className="processing-layout">
        <ol className="process-list">
          {STAGES.map((label, index) => (
            <li
              key={label}
              data-state={
                index < stage ? "done" : index === stage ? "active" : "pending"
              }
            >
              <span>{index < stage ? "✓" : `0${index + 1}`}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="process-content">{content}</div>
        <div
          className="process-progress"
          aria-label={`Tahap ${Math.min(stage + 1, STAGES.length)} dari ${STAGES.length}`}
        >
          <span
            style={{
              width: `${Math.min(((stage + 1) / STAGES.length) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
