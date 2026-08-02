"use client";

export default function PortalNav({
  items,
  active,
  onChange,
}) {
  return (
    <nav className="enterprise-nav">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.key}
            type="button"
            className={
              active === item.key
                ? "active"
                : ""
            }
            onClick={() =>
              onChange(item.key)
            }
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
