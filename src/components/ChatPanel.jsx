import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Send, Sparkles } from "lucide-react";
import { sendMessage, isMockProvider } from "../services/ai";
import { useListings } from "../hooks/useListings";
import styles from "./ChatPanel.module.css";

const SUGGESTIONS = [
  "4 room in Tampines under 600k",
  "Show me 5 room flats in Punggol",
  "Is listing l3 fairly priced?",
];

const GREETING = {
  role: "assistant",
  content:
    "Hi. Tell me what you are looking for — town, flat type and budget — and I will search the listings. I can also check whether an asking price is reasonable against recent transactions.",
  toolCalls: [],
};

function ChatPanel() {
  const { listings } = useListings();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);

  const endRef = useRef(null);

  // Keep the newest message in view as the conversation grows.
  // scrollIntoView is missing in jsdom (and in some older browsers), so guard
  // the method itself rather than only the ref.
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (text) => {
    const question = text.trim();
    if (!question || thinking) return;

    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);
    setError(null);

    try {
      // The assistant only ever sees the listings we hand it here.
      const reply = await sendMessage(nextMessages, { listings });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply.content,
          toolCalls: reply.toolCalls ?? [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.messages}>
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {thinking && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.typing} aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {error && (
          <div className="status-message error" role="alert">
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {messages.length === 1 && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.suggestion}
              onClick={() => ask(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.composer}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about listings or prices…"
          aria-label="Message the assistant"
          disabled={thinking}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={thinking || !input.trim()}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>

      {isMockProvider && (
        <p className={styles.providerNote}>
          <Sparkles size={12} aria-hidden="true" />
          Running the offline assistant. Listing and price data are real; the
          wording is scripted. Set VITE_AI_PROVIDER=openai to use a live model.
        </p>
      )}
    </div>
  );
}

/** One bubble, plus quick links to any listings the tools returned. */
function Message({ message }) {
  const isUser = message.role === "user";

  // Pull listing ids out of whatever the tools actually returned, so the links
  // can never point at a listing that does not exist.
  const linkedListings = (message.toolCalls ?? []).flatMap(
    (call) => call.result?.listings ?? [],
  );

  return (
    <div
      className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}
    >
      <div className={styles.bubble}>{renderText(message.content)}</div>

      {linkedListings.length > 0 && (
        <div className={styles.links}>
          {linkedListings.map((l) => (
            <Link
              key={l.id}
              to={`/app/listings/${l.id}`}
              className={styles.link}
            >
              View {l.id}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal formatting: **bold** and line breaks. Deliberately not a full
 * markdown parser — rendering untrusted model output as HTML is how you get an
 * XSS bug, so we build React elements from plain text instead.
 */
function renderText(text) {
  return String(text ?? "")
    .split("\n")
    .map((line, i) => (
      <span key={i} className={styles.line}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            part
          ),
        )}
      </span>
    ));
}

export default ChatPanel;
