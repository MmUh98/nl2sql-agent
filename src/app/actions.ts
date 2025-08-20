"use server";

// Step 1: Detect download requests in the user prompt
// Step 2: Helper to format SQL results as HTML table
function toHTMLTable(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return "<div>No data</div>";
  const headers = Object.keys(data[0]);
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const dataRows = data.map(row =>
    `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
  ).join('');
  return `<table border=\"1\"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>`;
}

// Step 3: Helper to generate CSV
function toCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(","))
  ];
  return csvRows.join("\r\n");
}

import { AzureChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  mapStoredMessagesToChatMessages,
  StoredMessage,
} from "@langchain/core/messages";
import { execute } from "./database";


// Cache for schema summary
let cachedSchemaSummary: string | null = null;
let schemaSummaryPromise: Promise<string> | null = null;

// Helper to fetch schema info (databases, tables, columns) with logging and error reporting
async function getSchemaSummary() {
  if (cachedSchemaSummary) return cachedSchemaSummary;
  if (schemaSummaryPromise) return schemaSummaryPromise;
  schemaSummaryPromise = (async () => {
    let dbs = [];
    let log = [];
    try {
      dbs = await execute("SELECT [name] FROM [master].[sys].[databases];");
      log.push(`Databases found: ${dbs.map((d: any) => d.name || d["name"]).join(", ")}`);
    } catch (e) {
      log.push(`Failed to fetch databases: ${e}`);
    }
    let schemaInfo = [];
    for (const db of dbs) {
      const dbName = db.name || db["name"];
      let tables = [];
      try {
        tables = await execute(`SELECT TABLE_SCHEMA, TABLE_NAME FROM [${dbName}].INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';`);
        log.push(`Tables in ${dbName}: ${tables.map((t: any) => t.TABLE_NAME || t["TABLE_NAME"]).join(", ")}`);
      } catch (e) {
        log.push(`Failed to fetch tables for ${dbName}: ${e}`);
        continue;
      }
      for (const t of tables) {
        const schema = t.TABLE_SCHEMA || t["TABLE_SCHEMA"];
        const table = t.TABLE_NAME || t["TABLE_NAME"];
        let columns = [];
        try {
          columns = await execute(`SELECT COLUMN_NAME FROM [${dbName}].INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA = '${schema}';`);
          log.push(`Columns in ${dbName}.${schema}.${table}: ${columns.map((c: any) => c.COLUMN_NAME || c["COLUMN_NAME"]).join(", ")}`);
        } catch (e) {
          log.push(`Failed to fetch columns for ${dbName}.${schema}.${table}: ${e}`);
          continue;
        }
        schemaInfo.push({ db: dbName, schema, table, columns: columns.map((c: { COLUMN_NAME?: string }) => c.COLUMN_NAME || c["COLUMN_NAME"]) });
      }
    }
    let summary = 'Database schema overview:';
    for (const t of schemaInfo) {
      summary += `\n- [${t.db}].[${t.schema}].[${t.table}] columns: ${t.columns.join(', ')}`;
    }
    if (log.length > 0) {
      summary += `\n\n[Schema discovery log:]\n${log.join("\n")}`;
    }
    cachedSchemaSummary = summary;
    return summary;
  })();
  return schemaSummaryPromise;
}

// Run schema discovery at server startup
// Kick off schema discovery in background at startup
getSchemaSummary().catch(() => {});

// Refresh schema summary every 30 minutes in background
setInterval(() => {
  getSchemaSummary().catch(err => console.error("Schema refresh failed:", err));
}, 30 * 60 * 1000);


export async function message(messages: StoredMessage[]) {
  let deserialized = mapStoredMessagesToChatMessages(messages);

  // Step 1: Detect download requests in the user prompt
  const lastUserMessage = messages[messages.length - 1]?.data?.content?.toLowerCase() || "";
  // Smarter CSV/download/spreadsheet detection
  const wantsCSV = /\bcsv\b|download|spreadsheet/i.test(lastUserMessage);

  // Helper to extract table name from SQL query
  function extractTableName(sql: string): string | null {
    // Simple regex for FROM <table> or JOIN <table>
    const match = /from\s+([\w\d_]+)/i.exec(sql) || /join\s+([\w\d_]+)/i.exec(sql);
    return match ? match[1] : null;
  }

  // Prepend schema info to system message, but never block on schema discovery
  const schemaSummary = cachedSchemaSummary || "Schema is loading in background...";
  deserialized[0].content = `${schemaSummary}\n\n${deserialized[0].content}`;

  // @ts-expect-error: Type instantiation is excessively deep and possibly infinite (ts2589)
  const getFromDB = tool(
    async (input) => {
      if (input?.sql) {
        console.log({ sql: input.sql });
        const result = await execute(input.sql);
        if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
          if (wantsCSV) {
            // Extract table name for filename, fallback to timestamp
            const tableName = extractTableName(input.sql);
            const fileName = `${tableName || 'data'}_${Date.now()}.csv`;
            // Generate CSV and return as a data URL download link
            const csv = toCSV(result);
            const base64 = Buffer.from(csv).toString('base64');
            return `Here is your CSV file: <a href="data:text/csv;base64,${base64}" download="${fileName}"><b>Download CSV</b></a>`;
          }
          // Default: return as HTML table
          return toHTMLTable(result);
        }
        // Otherwise, return as string
        return typeof result === 'string' ? result : JSON.stringify(result);
      }
      return null;
    },
    {
      name: "get_from_db",
      description: `Get data from a SQL Server database. The schema (databases, tables, columns) is discovered dynamically at runtime.`,
      schema: z.object({
        sql: z
          .string()
          .describe(
            "SQL query to get data from a SQL Server database. Always put quotes around the field and table arguments."
          ),
      }),
    }
  );
 
  // @ts-expect-error: Type instantiation is excessively deep and possibly infinite (ts2589)
  
  const agent = createReactAgent({
    llm: new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: process.env.OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
      azureOpenAIApiInstanceName: "manso-mdfm2cer", //  from  Azure endpoint
      temperature: 0,
    }),
    tools: [getFromDB],
  });
  const response = await agent.invoke({
    messages: deserialized,
  });

  // console.log({ response });

  return response.messages[response.messages.length - 1].content;
}