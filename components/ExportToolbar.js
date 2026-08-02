"use client";

function safeFileName(value) {
  return String(value || "chalkboard-export")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function downloadBlob(content, type, fileName) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cleanClone(root) {
  const clone = root.cloneNode(true);
  clone
    .querySelectorAll("button, input, select, textarea, [data-no-export='true']")
    .forEach((element) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) {
        const replacement = document.createElement("span");
        replacement.textContent =
          element.value ||
          element.options?.[element.selectedIndex]?.text ||
          "";
        element.replaceWith(replacement);
      } else {
        element.remove();
      }
    });
  return clone;
}

function findScope(selector) {
  return (
    document.querySelector(selector) ||
    document.querySelector(".main") ||
    document.querySelector(".cb-portal-main") ||
    document.querySelector("main") ||
    document.body
  );
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function ExportToolbar({
  title = "Chalkboard",
  scopeSelector = ".main, .cb-portal-main",
}) {
  function exportPdf() {
    const root = findScope(scopeSelector);
    const clone = cleanClone(root);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Allow pop-ups to print or save this page as PDF.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body{font-family:Arial,sans-serif;color:#18243a;padding:30px;line-height:1.5}
            h1,h2,h3{color:#041a4d}
            table{width:100%;border-collapse:collapse;margin:18px 0;font-size:12px}
            th,td{border:1px solid #d9e0e8;padding:8px;text-align:left;vertical-align:top}
            th{background:#eef5ff}
            .card{border:1px solid #d9e0e8;border-radius:10px;padding:14px;margin:12px 0;page-break-inside:avoid}
            @page{size:A4;margin:15mm}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${clone.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  }

  function exportExcel() {
    const root = findScope(scopeSelector);
    const tables = Array.from(root.querySelectorAll("table"));
    const lines = [];

    if (tables.length) {
      tables.forEach((table, index) => {
        const heading =
          table.previousElementSibling?.innerText?.trim() ||
          `${title} table ${index + 1}`;
        lines.push(csvEscape(heading));

        Array.from(table.querySelectorAll("tr")).forEach((row) => {
          const values = Array.from(
            row.querySelectorAll("th,td"),
          ).map((cell) =>
            csvEscape(
              String(cell.innerText || "")
                .replace(/\s+/g, " ")
                .trim(),
            ),
          );
          lines.push(values.join(","));
        });

        lines.push("");
      });
    } else {
      String(root.innerText || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => lines.push(csvEscape(line)));
    }

    downloadBlob(
      `\uFEFF${lines.join("\r\n")}`,
      "text/csv;charset=utf-8",
      `${safeFileName(title)}.csv`,
    );
  }

  function exportWord() {
    const root = findScope(scopeSelector);
    const clone = cleanClone(root);
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body{font-family:Arial,sans-serif;color:#18243a;line-height:1.5}
            h1,h2,h3{color:#041a4d}
            table{width:100%;border-collapse:collapse;margin:16px 0}
            th,td{border:1px solid #cfd7e2;padding:8px;vertical-align:top}
            th{background:#eef5ff}
            .card{border:1px solid #d9e0e8;padding:12px;margin:10px 0}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${clone.innerHTML}
        </body>
      </html>
    `;

    downloadBlob(
      `\uFEFF${html}`,
      "application/msword",
      `${safeFileName(title)}.doc`,
    );
  }

  return (
    <div
      data-no-export="true"
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        margin: "14px 0 20px",
      }}
    >
      <button type="button" onClick={exportPdf}>
        Print / Save PDF
      </button>
      <button type="button" className="ghost" onClick={exportExcel}>
        Export Excel
      </button>
      <button type="button" className="ghost" onClick={exportWord}>
        Export Word
      </button>
    </div>
  );
}
