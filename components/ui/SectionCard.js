"use client";

export default function SectionCard({
  title,
  description,
  actions,
  children,
}) {
  return (
    <section className="card section-card">
      {title || description || actions ? (
        <header className="section-card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? (
              <p>{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="section-card-actions">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}
