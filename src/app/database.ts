"use server";

// API-based SQL execution
export async function execute(sql: string) {
  const apiUrl = process.env.API_URL || "https://e6e129988f50.ngrok-free.app/api/query";
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add authentication headers if needed
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error("API error: " + res.statusText);
  return await res.json();
}