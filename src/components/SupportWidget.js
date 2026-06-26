"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import styles from "./SupportWidget.module.css";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const quickQuestions = [
    "Is inspection free?",
    "How do I verify my home?",
    "What are the service fees?",
    "How does escrow work?",
  ];

  // Initialize messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("renta_support_chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm Renta AI. How can I help you today?",
          },
        ]);
      }
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm Renta AI. How can I help you today?",
        },
      ]);
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("renta_support_chat", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e, customInput) => {
    if (e) e.preventDefault();
    const messageText = customInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history: messages }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.error ||
              "I'm having trouble connecting right now. Please try again later.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message || "Something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const initial = [
      {
        role: "assistant",
        content: "Hi! I'm Renta AI. How can I help you today?",
      },
    ];
    setMessages(initial);
    localStorage.setItem("renta_support_chat", JSON.stringify(initial));
  };

  return (
    <div className={styles.widgetWrapper}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleBtn} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Support Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && messages.length === 1 && (
          <span className={styles.badge}>1</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`${styles.chatWindow} fade-in`}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.botIcon}>
                <Bot size={20} />
              </div>
              <div>
                <h3>Renta Support</h3>
                <p>AI Assistant • Always Online</p>
              </div>
            </div>
            <div className="flex gap-1">
              {messages.length > 1 && (
                <button
                  onClick={resetChat}
                  className={styles.headerBtn}
                  title="Reset Chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className={styles.messagesContainer} ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${styles.message} ${styles[msg.role]}`}
              >
                <div className={styles.avatar}>
                  {msg.role === "assistant" ? (
                    <Bot size={14} />
                  ) : (
                    <User size={14} />
                  )}
                </div>
                <div className={styles.bubble}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.avatar}>
                  <Bot size={14} />
                </div>
                <div className={`${styles.bubble} ${styles.loading}`}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && !isLoading && (
            <div className={styles.quickActions}>
              {quickQuestions.map((q, idx) => (
                <button key={idx} onClick={() => handleSend(null, q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className={styles.inputArea}>
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
