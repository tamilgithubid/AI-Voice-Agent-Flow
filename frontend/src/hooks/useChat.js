import { useState, useCallback, useRef } from 'react';
import { sendMessage, sendMessageStream } from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const streamBuffer = useRef('');

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { id: Date.now(), role, content, timestamp: new Date() }]);
  }, []);

  // Send message without streaming
  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    addMessage('user', text);
    setIsLoading(true);

    try {
      const result = await sendMessage(text, threadId);
      if (result.success) {
        setThreadId(result.data.threadId);
        addMessage('assistant', result.data.response);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      setError(err.message);
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [threadId, isLoading, addMessage]);

  // Send message with SSE streaming
  const sendStreaming = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    addMessage('user', text);
    setIsLoading(true);
    streamBuffer.current = '';

    // Add a placeholder message for streaming
    const placeholderId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);

    try {
      await sendMessageStream(
        text,
        threadId,
        // onToken
        (token) => {
          streamBuffer.current += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId ? { ...msg, content: streamBuffer.current } : msg
            )
          );
        },
        // onDone
        (data) => {
          setThreadId(data.threadId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId ? { ...msg, streaming: false } : msg
            )
          );
          setIsLoading(false);
        },
        // onError
        (errMsg) => {
          setError(errMsg);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId
                ? { ...msg, content: 'Sorry, an error occurred.', streaming: false }
                : msg
            )
          );
          setIsLoading(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [threadId, isLoading, addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
  }, []);

  return { messages, threadId, isLoading, error, send, sendStreaming, clearChat };
}
