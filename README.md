
# NL2SQL Agent

This is a Next.js project that converts natural language queries to SQL and retrieves results from a SQLite database. It features a chat UI with:

- AI-powered SQL generation and database querying
- Table rendering for structured responses
- Copy, Download CSV, and Download Excel buttons for tabular results

## Features

- **Natural language to SQL**: Enter questions in plain English, get SQL queries and results.
- **Table rendering**: Results are shown as tables when possible.
- **Download options**: Export results as CSV or Excel (`.xlsx`) files using the [xlsx](https://www.npmjs.com/package/xlsx) package.
- **Copy to clipboard**: One-click copy for any response.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Type a question (e.g., "Give me first 5 customer names") and press Send.
- If the response is a table or list, use the Copy, Download CSV, or Download Excel buttons below the response.

## Dependencies

- next
- react
- sqlite3
- xlsx (for Excel export)
- tailwindcss
- langchain

## License

MIT
