import React from 'react';

const SmartResponseRenderer = ({ response }: { response: string }) => {
  // Render HTML tables and download links from backend response
  if (/<table[\s\S]*<\/table>/.test(response)) {
    // HTML table
    return <div dangerouslySetInnerHTML={{ __html: response }} />;
  }
  // Render download link if present
  if (/<a [^>]*download=[^>]*>.*<\/a>/.test(response)) {
    return <div dangerouslySetInnerHTML={{ __html: response }} />;
  }
  // Fallback: plain text
  return <div className="text-sm whitespace-pre-line">{response}</div>;
};

export default SmartResponseRenderer;
