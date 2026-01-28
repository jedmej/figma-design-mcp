import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer, WebSocket } from "ws";
// WebSocket server for Figma plugin communication
const WS_PORT = 9001;
let figmaSocket = null;
let pendingRequests = new Map();
// Start WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });
wss.on("connection", (ws) => {
    console.error("[MCP] Figma plugin connected");
    figmaSocket = ws;
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
    ws.on("close", () => {
        console.error("[MCP] Figma plugin disconnected");
        figmaSocket = null;
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
        // Timeout after 30 seconds
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error("Request timed out"));
            }
        }, 30000);
    });
}
// MCP Server setup
const server = new Server({ name: "figma-design-server", version: "1.0.0" }, { capabilities: { tools: {} } });
// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const result = await sendToFigma(name, args || {});
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
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
    console.error("[MCP] Figma Design MCP Server started");
}
main().catch(console.error);
