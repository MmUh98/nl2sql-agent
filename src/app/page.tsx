"use client";

import { useEffect, useState } from "react";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
  mapChatMessagesToStoredMessages,
} from "@langchain/core/messages";

import SmartResponseRenderer from "@/components/SmartResponseRenderer";

export default function Home() {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<BaseMessage[]>([
    new SystemMessage(`
      You are an expert SQL assistant. When a user asks a question, generate the appropriate SQL Server (T-SQL) query and use the get_from_db tool to execute it and return the results. Only return the results of the executed query, not just the SQL code.

  - Always use fully qualified table names in the format [database].[schema].[table] (e.g., [master].[dbo].[Customer]).
  - If the user's request is ambiguous, use the most recently mentioned database and table from the conversation context to infer what the user means.
      - Always enclose field names and table names in square brackets ([ ]), even if they contain no special characters.
      - Ensure proper SQL Server (T-SQL) syntax and use best practices for readability.
      - Maintain consistency in capitalization (e.g., SQL keywords in uppercase).
      - Only generate queries that are safe to execute and avoid destructive operations unless explicitly requested.
    `),
  ]);
  const [isLoading, setIsLoading] = useState(false);



  async function sendMessage() {
    setIsLoading(true);
    const messageHistory = [...messages, new HumanMessage(inputMessage)];
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: mapChatMessagesToStoredMessages(messageHistory) }),
      });
      const data = await res.json();
      if (data.result) {
        messageHistory.push(new AIMessage(data.result as string));
      }
    } catch (e) {
      // Optionally handle error
      console.error(e);
    }
    setMessages(messageHistory);
    setInputMessage("");
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white p-2">
        <div className="flex lg:flex-1 items-center justify-center">
          <a href="#" className="m-1.5">
            <span className="sr-only">Natural-Language-to-SQL Agent</span>
            <img
              className="h-8 w-auto"
              src="/openai.svg"
              alt="OpenAI Logo"
            />
          </a>
          <h1 className="text-black font-bold">Natural-Language-to-SQL Agent</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="flex flex-col">
          {messages.length > 0 &&
            messages.map((message, index) => {
              if (message instanceof HumanMessage) {
                return (
                  <div
                    key={message.getType() + index}
                    className="col-start-1 col-end-8 p-3 rounded-lg"
                  >
                    <div className="flex flex-row items-center">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-400 text-white flex-shrink-0 text-sm">
                        Me
                      </div>
                      <div className="relative ml-3 text-sm bg-white text-black py-2 px-4 shadow rounded-xl">
                        <div>{message.content as string}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (message instanceof AIMessage) {
                return (
                  <div
                    key={message.getType() + index}
                    className="col-start-6 col-end-13 p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-start flex-row-reverse">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-400 flex-shrink-0 text-sm">
                        AI
                      </div>
                      <div className="relative mr-3 text-sm bg-white text-black py-2 px-4 shadow rounded-xl min-w-[250px]">
                        <SmartResponseRenderer response={message.content as string} />
                      </div>
                    </div>
                  </div>
                );
              }
            })}
        </div>
      </div>
      <div className="bg-white p-6">
        <div className="flex flex-row items-center h-16 rounded-xl w-full">
          <div className="flex-grow ml-4">
            <div className="relative w-full">
              <input
                type="text"
                disabled={isLoading}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10 text-black"
              />
            </div>
          </div>
          <div className="ml-4">
            <button
              onClick={sendMessage}
              className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-2 flex-shrink-0"
            >
              <span>{isLoading ? "Loading..." : "Send"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}