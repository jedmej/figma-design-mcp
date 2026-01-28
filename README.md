# Figma Design MCP Server

Create Figma designs using Claude Code! This MCP server lets you describe designs in natural language and have Claude create them directly in Figma.

## Architecture

```
Claude Code → MCP Server → WebSocket → Figma Plugin → Figma Canvas
```

## Quick Start

### 1. Install Dependencies

```bash
# Install MCP server dependencies
cd mcp-server
npm install

# Install Figma plugin dependencies
cd ../figma-plugin
npm install
```

### 2. Build the Figma Plugin

```bash
cd figma-plugin
npm run build
```

### 3. Load the Plugin in Figma

1. Open **Figma Desktop App** (required for localhost connections)
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `manifest.json` file from `figma-plugin/` folder
4. The plugin "Claude Design Bridge" will appear in your plugins menu

### 4. Configure Claude Code

Add this to your Claude Code MCP settings (`~/.claude/claude_code_config.json`):

```json
{
  "mcpServers": {
    "figma-design": {
      "command": "node",
      "args": ["/Users/jed/Documents/figma-design-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

Or for development with auto-reload:

```json
{
  "mcpServers": {
    "figma-design": {
      "command": "npx",
      "args": ["tsx", "/Users/jed/Documents/figma-design-mcp/mcp-server/src/index.ts"]
    }
  }
}
```

### 5. Start Creating!

1. **Build the MCP server**: `cd mcp-server && npm run build`
2. **Open Figma** and create/open a file
3. **Run the plugin**: Plugins → Development → Claude Design Bridge
4. **Click "Connect"** in the plugin UI
5. **Restart Claude Code** (or reload MCP servers)
6. **Start designing!** Ask Claude to create frames, text, shapes, etc.

## Available Tools

| Tool | Description |
|------|-------------|
| `create_frame` | Create a new frame with position, size, and background color |
| `create_text` | Add text with font, size, and color options |
| `create_rectangle` | Create rectangles with optional corner radius |
| `create_ellipse` | Create circles and ellipses |
| `set_auto_layout` | Enable auto-layout on frames for automatic spacing |
| `create_component` | Create reusable components |
| `create_instance` | Instantiate existing components |
| `list_nodes` | List all elements on the page |
| `delete_node` | Delete elements by ID |
| `move_node` | Reposition elements |
| `resize_node` | Change element dimensions |
| `set_fill_color` | Change fill colors |
| `add_stroke` | Add borders/strokes to elements |
| `get_selection` | Get currently selected elements |
| `set_selection` | Select specific elements |
| `zoom_to_fit` | Zoom viewport to show elements |

## Example Prompts

Try asking Claude:

- "Create a mobile app frame with a header, hero section, and navigation bar"
- "Make a button component with rounded corners and a blue background"
- "Create a card layout with an image placeholder, title, and description"
- "Design a simple login form with email and password fields"
- "Make a grid of 3 colored squares"

## Color Format

Colors are specified in RGB with values from 0 to 1:

```
{ r: 1, g: 0, b: 0 }      // Red
{ r: 0, g: 0.5, b: 1 }    // Light blue
{ r: 0.2, g: 0.2, b: 0.2 } // Dark gray
```

## Development

### MCP Server

```bash
cd mcp-server
npm run dev  # Run with tsx (auto-compiles TypeScript)
```

### Figma Plugin

```bash
cd figma-plugin
npm run watch  # Rebuild on changes
```

## Troubleshooting

### "Figma plugin not connected"

- Make sure you're using Figma Desktop (not browser)
- Run the plugin from Plugins → Development → Claude Design Bridge
- Click "Connect" in the plugin UI
- Check that no firewall is blocking localhost:9001

### Plugin doesn't appear

- Make sure you imported the manifest from the correct folder
- Check Plugins → Development menu

### Commands timeout

- The Figma plugin UI must be open
- Check the activity log in the plugin for errors

## License

MIT - Use freely for personal or commercial projects.
