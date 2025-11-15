// Claude HA Agent - Home Assistant Custom Card
class ClaudeHAAgentCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this.hass = hass;

    if (!this.contentElement) {
      this.contentElement = document.createElement("div");
      this.contentElement.id = "card-content";
      this.appendChild(this.contentElement);
      this.initialize();
    }
  }

  async initialize() {
    // Initialize card
    this.contentElement.innerHTML = `
      <div class="claude-card">
        <div class="card-header">
          <h2>Claude HA Agent</h2>
          <div class="status-indicators">
            <span class="status-badge ha-status" id="ha-status" title="HA Connection">●</span>
            <span class="status-badge claude-status" id="claude-status" title="Claude API">●</span>
            <span class="cost-indicator" id="cost-indicator">$0.00</span>
          </div>
        </div>
        <div class="card-body">
          <div id="messages-container" class="messages-container"></div>
          <div class="input-area">
            <input type="text" id="message-input" placeholder="Ask Claude about your Home Assistant..." />
            <button id="send-button">Send</button>
          </div>
        </div>
        <div class="card-footer">
          <span id="status-text">Initializing...</span>
        </div>
      </div>
    `;

    // Add event listeners
    document.getElementById("send-button").addEventListener("click", () => this.sendMessage());
    document
      .getElementById("message-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });

    // Check backend status
    await this.checkBackendStatus();
  }

  async checkBackendStatus() {
    try {
      const response = await fetch("http://localhost:5000/api/status");
      const status = await response.json();

      document.getElementById("ha-status").style.color = status.ha_connected ? "#4CAF50" : "#f44336";
      document.getElementById("claude-status").style.color = status.claude_available ? "#4CAF50" : "#f44336";
      document.getElementById("status-text").textContent =
        status.status === "operational" ? "Ready" : "Degraded";

      // Load conversations
      await this.loadConversations();
    } catch (error) {
      document.getElementById("status-text").textContent = "Backend not available";
      console.error("Backend connection error:", error);
    }
  }

  async loadConversations() {
    try {
      const response = await fetch("http://localhost:5000/api/conversations");
      const conversations = await response.json();

      if (conversations.length === 0) {
        // Create first conversation
        const createResponse = await fetch("http://localhost:5000/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Chat" }),
        });
        const conversation = await createResponse.json();
        this.currentConversationId = conversation.id;
      } else {
        // Load last conversation
        this.currentConversationId = conversations[0].id;
        await this.loadConversationHistory();
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }

  async loadConversationHistory() {
    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${this.currentConversationId}`);
      const conversation = await response.json();

      const messagesContainer = document.getElementById("messages-container");
      messagesContainer.innerHTML = "";

      for (const message of conversation.messages) {
        this.displayMessage(message.role, message.content);
      }

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }

  async sendMessage() {
    const input = document.getElementById("message-input");
    const message = input.value.trim();

    if (!message || !this.currentConversationId) return;

    // Display user message
    this.displayMessage("user", message);
    input.value = "";

    // Show loading state
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "message assistant loading";
    loadingMsg.textContent = "Claude is thinking...";
    document.getElementById("messages-container").appendChild(loadingMsg);

    try {
      // Send to backend
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: this.currentConversationId,
          message: message,
          include_tools: true,
        }),
      });

      const result = await response.json();

      // Remove loading message
      loadingMsg.remove();

      // Display Claude response
      this.displayMessage("assistant", result.content);

      // Update cost indicator
      if (result.cost) {
        const costElem = document.getElementById("cost-indicator");
        costElem.textContent = `$${result.cost.toFixed(4)}`;
      }

      // Handle tool calls display
      if (result.tool_calls && result.tool_calls.length > 0) {
        this.displayToolCalls(result.tool_calls);
      }
    } catch (error) {
      loadingMsg.remove();
      this.displayMessage("assistant", `Error: ${error.message}`);
    }

    // Scroll to bottom
    document.getElementById("messages-container").scrollTop = document.getElementById(
      "messages-container"
    ).scrollHeight;
  }

  displayMessage(role, content) {
    const messagesContainer = document.getElementById("messages-container");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    // Simple markdown to HTML conversion
    let html = content
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

    contentDiv.innerHTML = html;
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
  }

  displayToolCalls(toolCalls) {
    const messagesContainer = document.getElementById("messages-container");
    const toolDiv = document.createElement("div");
    toolDiv.className = "tool-calls";

    const title = document.createElement("strong");
    title.textContent = "Function Calls:";
    toolDiv.appendChild(title);

    const list = document.createElement("ul");
    for (const call of toolCalls) {
      const li = document.createElement("li");
      li.textContent = `${call.name}(${JSON.stringify(call.input)})`;
      list.appendChild(li);
    }

    toolDiv.appendChild(list);
    messagesContainer.appendChild(toolDiv);
  }

  getCardSize() {
    return 1;
  }

  static getConfigElement() {
    return document.createElement("claude-ha-agent-card-editor");
  }

  static getStubConfig() {
    return {};
  }
}

// Register the card
customElements.define("claude-ha-agent-card", ClaudeHAAgentCard);

// Editor element (stub)
class ClaudeHAAgentCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = config;
  }

  get schema() {
    return [];
  }
}

customElements.define("claude-ha-agent-card-editor", ClaudeHAAgentCardEditor);

// Register card in Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "claude-ha-agent-card",
  name: "Claude HA Agent",
  description: "AI-powered conversational Home Assistant management",
});
