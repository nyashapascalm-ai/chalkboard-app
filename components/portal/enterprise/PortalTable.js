"use client";

export default function PortalTable({
  columns,
  rows,
  emptyMessage,
  rowKey = "id",
}) {
  if (!rows.length) {
    return (
      <p className="enterprise-empty">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="enterprise-table-wrap">
      <table className="enterprise-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
