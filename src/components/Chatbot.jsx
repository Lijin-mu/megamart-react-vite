import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickQuestions = ['Track my order', 'Delivery information', 'Help me find a product'];

function getReply(question, products, signedIn) {
  const normalized = question.toLowerCase();
  const product = products.find((item) => normalized.includes(item.name.toLowerCase()));

  if (/\b(hi|hello|hey)\b/.test(normalized)) {
    return { text: 'Hi there! How can I help with your MegaMart shopping today?' };
  }

  if (/\b(track|tracking|order|orders|shipped|delivery status)\b/.test(normalized)) {
    return {
      text: signedIn
        ? 'You can see your order history and tracking updates in your account.'
        : 'Sign in to view your order history and tracking updates.',
      action: { label: 'View my orders', to: '/account/orders' },
    };
  }

  if (/\b(deliver|delivery|shipping|ship|cod|cash on delivery|payment|pay)\b/.test(normalized)) {
    return {
      text: 'Delivery is free, and you can pay by cash when your order arrives. Check delivery availability for your address during checkout.',
      action: { label: 'Go to checkout', to: '/checkout' },
    };
  }

  if (/\b(return|refund|cancel|exchange)\b/.test(normalized)) {
    return {
      text: 'For help with a return or cancellation, open your order details or contact our support team at +1 202-918-2132.',
      action: { label: 'View my orders', to: '/account/orders' },
    };
  }

  if (/\b(contact|human|agent|support)\b/.test(normalized)) {
    return {
      text: 'Our customer support team can help at +1 202-918-2132. You can also browse your orders or ask me a shopping question.',
      action: { label: 'View my orders', to: '/account/orders' },
    };
  }

  if (product) {
    return {
      text: `${product.name} is listed at ₹${product.price.toLocaleString('en-IN')}. You can see its details and add it to your cart on the product page.`,
      action: { label: 'View product', to: `/products/${product.id}` },
    };
  }

  if (/\b(product|price|cost|available|availability|stock|find|recommend)\b/.test(normalized)) {
    return {
      text: 'I can help find something in the catalog. Browse all products or tell me the product name you are looking for.',
      action: { label: 'Browse products', to: '/products' },
    };
  }

  return {
    text: 'I can help with product questions, order tracking, delivery, returns, or getting in touch with support. What would you like to know?',
  };
}

export default function Chatbot({ products, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: 'Hi! Welcome to MegaMart. I can help you find products, check order information, or answer questions.',
      role: 'assistant',
    },
  ]);
  const nextMessageId = useRef(1);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
    }
  }, [isOpen, messages]);

  function sendMessage(text = question) {
    const trimmedQuestion = text.trim();
    if (!trimmedQuestion) return;

    const reply = getReply(trimmedQuestion, products, Boolean(currentUser));
    setMessages((current) => [
      ...current,
      { id: nextMessageId.current++, text: trimmedQuestion, role: 'user' },
      { id: nextMessageId.current++, ...reply, role: 'assistant' },
    ]);
    setQuestion('');
  }

  return (
    <aside className="chatbot" aria-label="MegaMart customer support chat">
      {isOpen && (
        <section className="chat-panel" aria-label="Chat with MegaMart support">
          <header className="chat-header">
            <span className="chat-avatar"><Bot size={20} /></span>
            <div>
              <strong>MegaMart Support</strong>
              <span><i /> Here to help</span>
            </div>
            <button
              className="chat-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </header>
          <div className="chat-messages" ref={messageListRef} aria-live="polite">
            {messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.action && (
                  <Link
                    className="chat-action"
                    to={message.action.to}
                    onClick={() => setIsOpen(false)}
                  >
                    {message.action.label}
                  </Link>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="chat-quick-questions">
                {quickQuestions.map((prompt) => (
                  <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form
            className="chat-compose"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              aria-label="Type your message"
              placeholder="Ask us anything..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button type="submit" aria-label="Send message" disabled={!question.trim()}>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
      <button
        className={`chat-toggle${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Close customer support chat' : 'Open customer support chat'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && <span>Chat with us</span>}
      </button>
    </aside>
  );
}
