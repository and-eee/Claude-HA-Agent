# Claude HA Agent - Installation Guide

Due to repository structure requirements, here are the recommended installation methods:

## **Method 1: Direct Add-on Installation (Recommended)**

Instead of adding as a repository, add the add-on directly:

1. **In Home Assistant**, go to: Settings → Add-ons → Add-on Store (bottom right)
2. Click the three-dot menu → **Create add-on**
3. Paste this URL in the prompt:
   ```
   https://github.com/and-eee/Claude-HA-Agent
   ```
4. Select the add-on and install

OR manually create the add-on folder:

1. SSH into Home Assistant or use Terminal & SSH add-on:
   ```bash
   ssh root@homeassistant.local
   ```

2. Navigate to addons directory:
   ```bash
   cd /data/addons
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/and-eee/Claude-HA-Agent.git claude-ha-agent
   cd claude-ha-agent
   ```

4. Copy to correct location:
   ```bash
   # If cloning to /data/addons directly
   cp -r . /data/addons/claude-ha-agent/
   ```

5. Restart add-ons or Home Assistant:
   - Settings → System → Restart

6. The add-on should now appear in: Settings → Add-ons → Installed

---

## **Method 2: Docker Container (For HA Container/Supervised)**

If you're running HA in Docker:

```bash
# Build the image
docker build -t and-eee/claude-ha-agent .

# Run the container
docker run -d \
  --name claude-ha-agent \
  --network host \
  -e CLAUDE_API_KEY="sk-ant-..." \
  -e HA_TOKEN="your-token-here" \
  -e HA_URL="http://homeassistant:8123" \
  -v claude-ha-agent-data:/config/claude_ha_agent \
  and-eee/claude-ha-agent:latest
```

---

## **Method 3: Manual Python Installation (HA Container)**

1. **SSH into your system**:
   ```bash
   ssh root@homeassistant.local
   ```

2. **Clone the repository**:
   ```bash
   cd /config
   git clone https://github.com/and-eee/Claude-HA-Agent.git claude-ha-agent
   cd claude-ha-agent
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create configuration file** (`/config/.env`):
   ```bash
   CLAUDE_API_KEY=sk-ant-...
   HA_TOKEN=your-token-here
   HA_URL=http://localhost:8123
   HA_WEBSOCKET_URL=ws://localhost:8123/api/websocket
   ALERT_THRESHOLD_USD=5.0
   ```

5. **Start the service**:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
   ```

6. Or create a systemd service for auto-start (see Method 2 in main README)

---

## **Troubleshooting**

### **Error: "No such device or address"**

This means HA can't reach GitHub. Solutions:

1. **Check network connectivity**:
   ```bash
   # SSH into HA
   ping github.com
   ```

2. **Try SSH instead of HTTPS**:
   ```bash
   git clone git@github.com:and-eee/Claude-HA-Agent.git
   ```

3. **Generate GitHub Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it `repo` permissions
   - Copy the token
   - Clone with:
     ```bash
     git clone https://YOUR_TOKEN@github.com/and-eee/Claude-HA-Agent.git
     ```

4. **Use HTTPS with credentials**:
   ```bash
   git clone https://and-eee:TOKEN@github.com/and-eee/Claude-HA-Agent.git
   ```

### **Error: "Repository not found"**

Verify the repository is public:
- Go to https://github.com/and-eee/Claude-HA-Agent
- Check if it's showing (public)
- If private, make it public or share the personal access token

### **Port 5000 already in use**

Change the port in the command:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 5001
```

Then update the card to use `http://localhost:5001`

### **Claude API errors**

Verify your Claude API key is valid:
```bash
# SSH into the add-on
docker exec -it addon_claude_ha_agent bash

# Test the API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

---

## **Getting Your Credentials**

### **Claude API Key**
1. Go to https://console.anthropic.com
2. Click "API keys"
3. Create a new key
4. Copy immediately (never shown again)

### **Home Assistant Long-Lived Token**
1. In HA: Settings → Developer Tools
2. Scroll to "Long-Lived Access Tokens"
3. Create Token → Name it "Claude HA Agent"
4. Copy the token

---

## **Verify Installation**

After setup, test the endpoints:

```bash
# Health check
curl http://localhost:5000/health
# Should return: {"status":"ok","startup_complete":true}

# Status check
curl http://localhost:5000/api/status
# Should show ha_connected: true, claude_available: true

# Create test conversation
curl -X POST http://localhost:5000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

---

## **Next Steps**

1. **Add custom card** to your dashboard (see frontend/README.md)
2. **Test basic queries** in the card
3. **Monitor costs** in real-time
4. **Create automations** through conversation

---

**Need help?** Check the main README.md or open an issue on GitHub.
