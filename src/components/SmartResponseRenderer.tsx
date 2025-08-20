
import React from "react";

const SmartResponseRenderer = ({ response }: { response: string }) => {
  // Detect tables
  if (/<table[\s\S]*<\/table>/.test(response)) {
    return (
      <div className="chat-bubble">
        <div className="table-scroll">
          <div
            className="table-container"
            dangerouslySetInnerHTML={{
              __html: response.replace(
                /<table/g,
                '<table class="styled-table"'
              ),
            }}
          />
        </div>
      </div>
    );
  }

  // Detect download links
  if (/<a [^>]*download=[^>]*>.*<\/a>/.test(response)) {
    return <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: response }} />;
  }

  // Fallback plain text
  return <div className="chat-bubble text-sm whitespace-pre-line">{response}</div>;
};

export default SmartResponseRenderer;
