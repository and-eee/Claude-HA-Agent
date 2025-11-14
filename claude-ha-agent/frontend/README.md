# Claude HA Agent Card

A custom Home Assistant card for the Claude HA Agent add-on.

## Installation

### Via HACS (Recommended)

1. Open Home Assistant
2. Go to Settings → Devices & Services → Custom integrations
3. Click "Create Integration" or use the HACS store
4. Add this repository: `https://github.com/your-org/claude-ha-agent`
5. Install the "Claude HA Agent" card
6. Add the card to your dashboard

### Manual Installation

1. Download `claude-ha-agent-card.js` and `styles.css`
2. Place them in your `www` folder: `config/www/community/claude-ha-agent/`
3. In Home Assistant, add this resource in Settings → Dashboards → Resources:
   - URL: `/local/community/claude-ha-agent/claude-ha-agent-card.js`
   - Type: JavaScript Module
4. Add the card to your dashboard with type `claude-ha-agent-card`

## Usage

### Adding to Dashboard

In edit mode, add a new card and select "Claude HA Agent".

```yaml
type: custom:claude-ha-agent-card
```

### Features

- **Conversation History** - Persisted conversation with full message history
- **Real-time Feedback** - See Claude's thinking and function calls
- **Cost Monitoring** - Track API usage and costs in real-time
- **Status Indicators** - Visual status for HA and Claude API connections
- **Responsive Design** - Works on desktop and mobile
- **Light/Dark Mode** - Automatically adapts to Home Assistant theme

## Configuration

Currently, the card requires no configuration. All settings are managed through the Claude HA Agent add-on.

## Requirements

- Home Assistant 2024.1.0+
- Claude HA Agent add-on installed and running
- Firefox, Chrome, or Safari (ES6+ JavaScript support)

## Troubleshooting

### Card Not Appearing

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors (F12)
4. Verify resource is added in Settings → Dashboards → Resources

### Connection Issues

1. Ensure Claude HA Agent add-on is running (check add-on logs)
2. Check if backend is accessible at `http://localhost:5000/api/status`
3. Verify CORS is properly configured (should be automatic)

### API Errors

1. Check Claude HA Agent add-on configuration
2. Verify Claude API key is set correctly
3. Verify Home Assistant access token is valid

## Development

To modify the card:

1. Edit `claude-ha-agent-card.js` and `styles.css`
2. Reload the card in Home Assistant (reload resources)
3. Use browser DevTools (F12) to debug

## License

MIT
