import React, { useRef } from 'react';

const SmartResponseRenderer = ({ response }: { response: string }) => {
  // Helper: extract table data from HTML or markdown
  function extractTableData() {
    // Try HTML table
    const htmlMatch = response.match(/<table[\s\S]*?<\/table>/);
    if (htmlMatch) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlMatch[0], 'text/html');
      const rows = Array.from(doc.querySelectorAll('tr'));
      return rows.map(row => Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent || ''));
    }
    // Try markdown table
    const lines = response.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 1 && lines[0].includes('|') && lines[1].includes('|')) {
      const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
      const dataRows = lines.slice(2).map(line => line.split('|').map(c => c.trim()).filter(Boolean));
      return [headers, ...dataRows];
    }
    // Try numbered list (find first block of consecutive numbered lines)
    let numberedRows: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^\d+\./.test(lines[i])) {
        let block = [];
        let j = i;
        while (j < lines.length && /^\d+\./.test(lines[j])) {
          block.push(lines[j]);
          j++;
        }
        if (block.length > 0) {
          numberedRows = block;
          break;
        }
      }
    }
    if (numberedRows.length > 0) {
      return [['Value'], ...numberedRows.map(l => [l.replace(/^\d+\.\s*/, '')])];
    }
    return null;
  }

  // Download as CSV
  function handleDownloadCSV() {
    const table = extractTableData();
    if (!table) return alert('No table data to download.');
    const csv = table.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'response.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Download as Excel (XLSX)
  async function handleDownloadExcel() {
    const table = extractTableData();
    if (!table) return alert('No table data to download.');
    // Dynamically import xlsx
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'response.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }
  const responseRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (responseRef.current) {
      const text = responseRef.current.innerText;
      await navigator.clipboard.writeText(text);
      alert('Response copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (responseRef.current) {
      const blob = new Blob([responseRef.current.innerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'response.html';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Render markdown tables as HTML tables
  const renderMarkdownTable = (md: string) => {
    const lines = md.trim().split('\n');
    if (lines.length < 2 || !lines[1].includes('|')) return null;
    const headers = lines[0].split('|').map((h) => h.trim()).filter(Boolean);
    const rows = lines.slice(2).map((line) => line.split('|').map((c) => c.trim()).filter(Boolean));
    return (
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-200">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="text-left p-2 border border-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-2 border border-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render HTML tables as real tables
  const renderHTMLTable = (html: string) => {
    if (/<table[\s\S]*<\/table>/.test(html)) {
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return null;
  };

  // Render code blocks
  const renderCodeBlock = (code: string) => (
    <pre className="bg-gray-900 text-white text-sm p-3 rounded overflow-x-auto my-2">
      <code>{code}</code>
    </pre>
  );

  // Render numbered lists
  const renderNumberedList = (lines: string[]) => (
    <ol className="ml-4 list-decimal">
      {lines.map((line, i) => (
        <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>
      ))}
    </ol>
  );

  // Main render logic
  const renderResponse = () => {
    // Check for HTML table
    if (/<table[\s\S]*<\/table>/.test(response)) {
      return renderHTMLTable(response);
    }
    // Check for markdown table
    if (/^\s*\|(.+\|)+\s*\n/.test(response)) {
      return renderMarkdownTable(response);
    }
    // Check for code block
    const codeBlockMatch = response.match(/```([\s\S]*?)```/);
    if (codeBlockMatch) {
      return renderCodeBlock(codeBlockMatch[1]);
    }
    // Check for numbered list
    const lines = response.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 0 && lines.every(l => /^\d+\./.test(l))) {
      return renderNumberedList(lines);
    }
    // Fallback: plain text
    return <div className="text-sm whitespace-pre-line">{response}</div>;
  };

  return (
    <div className="space-y-4" ref={responseRef}>
      {renderResponse()}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCopy}
          className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded flex items-center"
        >
          Copy
        </button>
        <button
          onClick={handleDownloadCSV}
          className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded flex items-center"
        >
          Download CSV
        </button>
        <button
          onClick={handleDownloadExcel}
          className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded flex items-center"
        >
          Download Excel
        </button>
      </div>
    </div>
  );
};

export default SmartResponseRenderer;
