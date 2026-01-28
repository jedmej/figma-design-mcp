import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer, WebSocket } from "ws";
// WebSocket server for Figma plugin communication
const WS_PORT = 9001;
const REQUEST_TIMEOUT = 10000; // 10 seconds (reduced from 30s)
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
let figmaSocket = null;
let heartbeatInterval = null;
let pendingRequests = new Map();
// Start WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });
wss.on("connection", (ws) => {
    console.error("[MCP] Figma plugin connected");
    figmaSocket = ws;
    // Start heartbeat to detect stale connections
    heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, HEARTBEAT_INTERVAL);
    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data.toString());
            const pending = pendingRequests.get(message.id);
            if (pending) {
                if (message.error) {
                    pending.reject(new Error(message.error));
                }
                else {
                    pending.resolve(message.result);
                }
                pendingRequests.delete(message.id);
            }
        }
        catch (e) {
            console.error("[MCP] Failed to parse message:", e);
        }
    });
    ws.on("pong", () => {
        // Connection is alive
    });
    ws.on("close", () => {
        console.error("[MCP] Figma plugin disconnected");
        figmaSocket = null;
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    });
});
console.error(`[MCP] WebSocket server listening on ws://localhost:${WS_PORT}`);
// Send command to Figma and wait for response
async function sendToFigma(command, params) {
    if (!figmaSocket || figmaSocket.readyState !== WebSocket.OPEN) {
        throw new Error("Figma plugin not connected. Please open Figma and run the plugin.");
    }
    const id = Math.random().toString(36).substring(7);
    const message = JSON.stringify({ id, command, params });
    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        figmaSocket.send(message);
        // Timeout after 10 seconds (reduced from 30s)
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error("Request timed out"));
            }
        }, REQUEST_TIMEOUT);
    });
}
// MCP Server setup
const server = new Server({ name: "figma-design-server", version: "2.0.0" }, { capabilities: { tools: {} } });
// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // ============================================
            // BATCH OPERATIONS - Execute multiple commands in one call
            // ============================================
            {
                name: "batch",
                description: "Execute multiple Figma commands in a single operation for better performance. Use $ref:id.field to reference results from earlier commands in the batch.",
                inputSchema: {
                    type: "object",
                    properties: {
                        commands: {
                            type: "array",
                            description: "Array of commands to execute sequentially",
                            items: {
                                type: "object",
                                properties: {
                                    command: {
                                        type: "string",
                                        description: "Command name (e.g., 'create_frame', 'create_text')",
                                    },
                                    params: {
                                        type: "object",
                                        description: "Parameters for the command",
                                    },
                                    id: {
                                        type: "string",
                                        description: "Optional ID to reference this result in subsequent commands using $ref:id.field",
                                    },
                                },
                                required: ["command", "params"],
                            },
                        },
                    },
                    required: ["commands"],
                },
            },
            // ============================================
            // TEMPLATE TOOLS - High-level UI components
            // ============================================
            {
                name: "create_button",
                description: "Create a complete, styled button with text, auto-layout, and proper styling in a single call",
                inputSchema: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description: "Button label text",
                        },
                        x: {
                            type: "number",
                            description: "X position (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position (default: 0)",
                        },
                        variant: {
                            type: "string",
                            enum: ["primary", "secondary", "outline", "ghost"],
                            description: "Button style variant (default: primary)",
                        },
                        size: {
                            type: "string",
                            enum: ["sm", "md", "lg"],
                            description: "Button size (default: md)",
                        },
                        fillColor: {
                            type: "object",
                            description: "Override fill color (RGB 0-1)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        textColor: {
                            type: "object",
                            description: "Override text color (RGB 0-1)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        cornerRadius: {
                            type: "number",
                            description: "Corner radius (default: 8)",
                        },
                        parentId: {
                            type: "string",
                            description: "Parent frame ID",
                        },
                    },
                    required: ["text"],
                },
            },
            {
                name: "create_card",
                description: "Create a card component with optional header, body, and footer sections in a single call",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Card name",
                        },
                        x: {
                            type: "number",
                            description: "X position",
                        },
                        y: {
                            type: "number",
                            description: "Y position",
                        },
                        width: {
                            type: "number",
                            description: "Card width (default: 320)",
                        },
                        header: {
                            type: "object",
                            description: "Header section",
                            properties: {
                                title: { type: "string" },
                                subtitle: { type: "string" },
                            },
                        },
                        body: {
                            type: "object",
                            description: "Body section",
                            properties: {
                                text: { type: "string" },
                                imagePlaceholder: { type: "boolean" },
                            },
                        },
                        footer: {
                            type: "object",
                            description: "Footer section with action buttons",
                            properties: {
                                primaryAction: { type: "string" },
                                secondaryAction: { type: "string" },
                            },
                        },
                        fillColor: {
                            type: "object",
                            description: "Background color (RGB 0-1)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        cornerRadius: {
                            type: "number",
                            description: "Corner radius (default: 12)",
                        },
                        shadow: {
                            type: "boolean",
                            description: "Add drop shadow (default: true)",
                        },
                        parentId: {
                            type: "string",
                            description: "Parent frame ID",
                        },
                    },
                    required: ["name"],
                },
            },
            {
                name: "create_input",
                description: "Create a styled text input field with label and placeholder in a single call",
                inputSchema: {
                    type: "object",
                    properties: {
                        label: {
                            type: "string",
                            description: "Input label text",
                        },
                        placeholder: {
                            type: "string",
                            description: "Placeholder text",
                        },
                        x: {
                            type: "number",
                            description: "X position",
                        },
                        y: {
                            type: "number",
                            description: "Y position",
                        },
                        width: {
                            type: "number",
                            description: "Input width (default: 280)",
                        },
                        type: {
                            type: "string",
                            enum: ["text", "email", "password", "search"],
                            description: "Visual input type hint",
                        },
                        required: {
                            type: "boolean",
                            description: "Show required indicator (*)",
                        },
                        parentId: {
                            type: "string",
                            description: "Parent frame ID",
                        },
                    },
                    required: ["placeholder"],
                },
            },
            // ============================================
            // CREATION TOOLS
            // ============================================
            {
                name: "create_frame",
                description: "Create a new frame on the Figma canvas. Frames are containers for other elements.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the frame",
                        },
                        x: {
                            type: "number",
                            description: "X position on canvas (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position on canvas (default: 0)",
                        },
                        width: {
                            type: "number",
                            description: "Width of the frame (default: 400)",
                        },
                        height: {
                            type: "number",
                            description: "Height of the frame (default: 300)",
                        },
                        fillColor: {
                            type: "object",
                            description: "Background color as RGB (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        parentId: {
                            type: "string",
                            description: "ID of parent frame",
                        },
                    },
                    required: ["name"],
                },
            },
            {
                name: "create_text",
                description: "Create a text element in Figma",
                inputSchema: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description: "The text content",
                        },
                        x: {
                            type: "number",
                            description: "X position (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position (default: 0)",
                        },
                        fontSize: {
                            type: "number",
                            description: "Font size in pixels (default: 16)",
                        },
                        fontWeight: {
                            type: "string",
                            enum: ["Regular", "Medium", "Semi Bold", "Bold"],
                            description: "Font weight (default: Regular)",
                        },
                        fillColor: {
                            type: "object",
                            description: "Text color as RGB (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        parentId: {
                            type: "string",
                            description: "ID of parent frame to add text to",
                        },
                    },
                    required: ["text"],
                },
            },
            {
                name: "create_rectangle",
                description: "Create a rectangle shape in Figma",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the rectangle",
                        },
                        x: {
                            type: "number",
                            description: "X position (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position (default: 0)",
                        },
                        width: {
                            type: "number",
                            description: "Width (default: 100)",
                        },
                        height: {
                            type: "number",
                            description: "Height (default: 100)",
                        },
                        cornerRadius: {
                            type: "number",
                            description: "Corner radius for rounded rectangles (default: 0)",
                        },
                        fillColor: {
                            type: "object",
                            description: "Fill color as RGB (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        parentId: {
                            type: "string",
                            description: "ID of parent frame to add rectangle to",
                        },
                    },
                },
            },
            {
                name: "create_ellipse",
                description: "Create an ellipse/circle shape in Figma",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the ellipse",
                        },
                        x: {
                            type: "number",
                            description: "X position (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position (default: 0)",
                        },
                        width: {
                            type: "number",
                            description: "Width/diameter (default: 100)",
                        },
                        height: {
                            type: "number",
                            description: "Height (default: same as width for circle)",
                        },
                        fillColor: {
                            type: "object",
                            description: "Fill color as RGB (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                        },
                        parentId: {
                            type: "string",
                            description: "ID of parent frame to add ellipse to",
                        },
                    },
                },
            },
            // ============================================
            // LAYOUT TOOLS
            // ============================================
            {
                name: "set_auto_layout",
                description: "Enable auto-layout on a frame for automatic spacing and alignment",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the frame to apply auto-layout to",
                        },
                        direction: {
                            type: "string",
                            enum: ["HORIZONTAL", "VERTICAL"],
                            description: "Layout direction (default: VERTICAL)",
                        },
                        spacing: {
                            type: "number",
                            description: "Spacing between items in pixels (default: 10)",
                        },
                        padding: {
                            type: "number",
                            description: "Padding around the content in pixels (default: 20)",
                        },
                        alignment: {
                            type: "string",
                            enum: ["MIN", "CENTER", "MAX"],
                            description: "Primary axis alignment (MIN=start, CENTER=center, MAX=end)",
                        },
                        counterAlignment: {
                            type: "string",
                            enum: ["MIN", "CENTER", "MAX"],
                            description: "Counter axis alignment",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            {
                name: "set_sizing_mode",
                description: "Set how a node sizes itself in auto-layout (fill container or hug contents)",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        horizontal: {
                            type: "string",
                            enum: ["FIXED", "FILL", "HUG"],
                            description: "Horizontal sizing: FIXED (explicit size), FILL (expand to fill), HUG (shrink to fit content)",
                        },
                        vertical: {
                            type: "string",
                            enum: ["FIXED", "FILL", "HUG"],
                            description: "Vertical sizing: FIXED, FILL, or HUG",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            {
                name: "set_constraints",
                description: "Set responsive constraints for how a node behaves when parent is resized",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        horizontal: {
                            type: "string",
                            enum: ["MIN", "CENTER", "MAX", "STRETCH", "SCALE"],
                            description: "Horizontal constraint: MIN (left), CENTER, MAX (right), STRETCH (left+right), SCALE",
                        },
                        vertical: {
                            type: "string",
                            enum: ["MIN", "CENTER", "MAX", "STRETCH", "SCALE"],
                            description: "Vertical constraint: MIN (top), CENTER, MAX (bottom), STRETCH (top+bottom), SCALE",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            // ============================================
            // COMPONENT TOOLS
            // ============================================
            {
                name: "create_component",
                description: "Convert a frame into a reusable component or create a new component",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the component",
                        },
                        fromNodeId: {
                            type: "string",
                            description: "ID of existing frame to convert to component (optional)",
                        },
                        width: {
                            type: "number",
                            description: "Width if creating new (default: 200)",
                        },
                        height: {
                            type: "number",
                            description: "Height if creating new (default: 100)",
                        },
                    },
                    required: ["name"],
                },
            },
            {
                name: "combine_as_variants",
                description: "Combine multiple components into a single component set with variants",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of component IDs to combine as variants",
                        },
                        name: {
                            type: "string",
                            description: "Name for the component set",
                        },
                    },
                    required: ["componentIds"],
                },
            },
            {
                name: "create_variants",
                description: "Create a component set with properly named variants from a base node. This is the PREFERRED way to create variants - it handles Property=Value naming automatically to avoid conflicts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        baseNodeId: {
                            type: "string",
                            description: "ID of the base node (frame, button, etc.) to create variants from",
                        },
                        propertyName: {
                            type: "string",
                            description: "Name of the variant property (e.g., 'State', 'Size', 'Theme')",
                        },
                        variants: {
                            type: "array",
                            description: "Array of variant definitions with names and optional style overrides",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Variant name (e.g., 'Default', 'Hover', 'Pressed')",
                                    },
                                    fillColor: {
                                        type: "object",
                                        description: "Override fill color (RGB 0-1)",
                                        properties: {
                                            r: { type: "number" },
                                            g: { type: "number" },
                                            b: { type: "number" },
                                        },
                                    },
                                    textColor: {
                                        type: "object",
                                        description: "Override text color for all text in the node (RGB 0-1)",
                                        properties: {
                                            r: { type: "number" },
                                            g: { type: "number" },
                                            b: { type: "number" },
                                        },
                                    },
                                    opacity: {
                                        type: "number",
                                        description: "Override opacity (0-1)",
                                    },
                                    strokeColor: {
                                        type: "object",
                                        description: "Override stroke color (RGB 0-1)",
                                        properties: {
                                            r: { type: "number" },
                                            g: { type: "number" },
                                            b: { type: "number" },
                                        },
                                    },
                                    strokeWeight: {
                                        type: "number",
                                        description: "Override stroke weight",
                                    },
                                },
                                required: ["name"],
                            },
                        },
                        componentSetName: {
                            type: "string",
                            description: "Name for the component set (default: 'Component')",
                        },
                    },
                    required: ["baseNodeId", "propertyName", "variants"],
                },
            },
            {
                name: "add_component_property",
                description: "Add a property to a component (text, boolean, instance swap, or variant)",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentId: {
                            type: "string",
                            description: "ID of the component or component set",
                        },
                        propertyName: {
                            type: "string",
                            description: "Name for the property (e.g., 'Label', 'Show Icon')",
                        },
                        propertyType: {
                            type: "string",
                            enum: ["TEXT", "BOOLEAN", "INSTANCE_SWAP", "VARIANT"],
                            description: "Type of property",
                        },
                        defaultValue: {
                            description: "Default value (string for TEXT/VARIANT, boolean for BOOLEAN)",
                        },
                        variantOptions: {
                            type: "array",
                            items: { type: "string" },
                            description: "Options for VARIANT type properties",
                        },
                    },
                    required: ["componentId", "propertyName", "propertyType", "defaultValue"],
                },
            },
            {
                name: "expose_as_property",
                description: "Expose a layer's text content or visibility as an editable component property",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentId: {
                            type: "string",
                            description: "ID of the component",
                        },
                        layerId: {
                            type: "string",
                            description: "ID of the layer to expose (text node for TEXT, any node for BOOLEAN)",
                        },
                        propertyName: {
                            type: "string",
                            description: "Name for the property",
                        },
                        propertyType: {
                            type: "string",
                            enum: ["TEXT", "BOOLEAN"],
                            description: "TEXT to expose text content, BOOLEAN to expose visibility",
                        },
                    },
                    required: ["componentId", "layerId", "propertyName", "propertyType"],
                },
            },
            {
                name: "list_component_properties",
                description: "List all properties defined on a component or component set",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentId: {
                            type: "string",
                            description: "ID of the component or component set",
                        },
                    },
                    required: ["componentId"],
                },
            },
            {
                name: "create_instance",
                description: "Create an instance of an existing component",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentId: {
                            type: "string",
                            description: "ID of the component to instantiate",
                        },
                        x: {
                            type: "number",
                            description: "X position (default: 0)",
                        },
                        y: {
                            type: "number",
                            description: "Y position (default: 0)",
                        },
                        parentId: {
                            type: "string",
                            description: "ID of parent frame",
                        },
                    },
                    required: ["componentId"],
                },
            },
            // ============================================
            // MODIFICATION TOOLS
            // ============================================
            {
                name: "move_node",
                description: "Move a node to a new position",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to move",
                        },
                        x: {
                            type: "number",
                            description: "New X position",
                        },
                        y: {
                            type: "number",
                            description: "New Y position",
                        },
                    },
                    required: ["nodeId", "x", "y"],
                },
            },
            {
                name: "resize_node",
                description: "Resize a node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to resize",
                        },
                        width: {
                            type: "number",
                            description: "New width",
                        },
                        height: {
                            type: "number",
                            description: "New height",
                        },
                    },
                    required: ["nodeId", "width", "height"],
                },
            },
            {
                name: "set_fill_color",
                description: "Set the fill color of a node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        color: {
                            type: "object",
                            description: "RGB color (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                            required: ["r", "g", "b"],
                        },
                    },
                    required: ["nodeId", "color"],
                },
            },
            {
                name: "add_stroke",
                description: "Add a stroke/border to a node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        color: {
                            type: "object",
                            description: "Stroke color as RGB (0-1 range)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                            },
                            required: ["r", "g", "b"],
                        },
                        weight: {
                            type: "number",
                            description: "Stroke weight in pixels (default: 1)",
                        },
                    },
                    required: ["nodeId", "color"],
                },
            },
            {
                name: "set_corner_radius",
                description: "Set the corner radius of a node (frames, rectangles)",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        radius: {
                            type: "number",
                            description: "Corner radius in pixels",
                        },
                    },
                    required: ["nodeId", "radius"],
                },
            },
            {
                name: "set_opacity",
                description: "Set the opacity of a node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        opacity: {
                            type: "number",
                            description: "Opacity value from 0 (transparent) to 1 (opaque)",
                        },
                    },
                    required: ["nodeId", "opacity"],
                },
            },
            {
                name: "add_effect",
                description: "Add a visual effect (shadow, blur) to a node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node",
                        },
                        type: {
                            type: "string",
                            enum: ["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"],
                            description: "Type of effect",
                        },
                        color: {
                            type: "object",
                            description: "Shadow color as RGBA (for shadow effects)",
                            properties: {
                                r: { type: "number" },
                                g: { type: "number" },
                                b: { type: "number" },
                                a: { type: "number" },
                            },
                        },
                        offset: {
                            type: "object",
                            description: "Shadow offset (for shadow effects)",
                            properties: {
                                x: { type: "number" },
                                y: { type: "number" },
                            },
                        },
                        radius: {
                            type: "number",
                            description: "Blur radius",
                        },
                        spread: {
                            type: "number",
                            description: "Shadow spread (for shadow effects)",
                        },
                    },
                    required: ["nodeId", "type"],
                },
            },
            // ============================================
            // TEXT TOOLS
            // ============================================
            {
                name: "set_text",
                description: "Update the text content of an existing text node",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the text node",
                        },
                        text: {
                            type: "string",
                            description: "New text content",
                        },
                    },
                    required: ["nodeId", "text"],
                },
            },
            {
                name: "set_text_style",
                description: "Set text styling properties",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the text node",
                        },
                        textAlign: {
                            type: "string",
                            enum: ["LEFT", "CENTER", "RIGHT", "JUSTIFIED"],
                            description: "Text alignment",
                        },
                        lineHeight: {
                            type: "number",
                            description: "Line height in pixels (or percentage if < 10)",
                        },
                        letterSpacing: {
                            type: "number",
                            description: "Letter spacing in pixels",
                        },
                        textDecoration: {
                            type: "string",
                            enum: ["NONE", "UNDERLINE", "STRIKETHROUGH"],
                            description: "Text decoration",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            // ============================================
            // ORGANIZATION TOOLS
            // ============================================
            {
                name: "reparent_node",
                description: "Move a node to a different parent frame",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to move",
                        },
                        newParentId: {
                            type: "string",
                            description: "ID of the new parent frame",
                        },
                        index: {
                            type: "number",
                            description: "Position in parent's children (optional, appends at end if not specified)",
                        },
                    },
                    required: ["nodeId", "newParentId"],
                },
            },
            {
                name: "duplicate_node",
                description: "Duplicate a node with optional position offset",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to duplicate",
                        },
                        offsetX: {
                            type: "number",
                            description: "X offset for the duplicate (default: 20)",
                        },
                        offsetY: {
                            type: "number",
                            description: "Y offset for the duplicate (default: 20)",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            {
                name: "group_nodes",
                description: "Group multiple nodes together",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of node IDs to group",
                        },
                        name: {
                            type: "string",
                            description: "Name for the group (default: 'Group')",
                        },
                    },
                    required: ["nodeIds"],
                },
            },
            {
                name: "delete_node",
                description: "Delete a node by its ID",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to delete",
                        },
                    },
                    required: ["nodeId"],
                },
            },
            // ============================================
            // MULTI-NODE TOOLS
            // ============================================
            {
                name: "align_nodes",
                description: "Align multiple nodes to each other",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of node IDs to align",
                        },
                        alignment: {
                            type: "string",
                            enum: ["LEFT", "CENTER_H", "RIGHT", "TOP", "CENTER_V", "BOTTOM"],
                            description: "Alignment direction",
                        },
                    },
                    required: ["nodeIds", "alignment"],
                },
            },
            {
                name: "distribute_nodes",
                description: "Distribute nodes evenly with equal spacing",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of node IDs to distribute",
                        },
                        direction: {
                            type: "string",
                            enum: ["HORIZONTAL", "VERTICAL"],
                            description: "Distribution direction",
                        },
                        spacing: {
                            type: "number",
                            description: "Fixed spacing between nodes (optional, uses equal distribution if not set)",
                        },
                    },
                    required: ["nodeIds", "direction"],
                },
            },
            // ============================================
            // QUERY TOOLS
            // ============================================
            {
                name: "list_nodes",
                description: "List all nodes on the current page with their IDs and types",
                inputSchema: {
                    type: "object",
                    properties: {
                        parentId: {
                            type: "string",
                            description: "ID of parent node to list children of (default: current page)",
                        },
                    },
                },
            },
            {
                name: "get_selection",
                description: "Get the currently selected nodes in Figma",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "set_selection",
                description: "Select specific nodes by their IDs",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of node IDs to select",
                        },
                    },
                    required: ["nodeIds"],
                },
            },
            {
                name: "zoom_to_fit",
                description: "Zoom the viewport to fit specific nodes or selection",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Node IDs to zoom to (optional, uses selection if not provided)",
                        },
                    },
                },
            },
            {
                name: "export_node",
                description: "Export a node as an image (PNG, JPG, SVG, or PDF). Returns base64-encoded data. Uses current selection if no nodeId provided.",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to export (optional, uses current selection if not provided)",
                        },
                        format: {
                            type: "string",
                            enum: ["PNG", "JPG", "SVG", "PDF"],
                            description: "Export format (default: PNG)",
                        },
                        scale: {
                            type: "number",
                            description: "Scale factor for PNG/JPG exports (default: 2 for 2x resolution)",
                        },
                    },
                },
            },
            {
                name: "find_nodes",
                description: "Search for nodes by type, name, or name pattern. Returns matching nodes with their IDs, positions, and sizes. Use this to find specific elements without manual tree traversal.",
                inputSchema: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            description: "Filter by node type (e.g., TEXT, FRAME, RECTANGLE, INSTANCE, COMPONENT)",
                        },
                        name: {
                            type: "string",
                            description: "Filter by exact node name",
                        },
                        nameContains: {
                            type: "string",
                            description: "Filter by partial name match (contains)",
                        },
                        parentId: {
                            type: "string",
                            description: "Search within a specific parent node (default: current page)",
                        },
                        maxResults: {
                            type: "number",
                            description: "Maximum number of results to return (default: 100)",
                        },
                    },
                },
            },
            {
                name: "get_tree",
                description: "Get the full node hierarchy in a single call. Returns nested tree structure with node info. Much more efficient than multiple list_nodes calls.",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "Root node ID to start from (default: current page)",
                        },
                        depth: {
                            type: "number",
                            description: "How many levels deep to traverse (default: 3)",
                        },
                    },
                },
            },
            {
                name: "bulk_modify",
                description: "Apply the same changes to multiple nodes at once. Much more efficient than individual set_fill_color calls.",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of node IDs to modify",
                        },
                        changes: {
                            type: "object",
                            description: "Changes to apply to all nodes",
                            properties: {
                                fillColor: {
                                    type: "object",
                                    description: "Fill color (RGB 0-1)",
                                    properties: {
                                        r: { type: "number" },
                                        g: { type: "number" },
                                        b: { type: "number" },
                                    },
                                },
                                strokeColor: {
                                    type: "object",
                                    description: "Stroke color (RGB 0-1)",
                                    properties: {
                                        r: { type: "number" },
                                        g: { type: "number" },
                                        b: { type: "number" },
                                    },
                                },
                                strokeWeight: { type: "number" },
                                opacity: { type: "number" },
                                cornerRadius: { type: "number" },
                                visible: { type: "boolean" },
                            },
                        },
                    },
                    required: ["nodeIds", "changes"],
                },
            },
            {
                name: "edit_component",
                description: "Modify a master component. Changes automatically propagate to all instances. More efficient than modifying instances individually.",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentId: {
                            type: "string",
                            description: "ID of the component or component set to edit",
                        },
                        changes: {
                            type: "object",
                            description: "Changes to apply to the component itself",
                            properties: {
                                fillColor: {
                                    type: "object",
                                    properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
                                },
                                strokeColor: {
                                    type: "object",
                                    properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
                                },
                                strokeWeight: { type: "number" },
                                opacity: { type: "number" },
                                cornerRadius: { type: "number" },
                                name: { type: "string" },
                            },
                        },
                        childChanges: {
                            type: "array",
                            description: "Changes to apply to children within the component",
                            items: {
                                type: "object",
                                properties: {
                                    childName: { type: "string", description: "Match children by name" },
                                    childType: { type: "string", description: "Match children by type (e.g., TEXT)" },
                                    fillColor: {
                                        type: "object",
                                        properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
                                    },
                                    text: { type: "string", description: "New text content (for TEXT nodes)" },
                                    fontSize: { type: "number" },
                                },
                            },
                        },
                    },
                    required: ["componentId"],
                },
            },
            {
                name: "analyze_node",
                description: "Get detailed information about a node including its layout context, parent auto-layout settings, sizing mode, and whether it can be freely positioned. Use this before modifying nodes to understand constraints.",
                inputSchema: {
                    type: "object",
                    properties: {
                        nodeId: {
                            type: "string",
                            description: "ID of the node to analyze",
                        },
                    },
                    required: ["nodeId"],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const result = await sendToFigma(name, args || {});
        // Special handling for export_node - return image content
        if (name === "export_node" && result.success && result.base64) {
            const content = [];
            // Add image if it's a supported image format
            if (result.mimeType === "image/png" || result.mimeType === "image/jpeg") {
                content.push({
                    type: "image",
                    data: result.base64,
                    mimeType: result.mimeType,
                });
            }
            // Add metadata as text
            content.push({
                type: "text",
                text: JSON.stringify({
                    success: true,
                    nodeId: result.nodeId,
                    nodeName: result.nodeName,
                    format: result.format,
                    scale: result.scale,
                    size: result.size,
                    ...(result.mimeType === "image/svg+xml" || result.mimeType === "application/pdf"
                        ? { base64: result.base64 }
                        : {}),
                }),
            });
            return { content };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result), // Compact JSON (removed pretty-printing)
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
// Start MCP server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MCP] Figma Design MCP Server v2.0 started (optimized)");
}
main().catch(console.error);
