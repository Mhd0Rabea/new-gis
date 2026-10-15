const escapeCsv = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
export function createCsv(headers, rows) {
 return '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}
export function downloadCsv(filename, content) {
 const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
 const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
