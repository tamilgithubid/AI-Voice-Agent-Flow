const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');
const { aiResponseTime, toolCallsTotal } = require('../utils/metrics');
const { getMemory, appendMessage } = require('./redis');
const tools = require('./tools');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const SYSTEM_PROMPT = `You are an intelligent AI assistant specialized in resume management and career coaching. You help users with their resumes by providing analysis, suggestions, and improvements.

You have access to the following tools. When you need to use a tool, respond with EXACTLY this JSON format and nothing else:
{"tool_call": {"name": "tool_name", "args": {"param": "value"}}}

Available tools:
1. get_resume - Retrieve a user's resume. Args: {"userId": "string"}
2. analyze_resume - Analyze a resume. Args: {"resumeData": {object}, "focusAreas": ["string"]}
3. improve_resume - Suggest improvements. Args: {"resumeData": {object}, "section": "string", "targetRole": "string"}
4. save_resume - Save resume data. Args: {"userId": "string", "resumeData": {object}}

When NOT calling a tool, respond naturally with helpful text.
Be professional, specific, and provide actionable feedback.
Structure responses with markdown when helpful.
If you need the user's resume first, call get_resume with their userId.`;

// Execute a tool call
async function executeTool(toolName, args) {
  const timer = aiResponseTime.startTimer();
  try {
    const handler = tools[toolName];
    if (!handler) throw new Error(`Unknown tool: ${toolName}`);
    const result = await handler(args);
    toolCallsTotal.inc({ tool_name: toolName, status: 'success' });
    return result;
  } catch (err) {
    toolCallsTotal.inc({ tool_name: toolName, status: 'error' });
    logger.error(`Tool execution failed: ${toolName}`, err);
    return { error: err.message };
  } finally {
    timer();
  }
}

// Try to parse a tool call from model response
function parseToolCall(text) {
  try {
    // Look for JSON with tool_call in the response
    const match = text.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.tool_call && parsed.tool_call.name) {
        return parsed.tool_call;
      }
    }
  } catch {
    // Not a tool call
  }
  return null;
}

// Build chat history for Gemini format
function buildHistory(memory) {
  return memory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// Main agent processing — agentic loop
async function processMessage({ message, userId, threadId }) {
  const timer = aiResponseTime.startTimer();

  try {
    const memory = await getMemory(threadId);
    await appendMessage(threadId, 'user', message);

    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });

    const history = buildHistory(memory);
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: config.gemini.maxTokens,
        temperature: config.gemini.temperature,
      },
    });

    let loopCount = 0;
    const MAX_LOOPS = 5;
    let currentMessage = message;

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      logger.info(`Agent loop iteration ${loopCount} for thread ${threadId}`);

      const result = await chat.sendMessage(currentMessage);
      const responseText = result.response.text();

      // Check if the model wants to call a tool
      const toolCall = parseToolCall(responseText);

      if (toolCall) {
        logger.info(`Executing tool: ${toolCall.name}`, { args: toolCall.args, threadId });

        // Inject userId if needed
        if (!toolCall.args.userId && ['get_resume', 'save_resume'].includes(toolCall.name)) {
          toolCall.args.userId = userId;
        }

        const toolResult = await executeTool(toolCall.name, toolCall.args);

        // Send tool result back to the model
        currentMessage = `Tool "${toolCall.name}" returned:\n${JSON.stringify(toolResult, null, 2)}\n\nPlease provide a helpful response to the user based on this data.`;
        continue;
      }

      // No tool call — final response
      await appendMessage(threadId, 'assistant', responseText);
      timer();
      return {
        response: responseText,
        threadId,
        usage: { model: config.gemini.model },
        loopCount,
      };
    }

    const fallback = 'I apologize, but I encountered an issue processing your request. Please try again.';
    await appendMessage(threadId, 'assistant', fallback);
    timer();
    return { response: fallback, threadId, loopCount };
  } catch (err) {
    timer();
    logger.error('Agent processing error:', err);
    throw err;
  }
}

// Streaming variant
async function processMessageStream({ message, userId, threadId, onToken, onDone }) {
  try {
    const memory = await getMemory(threadId);
    await appendMessage(threadId, 'user', message);

    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });
    const history = buildHistory(memory);

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: config.gemini.maxTokens,
        temperature: config.gemini.temperature,
      },
    });

    let loopCount = 0;
    const MAX_LOOPS = 5;
    let currentMessage = message;

    while (loopCount < MAX_LOOPS) {
      loopCount++;

      // First check if tool call is needed (non-streaming)
      const checkResult = await chat.sendMessage(currentMessage);
      const checkText = checkResult.response.text();
      const toolCall = parseToolCall(checkText);

      if (toolCall) {
        logger.info(`Stream: Executing tool: ${toolCall.name}`, { threadId });

        if (!toolCall.args.userId && ['get_resume', 'save_resume'].includes(toolCall.name)) {
          toolCall.args.userId = userId;
        }

        const toolResult = await executeTool(toolCall.name, toolCall.args);
        currentMessage = `Tool "${toolCall.name}" returned:\n${JSON.stringify(toolResult, null, 2)}\n\nPlease provide a helpful response to the user based on this data.`;
        continue;
      }

      // No tool call — stream the response
      // Since we already got the response, stream it token by token
      const fullResponse = checkText;
      const words = fullResponse.split(' ');

      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? '' : ' ') + words[i];
        onToken(token);
        // Small delay to simulate streaming effect
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      await appendMessage(threadId, 'assistant', fullResponse);
      onDone({ response: fullResponse, threadId, loopCount });
      return;
    }

    const fallback = 'I apologize, but I encountered an issue processing your request.';
    onToken(fallback);
    onDone({ response: fallback, threadId, loopCount });
  } catch (err) {
    logger.error('Stream processing error:', err);
    throw err;
  }
}

module.exports = { processMessage, processMessageStream };
