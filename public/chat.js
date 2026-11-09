
/* FlyTripVisa AI Chat
   Cloudflare Worker API integration
   HTML structure remains unchanged.
*/

(() => {
  "use strict";

  const API_URL = "/api/ai-chat";
  const MAX_HISTORY = 30;

  let chatHistory = [];
  let isSending = false;

  const $ = (id) => document.getElementById(id);

  const elements = {
    popup: $("chatPopupOverlay"),
    messages: $("chatPopupMessages"),
    input: $("chatPopupInput"),
    send: $("chatPopupSendBtn"),
    close: $("closeChatPopupBtn"),
    heroInput: $("aiChatInput"),
    heroSend: $("aiChatSendBtn"),
    navButton: $("navAiChatBtn")
  };

  function addMessage(role, content) {
    if (!elements.messages) return null;

    const message = document.createElement("div");
    message.className =
      role === "user" ? "user-message" : "assistant-message";

    message.textContent = content;
    elements.messages.appendChild(message);

    elements.messages.scrollTop =
      elements.messages.scrollHeight;

    return message;
  }

  function setLoading(loading) {
    isSending = loading;

    if (elements.send) {
      elements.send.disabled = loading;
      elements.send.textContent = loading ? "Thinking..." : "Send";
    }

    if (elements.input) {
      elements.input.disabled = loading;
    }
  }

  function openChat(prefill = "") {
    if (elements.popup) {
      elements.popup.classList.add("active");
      elements.popup.style.display = "flex";
    }

    if (prefill && elements.input) {
      elements.input.value = prefill;
    }

    elements.input?.focus();
  }

  function closeChat() {
    elements.popup?.classList.remove("active");

    if (elements.popup) {
      elements.popup.style.display = "none";
    }
  }

  async function sendMessage(text) {
    const message = String(text || "").trim();

    if (!message || isSending) return;

    openChat();
    addMessage("user", message);

    chatHistory.push({
      role: "user",
      content: message
    });

    chatHistory = chatHistory.slice(-MAX_HISTORY);

    if (elements.input) elements.input.value = "";

    const loadingMessage = addMessage(
      "assistant",
      "Please wait, I'm preparing your answer..."
    );

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          context: chatHistory.slice(0, -1),
          source: "website"
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const reply =
        data.reply ||
        data.response ||
        data.answer ||
        data.message;

      if (!reply || typeof reply !== "string") {
        throw new Error("Invalid AI response format.");
      }

      loadingMessage.textContent = reply;

      chatHistory.push({
        role: "assistant",
        content: reply
      });

      chatHistory = chatHistory.slice(-MAX_HISTORY);

    } catch (error) {
      console.error("FlyTripVisa AI:", error);

      loadingMessage.textContent =
        "Sorry, the AI service is temporarily unavailable. Please try again.";

      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => {
        loadingMessage.remove();

        chatHistory.pop();
        sendMessage(message);
      });

      loadingMessage.appendChild(retry);

      chatHistory.pop();

    } finally {
      setLoading(false);
      elements.messages.scrollTop =
        elements.messages.scrollHeight;
    }
  }

  // Popup send
  elements.send?.addEventListener("click", () => {
    sendMessage(elements.input?.value);
  });

  // Enter to send
  elements.input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(elements.input.value);
    }
  });

  // Hero send
  elements.heroSend?.addEventListener("click", () => {
    const message = elements.heroInput?.value.trim();
    if (!message) return;

    openChat();
    elements.heroInput.value = "";
    sendMessage(message);
  });

  elements.heroInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      elements.heroSend?.click();
    }
  });

  // Bottom AI tab
  elements.navButton?.addEventListener("click", () => {
    openChat();
  });

  // Close popup
  elements.close?.addEventListener("click", closeChat);

  // Public functions if existing HTML needs them
  window.openChatPopup = openChat;
  window.closeChatPopup = closeChat;
  window.sendFlyTripVisaMessage = sendMessage;

})();
