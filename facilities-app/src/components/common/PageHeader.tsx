interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-[var(--fass-border)] bg-white px-5 py-3.5 shadow-sm backdrop-blur lg:grid-cols-[1fr_auto] lg:items-center lg:px-6">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          {eyebrow ? (
            <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--fass-blue)]" style={{ backgroundColor: 'var(--fass-accent-soft)' }}>
              {eyebrow}
            </div>
          ) : null}
          <h1
            className="text-2xl font-bold text-[var(--fass-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h1>
        </div>
        {description ? (
          <p className="max-w-3xl text-sm text-[var(--fass-text-muted)]">{description}</p>
        ) : null}
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </div>
  );
}
