"use client";

export default function ChalkMark({
  size = 44,
}) {
  return (
    <img
      src="/icon-192.png"
      alt="Chalkboard"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: Math.max(
          8,
          Math.round(size * 0.22),
        ),
      }}
    />
  );
}
