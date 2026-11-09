
/**
 * FlyTripVisa AI Chat
 * Cloudflare Workers AI integration
 */

(() => {
  "use strict";

  const API_URL = "/api/ai-chat";
  const MAX_HISTORY = 30;

  let history = [];
  let sending = false;

  const $ = (id) => document.getElementById(id);

  const overlay = $("chatPopupOverlay");
  const messages = $("chatPopupMessages");
  const input = $("chatPopupInput");
  const sendBtn = $("chatPopupSendBtn");
  const closeBtn = $("closeChatPopupBtn");
  const heroInput = $("aiChatInput");
  const heroBtn = $("aiChatSendBtn");
  const navBtn = $("navAiChatBtn");

  if (!overlay || !messages || !input || !sendBtn) {
    console.error("FlyTripVisa AI: Chat HTML elements not found.");
    return;
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(content, role = "bot") {
    const element = document.createElement("div");

    element.className = `chat-msg ${role}`;
    element.textContent = content;

    messages.appendChild(element);
    scrollToBottom();

    return element;
  }

  function openChatPopup(prefill = "") {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    if (prefill.trim()) {
      input.value = prefill.trim();
    }

    if (typeof window.showBottomTabTemporarily === "function") {
      window.showBottomTabTemporarily();
    }

    setTimeout(() => input.focus(), 150);
  }

  function closeChatPopup() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function setLoading(value) {
    sending = value;
    sendBtn.disabled = value;
    input.disabled = value;

    sendBtn.textContent = value ? "Thinking..." : "Send ✈️";
  }

  async function requestAI(message, context) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        context,
        source: "website"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("Invalid AI response.");
    }

    return data.reply;
  }

  async function retryMessage(message, context, loadingElement) {
    setLoading(true);

    try {
      const reply = await requestAI(message, context);

      loadingElement.textContent = reply;

      history = [
        ...context,
        { role: "user", content: message },
        { role: "assistant", content: reply }
      ].slice(-MAX_HISTORY);

    } catch (error) {
      console.error("FlyTripVisa AI:", error);
      loadingElement.textContent =
        "AI connection failed. Please try again.";

      addRetryButton(loadingElement, message, context);

    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function addRetryButton(element, message, context) {
    const retry = document.createElement("button");

    retry.type = "button";
    retry.textContent = "Retry";
    retry.style.cssText =
      "display:block;margin-top:8px;padding:7px 14px;border:0;border-radius:9px;cursor:pointer;";

    retry.addEventListener("click", () => {
      retry.remove();
      retryMessage(message, context, element);
    });

    element.appendChild(retry);
  }

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || "").trim();

    if (!message || sending) return;

    openChatPopup();

    const context = history.slice(-20);

    addMessage(message, "user");
    input.value = "";

    const loadingElement = addMessage(
      "Thinking... Please wait.",
      "bot"
    );

    setLoading(true);

    try {
      const reply = await requestAI(message, context);

      loadingElement.textContent = reply;

      history = [
        ...context,
        { role: "user", content: message },
        { role: "assistant", content: reply }
      ].slice(-MAX_HISTORY);

    } catch (error) {
      console.error("FlyTripVisa AI:", error);

      loadingElement.textContent =
        "AI connection failed. Please check your internet connection and try again.";

      addRetryButton(loadingElement, message, context);

    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  // Popup send button
  sendBtn.addEventListener("click", () => {
    sendMessage(input.value);
  });

  // Enter to send
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input.value);
    }
  });

  // Hero send button
  heroBtn?.addEventListener("click", () => {
    const message = heroInput.value.trim();

    if (!message) return;

    heroInput.value = "";
    sendMessage(message);
  });

  heroInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      heroBtn?.click();
    }
  });

  // Bottom navigation
  navBtn?.addEventListener("click", () => {
    openChatPopup();
  });

  // Close popup
  closeBtn?.addEventListener("click", closeChatPopup);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeChatPopup();
    }
  });

  // Expose functions for other page scripts
  window.openChatPopup = openChatPopup;
  window.closeChatPopup = closeChatPopup;
  window.sendFlyTripVisaMessage = sendMessage;

})();
