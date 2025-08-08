require('dotenv').config();
const { AzureChatOpenAI } = require("@langchain/openai");

async function testLLM() {
  const llm = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.OPENAI_API_KEY,
    azureOpenAIApiInstanceName: "manso-mdfm2cer", 
    azureOpenAIApiDeploymentName: process.env.OPENAI_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    temperature: 0,
  });

  try {
    const response = await llm.invoke("Hello, are you working?");
    console.log("Azure OpenAI LLM response:", response);
    return response;
  } catch (error) {
    console.error("Error accessing Azure OpenAI LLM:", error);
    return null;
  }
}

testLLM();