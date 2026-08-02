// PulseChat Widget Script
// Usage: <script src="http://localhost:3000/widget.js" data-bot-id="BOT_ID" async></script>

(function() {
  'use strict';

  // Get bot ID from script tag
  const script = document.currentScript;
  const botId = script?.getAttribute('data-bot-id');

  if (!botId) {
    console.error('PulseChat: No bot ID provided');
    return;
  }

  // Derive the API origin from this script's own URL so it always points at the
  // dashboard that serves widget.js (works on localhost and after deployment).
  const scriptOrigin = script && script.src ? new URL(script.src).origin : window.location.origin;

  // Supabase config
  const SUPABASE_URL = 'https://qpwccmnrmfsqzixqbayf.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_YgeHYvy0DfzDdsxsgG4I1Q_q2a8zZ1L';

  // Create isolated container with Shadow DOM
  const container = document.createElement('div');
  container.id = 'pulsechat-widget';
  container.style.position = 'fixed';
  container.style.zIndex = '999999';
  const shadow = container.attachShadow({ mode: 'open' });
  document.body.appendChild(container);

  // State
  let botConfig = null;
  let isOpen = false;
  let messages = [];
  let visitorSession = 'visitor_' + Math.random().toString(36).substr(2, 9);

  // Fetch bot config
  async function fetchBotConfig() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bots?id=eq.${botId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        botConfig = data[0];
        renderWidget();
      }
    } catch (error) {
      console.error('PulseChat: Failed to load bot config', error);
    }
  }

  // Conversation state
  let currentConversationId = null;
  let isStreaming = false;

  // Send message to chat via AI streaming API
  async function sendMessage(text) {
    if (!text.trim() || !botConfig || isStreaming) return;

    isStreaming = true;

    // Add user message
    messages.push({ role: 'visitor', content: text });
    updateMessages();

    // Add empty bot message for streaming
    messages.push({ role: 'bot', content: '' });
    updateMessages();

    // Stream response from AI API
    try {
      const response = await fetch(scriptOrigin + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          message: text,
          conversation_id: currentConversationId,
          visitor_session: visitorSession
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Capture the conversation id so all messages in this session share one
      // conversation. Header is exposed via Access-Control-Expose-Headers.
      if (!currentConversationId) {
        const convId = response.headers.get('x-conversation-id');
        if (convId) currentConversationId = convId;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessageIndex = messages.length - 1;
      let buffer = '';
      let streamDone = false;

      const processLine = (line) => {
        if (!line.startsWith('data: ')) return;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.token) {
            messages[botMessageIndex].content += data.token;
            updateMessages();
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (line.startsWith('data: ') && line.includes('"done":true')) {
            processLine(line);
            streamDone = true;
            break;
          }
          processLine(line);
        }
      }
    } catch (error) {
      console.error('PulseChat: Streaming error:', error);
      const lastBotIdx = messages.length - 1;
      messages[lastBotIdx].content = 'Sorry, I encountered an error. Please try again.';
      updateMessages();
    }

    isStreaming = false;
    updateMessages();
  }

  // Escape HTML to avoid XSS from model output
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Convert bot Markdown response into safe HTML
  function formatBotMessage(text) {
    if (!text) return '';
    let html = escapeHtml(text);

    // Fenced code blocks (``` ... ```) with monospace styling
    html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
      '<pre style="background:#1f2937;color:#e5e7eb;padding:8px;border-radius:6px;font-size:12px;overflow-x:auto;white-space:pre-wrap;">' + code + '</pre>'
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:1px 4px;border-radius:4px;font-size:12px;">$1</code>');

    // Headings
    html = html.replace(/^### (.*)$/gm, '<div style="font-weight:600;font-size:15px;margin:8px 0 4px;">$1</div>');
    html = html.replace(/^## (.*)$/gm, '<div style="font-weight:600;font-size:16px;margin:10px 0 4px;">$1</div>');
    html = html.replace(/^# (.*)$/gm, '<div style="font-weight:700;font-size:17px;margin:10px 0 4px;">$1</div>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    // Unordered lists
    html = html.replace(/^\s*[-*] (.*)$/gm, '<div style="padding-left:16px;">&bull; $1</div>');
    // Ordered lists
    html = html.replace(/^\s*\d+\. (.*)$/gm, '<div style="padding-left:16px;">1. $1</div>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  // Update messages in UI
  function updateMessages() {
    const messagesContainer = shadow.querySelector('#messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = messages.map(msg => `
      <div style="display: flex; gap: 8px; margin-bottom: 12px; ${msg.role === 'visitor' ? 'justify-content: flex-end;' : ''}">
        ${msg.role === 'bot' ? `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${botConfig.brand_color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 500;
            flex-shrink: 0;
          ">${botConfig.name.charAt(0)}</div>
        ` : ''}
        <div style="
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 12px;
          background-color: ${msg.role === 'bot' ? '#f3f4f6' : botConfig.brand_color};
          color: ${msg.role === 'bot' ? '#1f2937' : 'white'};
          font-size: 14px;
          line-height: 1.4;
        ">${msg.role === 'bot' && msg.content ? formatBotMessage(msg.content) : (msg.content ? escapeHtml(msg.content) : '<div class="typing-indicator"><span></span><span></span><span></span></div>')}</div>
      </div>
    `).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update input state based on streaming
    const input = shadow.querySelector('#messageInput');
    const sendBtn = shadow.querySelector('#sendBtn');
    if (input && sendBtn) {
      input.disabled = isStreaming;
      sendBtn.disabled = isStreaming;
      input.placeholder = isStreaming ? 'AI is typing...' : 'Type a message...';
    }
  }

  // Render the widget
  function renderWidget() {
    const position = botConfig.position === 'bottom-left' ? 'left: 16px;' : 'right: 16px;';
    
    shadow.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .chat-bubble {
          position: fixed;
          bottom: 16px;
          ${position}
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: ${botConfig.brand_color};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .chat-bubble:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        .chat-window {
          position: fixed;
          bottom: 84px;
          ${position}
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-window.open {
          display: flex;
        }
        
        .chat-header {
          background-color: ${botConfig.brand_color};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
        }
        
        .chat-header-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .chat-header-info p {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }
        
        .chat-close {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          font-size: 20px;
          line-height: 1;
        }
        
        #messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .chat-input {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }
        
        .chat-input input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          outline: none;
        }
        
        .chat-input input:focus {
          border-color: ${botConfig.brand_color};
        }
        
        .chat-input button {
          background-color: ${botConfig.brand_color};
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-input button:hover {
          opacity: 0.9;
        }
        
        .chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #9ca3af;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      </style>
      
      <div class="chat-bubble" id="chatBubble">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      
      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <div class="chat-header-avatar">${botConfig.name.charAt(0)}</div>
          <div class="chat-header-info">
            <h3>${botConfig.name}</h3>
            <p>Online</p>
          </div>
          <button class="chat-close" id="chatClose">&times;</button>
        </div>
        <div id="messages"></div>
        <div class="chat-input">
          <input type="text" id="messageInput" placeholder="Type a message..." />
          <button id="sendBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add welcome message
    messages.push({ role: 'bot', content: botConfig.welcome_message });
    updateMessages();

    // Event listeners
    const chatBubble = shadow.querySelector('#chatBubble');
    const chatWindow = shadow.querySelector('#chatWindow');
    const chatClose = shadow.querySelector('#chatClose');
    const messageInput = shadow.querySelector('#messageInput');
    const sendBtn = shadow.querySelector('#sendBtn');

    chatBubble.addEventListener('click', () => {
      isOpen = !isOpen;
      chatWindow.classList.toggle('open', isOpen);
    });

    chatClose.addEventListener('click', () => {
      isOpen = false;
      chatWindow.classList.remove('open');
    });

    const handleSend = () => {
      const text = messageInput.value;
      if (text.trim()) {
        sendMessage(text);
        messageInput.value = '';
      }
    };

    sendBtn.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // Initialize
  fetchBotConfig();
})();
