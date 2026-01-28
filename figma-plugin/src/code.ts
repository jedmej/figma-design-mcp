// Figma Plugin Code - Handles design operations
// Optimized version with handler registry, font caching, batch operations, and template tools

figma.showUI(__html__, { width: 350, height: 400 });

// ============================================
// FONT CACHE - Avoid redundant font loading
// ============================================
const loadedFonts = new Set<string>();

async function ensureFontLoaded(font: FontName): Promise<void> {
  const key = `${font.family}:${font.style}`;
  if (loadedFonts.has(key)) return;
  await figma.loadFontAsync(font);
  loadedFonts.add(key);
}

// Pre-load common fonts on plugin start
(async () => {
  const commonFonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
  ];
  for (const font of commonFonts) {
    try {
      await ensureFontLoaded(font);
    } catch (e) {
      // Font may not be available, continue
    }
  }
})();

// ============================================
// HELPER FUNCTIONS
// ============================================

// O(1) direct lookup using Figma's getNodeByIdAsync - much faster than findOne() scan
async function findNodeAsync(nodeId: string): Promise<SceneNode | null> {
  const node = await figma.getNodeByIdAsync(nodeId);
  return node as SceneNode | null;
}

// Legacy sync version - kept for backwards compatibility but deprecated
// Use findNodeAsync() for better performance
function findNode(nodeId: string): SceneNode | null {
  return figma.currentPage.findOne((n) => n.id === nodeId) as SceneNode | null;
}

async function getParentAsync(parentId?: string): Promise<FrameNode | GroupNode | PageNode> {
  if (parentId) {
    const parent = await findNodeAsync(parentId);
    if (parent && "appendChild" in parent) {
      return parent as FrameNode | GroupNode;
    }
  }
  return figma.currentPage;
}

// Legacy sync version - kept for backwards compatibility
function getParent(parentId?: string): FrameNode | GroupNode | PageNode {
  if (parentId) {
    const parent = findNode(parentId);
    if (parent && "appendChild" in parent) {
      return parent as FrameNode | GroupNode;
    }
  }
  return figma.currentPage;
}

// O(k) parallel async bulk lookup - much faster than O(n) page scan
async function findNodesAsync(nodeIds: string[]): Promise<Map<string, SceneNode>> {
  const nodeMap = new Map<string, SceneNode>();
  const nodes = await Promise.all(
    nodeIds.map(id => figma.getNodeByIdAsync(id))
  );
  nodes.forEach((node, i) => {
    if (node) nodeMap.set(nodeIds[i], node as SceneNode);
  });
  return nodeMap;
}

// Legacy sync version - kept for backwards compatibility but deprecated
// Use findNodesAsync() for better performance
function findNodes(nodeIds: string[]): Map<string, SceneNode> {
  const nodeMap = new Map<string, SceneNode>();
  const idSet = new Set(nodeIds);
  figma.currentPage.findAll((node) => {
    if (idSet.has(node.id)) {
      nodeMap.set(node.id, node as SceneNode);
    }
    return false;
  });
  return nodeMap;
}

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function createFrame(params: {
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: { r: number; g: number; b: number };
  parentId?: string;
}) {
  const frame = figma.createFrame();
  frame.name = params.name;
  frame.x = params.x ?? 0;
  frame.y = params.y ?? 0;
  frame.resize(params.width ?? 400, params.height ?? 300);

  if (params.fillColor) {
    frame.fills = [{ type: "SOLID", color: params.fillColor }];
  }

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(frame);

  return {
    success: true,
    nodeId: frame.id,
    name: frame.name,
    type: frame.type,
    position: { x: frame.x, y: frame.y },
    size: { width: frame.width, height: frame.height },
  };
}

async function createText(params: {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fontWeight?: string;
  fillColor?: { r: number; g: number; b: number };
  parentId?: string;
}) {
  const textNode = figma.createText();
  const fontWeight = params.fontWeight ?? "Regular";

  await ensureFontLoaded({ family: "Inter", style: fontWeight });

  textNode.fontName = { family: "Inter", style: fontWeight };
  textNode.characters = params.text;
  textNode.x = params.x ?? 0;
  textNode.y = params.y ?? 0;

  if (params.fontSize) {
    textNode.fontSize = params.fontSize;
  }

  if (params.fillColor) {
    textNode.fills = [{ type: "SOLID", color: params.fillColor }];
  }

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(textNode);

  return {
    success: true,
    nodeId: textNode.id,
    text: textNode.characters,
    type: textNode.type,
    position: { x: textNode.x, y: textNode.y },
  };
}

async function createRectangle(params: {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cornerRadius?: number;
  fillColor?: { r: number; g: number; b: number };
  parentId?: string;
}) {
  const rect = figma.createRectangle();
  rect.name = params.name ?? "Rectangle";
  rect.x = params.x ?? 0;
  rect.y = params.y ?? 0;
  rect.resize(params.width ?? 100, params.height ?? 100);

  if (params.cornerRadius) {
    rect.cornerRadius = params.cornerRadius;
  }

  if (params.fillColor) {
    rect.fills = [{ type: "SOLID", color: params.fillColor }];
  }

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(rect);

  return {
    success: true,
    nodeId: rect.id,
    name: rect.name,
    type: rect.type,
    position: { x: rect.x, y: rect.y },
    size: { width: rect.width, height: rect.height },
  };
}

async function createEllipse(params: {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: { r: number; g: number; b: number };
  parentId?: string;
}) {
  const ellipse = figma.createEllipse();
  ellipse.name = params.name ?? "Ellipse";
  ellipse.x = params.x ?? 0;
  ellipse.y = params.y ?? 0;
  const w = params.width ?? 100;
  ellipse.resize(w, params.height ?? w);

  if (params.fillColor) {
    ellipse.fills = [{ type: "SOLID", color: params.fillColor }];
  }

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(ellipse);

  return {
    success: true,
    nodeId: ellipse.id,
    name: ellipse.name,
    type: ellipse.type,
    position: { x: ellipse.x, y: ellipse.y },
    size: { width: ellipse.width, height: ellipse.height },
  };
}

async function setAutoLayout(params: {
  nodeId: string;
  direction?: "HORIZONTAL" | "VERTICAL";
  spacing?: number;
  padding?: number;
  alignment?: "MIN" | "CENTER" | "MAX";
  counterAlignment?: "MIN" | "CENTER" | "MAX";
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node || node.type !== "FRAME") {
    throw new Error("Node not found or not a frame");
  }

  const frame = node as FrameNode;
  frame.layoutMode = params.direction ?? "VERTICAL";
  frame.itemSpacing = params.spacing ?? 10;
  frame.paddingTop = params.padding ?? 20;
  frame.paddingRight = params.padding ?? 20;
  frame.paddingBottom = params.padding ?? 20;
  frame.paddingLeft = params.padding ?? 20;

  if (params.alignment) {
    frame.primaryAxisAlignItems = params.alignment;
  }
  if (params.counterAlignment) {
    frame.counterAxisAlignItems = params.counterAlignment;
  }

  return {
    success: true,
    nodeId: frame.id,
    layoutMode: frame.layoutMode,
    itemSpacing: frame.itemSpacing,
  };
}

async function createComponent(params: {
  name: string;
  fromNodeId?: string;
  width?: number;
  height?: number;
}) {
  let component: ComponentNode;

  if (params.fromNodeId) {
    const node = await findNodeAsync(params.fromNodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    component = figma.createComponentFromNode(node);
  } else {
    component = figma.createComponent();
    component.resize(params.width ?? 200, params.height ?? 100);
  }

  component.name = params.name;

  // Auto-expose all text nodes as properties
  const exposedProperties: Array<{ name: string; propertyId: string; defaultValue: string }> = [];
  const textNodes = component.findAll(n => n.type === "TEXT") as TextNode[];

  for (const textNode of textNodes) {
    // Create a property name from the text node name or content
    const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
    // Make sure property name is unique
    const uniquePropName = exposedProperties.find(p => p.name === propName)
      ? `${propName} ${exposedProperties.length + 1}`
      : propName;

    try {
      const propertyId = component.addComponentProperty(
        uniquePropName,
        "TEXT",
        textNode.characters
      );
      textNode.componentPropertyReferences = {
        ...textNode.componentPropertyReferences,
        characters: propertyId,
      };
      exposedProperties.push({
        name: uniquePropName,
        propertyId,
        defaultValue: textNode.characters,
      });
    } catch (e) {
      // Skip if property can't be added
    }
  }

  return {
    success: true,
    nodeId: component.id,
    name: component.name,
    type: component.type,
    size: { width: component.width, height: component.height },
    exposedProperties,
  };
}

async function createInstance(params: {
  componentId: string;
  x?: number;
  y?: number;
  parentId?: string;
}) {
  const component = await findNodeAsync(params.componentId);
  if (!component || component.type !== "COMPONENT") {
    throw new Error("Component not found");
  }

  const instance = (component as ComponentNode).createInstance();
  instance.x = params.x ?? 0;
  instance.y = params.y ?? 0;

  if (params.parentId) {
    const parent = await getParentAsync(params.parentId);
    parent.appendChild(instance);
  }

  return {
    success: true,
    nodeId: instance.id,
    componentId: params.componentId,
    type: instance.type,
    position: { x: instance.x, y: instance.y },
  };
}

async function listNodes(params: { parentId?: string }) {
  let nodes: readonly SceneNode[];

  if (params.parentId) {
    const parent = await findNodeAsync(params.parentId);
    if (parent && "children" in parent) {
      nodes = (parent as FrameNode | GroupNode).children;
    } else {
      throw new Error("Parent not found or has no children");
    }
  } else {
    nodes = figma.currentPage.children;
  }

  const nodeList = nodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
  }));

  return {
    success: true,
    nodes: nodeList,
    count: nodeList.length,
  };
}

async function deleteNode(params: { nodeId: string }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const name = node.name;
  node.remove();

  return {
    success: true,
    deletedNodeId: params.nodeId,
    deletedName: name,
  };
}

async function moveNode(params: { nodeId: string; x: number; y: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  node.x = params.x;
  node.y = params.y;

  return {
    success: true,
    nodeId: node.id,
    newPosition: { x: node.x, y: node.y },
  };
}

async function resizeNode(params: { nodeId: string; width: number; height: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if ("resize" in node) {
    (node as FrameNode).resize(params.width, params.height);
  } else {
    throw new Error("Node cannot be resized");
  }

  return {
    success: true,
    nodeId: node.id,
    newSize: { width: node.width, height: node.height },
  };
}

async function setFillColor(params: {
  nodeId: string;
  color: { r: number; g: number; b: number };
}) {
  // Use async lookup to support instance children (IDs like I6:12879;1:595)
  const node = await figma.getNodeByIdAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if ("fills" in node) {
    // Clear any bound fill style first (use async method)
    if ("setFillStyleIdAsync" in node) {
      await (node as any).setFillStyleIdAsync("");
    }
    (node as GeometryMixin).fills = [{ type: "SOLID", color: params.color }];
  } else {
    throw new Error("Node does not support fills");
  }

  return {
    success: true,
    nodeId: node.id,
    color: params.color,
  };
}

async function addStroke(params: {
  nodeId: string;
  color: { r: number; g: number; b: number };
  weight?: number;
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if ("strokes" in node) {
    (node as GeometryMixin).strokes = [{ type: "SOLID", color: params.color }];
    (node as GeometryMixin).strokeWeight = params.weight ?? 1;
  } else {
    throw new Error("Node does not support strokes");
  }

  return {
    success: true,
    nodeId: node.id,
    strokeColor: params.color,
    strokeWeight: params.weight ?? 1,
  };
}

function getSelection() {
  const selection = figma.currentPage.selection;

  return {
    success: true,
    selection: selection.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
    })),
    count: selection.length,
  };
}

async function setSelection(params: { nodeIds: string[] }) {
  const nodeMap = await findNodesAsync(params.nodeIds);
  const nodes = params.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is SceneNode => n !== undefined);

  figma.currentPage.selection = nodes;

  return {
    success: true,
    selectedCount: nodes.length,
  };
}

async function zoomToFit(params: { nodeIds?: string[] }) {
  let nodes: readonly SceneNode[];

  if (params.nodeIds && params.nodeIds.length > 0) {
    const nodeMap = await findNodesAsync(params.nodeIds);
    nodes = params.nodeIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is SceneNode => n !== undefined);
  } else {
    nodes = figma.currentPage.selection;
  }

  if (nodes.length > 0) {
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  return {
    success: true,
    zoomedToNodes: nodes.length,
  };
}

async function setCornerRadius(params: { nodeId: string; radius: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if ("cornerRadius" in node) {
    (node as RectangleNode | FrameNode).cornerRadius = params.radius;
  } else {
    throw new Error("Node does not support corner radius");
  }

  return {
    success: true,
    nodeId: node.id,
    cornerRadius: params.radius,
  };
}

async function reparentNode(params: { nodeId: string; newParentId: string; index?: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const newParent = await findNodeAsync(params.newParentId);
  if (!newParent || !("appendChild" in newParent)) {
    throw new Error("New parent not found or cannot contain children");
  }

  const parent = newParent as FrameNode | GroupNode;

  if (params.index !== undefined) {
    parent.insertChild(params.index, node);
  } else {
    parent.appendChild(node);
  }

  return {
    success: true,
    nodeId: node.id,
    newParentId: parent.id,
    newParentName: parent.name,
  };
}

async function setSizingMode(params: {
  nodeId: string;
  horizontal?: "FIXED" | "FILL" | "HUG";
  vertical?: "FIXED" | "FILL" | "HUG";
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (!("layoutSizingHorizontal" in node)) {
    throw new Error("Node does not support sizing modes");
  }

  const frameNode = node as FrameNode;

  if (params.horizontal) {
    frameNode.layoutSizingHorizontal = params.horizontal;
  }
  if (params.vertical) {
    frameNode.layoutSizingVertical = params.vertical;
  }

  return {
    success: true,
    nodeId: node.id,
    horizontalSizing: frameNode.layoutSizingHorizontal,
    verticalSizing: frameNode.layoutSizingVertical,
  };
}

async function setText(params: { nodeId: string; text: string }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (node.type !== "TEXT") {
    throw new Error("Node is not a text node");
  }

  const textNode = node as TextNode;
  await ensureFontLoaded(textNode.fontName as FontName);
  textNode.characters = params.text;

  return {
    success: true,
    nodeId: node.id,
    text: params.text,
  };
}

async function setConstraints(params: {
  nodeId: string;
  horizontal?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
  vertical?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (params.horizontal) {
    node.constraints = { ...node.constraints, horizontal: params.horizontal };
  }
  if (params.vertical) {
    node.constraints = { ...node.constraints, vertical: params.vertical };
  }

  return {
    success: true,
    nodeId: node.id,
    constraints: node.constraints,
  };
}

async function duplicateNode(params: { nodeId: string; offsetX?: number; offsetY?: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const clone = node.clone();
  clone.x = node.x + (params.offsetX ?? 20);
  clone.y = node.y + (params.offsetY ?? 20);

  return {
    success: true,
    originalId: node.id,
    newNodeId: clone.id,
    name: clone.name,
    position: { x: clone.x, y: clone.y },
  };
}

async function groupNodes(params: { nodeIds: string[]; name?: string }) {
  const nodeMap = await findNodesAsync(params.nodeIds);
  const nodes = params.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is SceneNode => n !== undefined);

  if (nodes.length < 2) {
    throw new Error("Need at least 2 nodes to group");
  }

  const group = figma.group(nodes, figma.currentPage);
  group.name = params.name ?? "Group";

  return {
    success: true,
    groupId: group.id,
    name: group.name,
    childCount: nodes.length,
  };
}

async function alignNodes(params: {
  nodeIds: string[];
  alignment: "LEFT" | "CENTER_H" | "RIGHT" | "TOP" | "CENTER_V" | "BOTTOM";
}) {
  const nodeMap = await findNodesAsync(params.nodeIds);
  const nodes = params.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is SceneNode => n !== undefined);

  if (nodes.length < 2) {
    throw new Error("Need at least 2 nodes to align");
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + node.width);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + node.height);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const node of nodes) {
    switch (params.alignment) {
      case "LEFT":
        node.x = minX;
        break;
      case "CENTER_H":
        node.x = centerX - node.width / 2;
        break;
      case "RIGHT":
        node.x = maxX - node.width;
        break;
      case "TOP":
        node.y = minY;
        break;
      case "CENTER_V":
        node.y = centerY - node.height / 2;
        break;
      case "BOTTOM":
        node.y = maxY - node.height;
        break;
    }
  }

  return {
    success: true,
    alignedCount: nodes.length,
    alignment: params.alignment,
  };
}

async function distributeNodes(params: {
  nodeIds: string[];
  direction: "HORIZONTAL" | "VERTICAL";
  spacing?: number;
}) {
  const nodeMap = await findNodesAsync(params.nodeIds);
  const nodes = params.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is SceneNode => n !== undefined);

  if (nodes.length < 2) {
    throw new Error("Need at least 2 nodes to distribute");
  }

  if (params.direction === "HORIZONTAL") {
    nodes.sort((a, b) => a.x - b.x);
  } else {
    nodes.sort((a, b) => a.y - b.y);
  }

  if (params.spacing !== undefined) {
    let currentPos = params.direction === "HORIZONTAL" ? nodes[0].x : nodes[0].y;
    for (const node of nodes) {
      if (params.direction === "HORIZONTAL") {
        node.x = currentPos;
        currentPos += node.width + params.spacing;
      } else {
        node.y = currentPos;
        currentPos += node.height + params.spacing;
      }
    }
  } else {
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (params.direction === "HORIZONTAL") {
      const totalWidth = (last.x + last.width) - first.x;
      const nodesWidth = nodes.reduce((sum, n) => sum + n.width, 0);
      const gap = (totalWidth - nodesWidth) / (nodes.length - 1);

      let currentX = first.x;
      for (const node of nodes) {
        node.x = currentX;
        currentX += node.width + gap;
      }
    } else {
      const totalHeight = (last.y + last.height) - first.y;
      const nodesHeight = nodes.reduce((sum, n) => sum + n.height, 0);
      const gap = (totalHeight - nodesHeight) / (nodes.length - 1);

      let currentY = first.y;
      for (const node of nodes) {
        node.y = currentY;
        currentY += node.height + gap;
      }
    }
  }

  return {
    success: true,
    distributedCount: nodes.length,
    direction: params.direction,
  };
}

async function setOpacity(params: { nodeId: string; opacity: number }) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  node.opacity = Math.max(0, Math.min(1, params.opacity));

  return {
    success: true,
    nodeId: node.id,
    opacity: node.opacity,
  };
}

async function addEffect(params: {
  nodeId: string;
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (!("effects" in node)) {
    throw new Error("Node does not support effects");
  }

  let effect: Effect;

  if (params.type === "DROP_SHADOW" || params.type === "INNER_SHADOW") {
    effect = {
      type: params.type,
      color: params.color ?? { r: 0, g: 0, b: 0, a: 0.25 },
      offset: params.offset ?? { x: 0, y: 4 },
      radius: params.radius ?? 8,
      spread: params.spread ?? 0,
      visible: true,
      blendMode: "NORMAL",
    };
  } else {
    effect = {
      type: params.type,
      radius: params.radius ?? 8,
      visible: true,
    };
  }

  const blendNode = node as BlendMixin;
  blendNode.effects = [...blendNode.effects, effect];

  return {
    success: true,
    nodeId: node.id,
    effectType: params.type,
    effectCount: blendNode.effects.length,
  };
}

async function setTextStyle(params: {
  nodeId: string;
  textAlign?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
}) {
  const node = await findNodeAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (node.type !== "TEXT") {
    throw new Error("Node is not a text node");
  }

  const textNode = node as TextNode;
  await ensureFontLoaded(textNode.fontName as FontName);

  if (params.textAlign) {
    textNode.textAlignHorizontal = params.textAlign;
  }

  if (params.lineHeight !== undefined) {
    if (params.lineHeight < 10) {
      textNode.lineHeight = { value: params.lineHeight * 100, unit: "PERCENT" };
    } else {
      textNode.lineHeight = { value: params.lineHeight, unit: "PIXELS" };
    }
  }

  if (params.letterSpacing !== undefined) {
    textNode.letterSpacing = { value: params.letterSpacing, unit: "PIXELS" };
  }

  if (params.textDecoration) {
    textNode.textDecoration = params.textDecoration;
  }

  return {
    success: true,
    nodeId: node.id,
    textAlign: textNode.textAlignHorizontal,
  };
}

// ============================================
// TEMPLATE TOOLS - High-level UI components
// ============================================

// Button size and variant presets
const buttonSizes = {
  sm: { paddingH: 12, paddingV: 6, fontSize: 12 },
  md: { paddingH: 16, paddingV: 10, fontSize: 14 },
  lg: { paddingH: 24, paddingV: 14, fontSize: 16 },
};

const buttonVariants = {
  primary: { fill: { r: 0.3, g: 0.45, b: 0.95 }, text: { r: 1, g: 1, b: 1 }, stroke: null },
  secondary: { fill: { r: 0.95, g: 0.95, b: 0.97 }, text: { r: 0.2, g: 0.2, b: 0.25 }, stroke: null },
  outline: { fill: null, text: { r: 0.3, g: 0.45, b: 0.95 }, stroke: { r: 0.3, g: 0.45, b: 0.95 } },
  ghost: { fill: null, text: { r: 0.3, g: 0.45, b: 0.95 }, stroke: null },
};

async function createButton(params: {
  text: string;
  x?: number;
  y?: number;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fillColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
  cornerRadius?: number;
  parentId?: string;
}) {
  const variant = buttonVariants[params.variant ?? "primary"];
  const size = buttonSizes[params.size ?? "md"];

  const frame = figma.createFrame();
  frame.name = `Button: ${params.text}`;
  frame.x = params.x ?? 0;
  frame.y = params.y ?? 0;

  // Set auto-layout
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.paddingLeft = frame.paddingRight = size.paddingH;
  frame.paddingTop = frame.paddingBottom = size.paddingV;
  frame.layoutSizingHorizontal = "HUG";
  frame.layoutSizingVertical = "HUG";

  // Set fill
  const fillColor = params.fillColor ?? variant.fill;
  if (fillColor) {
    frame.fills = [{ type: "SOLID", color: fillColor }];
  } else {
    frame.fills = [];
  }

  // Set corner radius
  frame.cornerRadius = params.cornerRadius ?? 8;

  // Add stroke if needed
  if (variant.stroke) {
    frame.strokes = [{ type: "SOLID", color: variant.stroke }];
    frame.strokeWeight = 1;
  }

  // Create text
  const textColor = params.textColor ?? variant.text;
  await ensureFontLoaded({ family: "Inter", style: "Medium" });

  const textNode = figma.createText();
  textNode.fontName = { family: "Inter", style: "Medium" };
  textNode.characters = params.text;
  textNode.fontSize = size.fontSize;
  textNode.fills = [{ type: "SOLID", color: textColor }];

  frame.appendChild(textNode);

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(frame);

  return {
    success: true,
    nodeId: frame.id,
    textNodeId: textNode.id,
    name: frame.name,
    size: { width: frame.width, height: frame.height },
  };
}

async function createCard(params: {
  name: string;
  x?: number;
  y?: number;
  width?: number;
  header?: { title?: string; subtitle?: string };
  body?: { text?: string; imagePlaceholder?: boolean };
  footer?: { primaryAction?: string; secondaryAction?: string };
  fillColor?: { r: number; g: number; b: number };
  cornerRadius?: number;
  shadow?: boolean;
  parentId?: string;
}) {
  const width = params.width ?? 320;

  const card = figma.createFrame();
  card.name = params.name;
  card.x = params.x ?? 0;
  card.y = params.y ?? 0;
  card.resize(width, 100);

  card.layoutMode = "VERTICAL";
  card.itemSpacing = 0;
  card.layoutSizingHorizontal = "FIXED";
  card.layoutSizingVertical = "HUG";

  card.fills = [{ type: "SOLID", color: params.fillColor ?? { r: 1, g: 1, b: 1 } }];
  card.cornerRadius = params.cornerRadius ?? 12;

  if (params.shadow !== false) {
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
  }

  const createdIds: Record<string, string> = { cardId: card.id };

  await ensureFontLoaded({ family: "Inter", style: "Semi Bold" });
  await ensureFontLoaded({ family: "Inter", style: "Regular" });

  // Header section
  if (params.header) {
    const header = figma.createFrame();
    header.name = "Header";
    header.layoutMode = "VERTICAL";
    header.itemSpacing = 4;
    header.paddingTop = header.paddingBottom = 16;
    header.paddingLeft = header.paddingRight = 16;
    header.fills = [];

    if (params.header.title) {
      const title = figma.createText();
      title.fontName = { family: "Inter", style: "Semi Bold" };
      title.characters = params.header.title;
      title.fontSize = 18;
      title.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
      header.appendChild(title);
      title.layoutSizingHorizontal = "FILL";
      createdIds.titleId = title.id;
    }

    if (params.header.subtitle) {
      const subtitle = figma.createText();
      subtitle.fontName = { family: "Inter", style: "Regular" };
      subtitle.characters = params.header.subtitle;
      subtitle.fontSize = 14;
      subtitle.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
      header.appendChild(subtitle);
      subtitle.layoutSizingHorizontal = "FILL";
      createdIds.subtitleId = subtitle.id;
    }

    card.appendChild(header);
    header.layoutSizingHorizontal = "FILL";
    header.layoutSizingVertical = "HUG";
    createdIds.headerId = header.id;
  }

  // Body section
  if (params.body) {
    const body = figma.createFrame();
    body.name = "Body";
    body.layoutMode = "VERTICAL";
    body.itemSpacing = 12;
    body.paddingTop = body.paddingBottom = 16;
    body.paddingLeft = body.paddingRight = 16;
    body.fills = [];

    if (params.body.imagePlaceholder) {
      const placeholder = figma.createRectangle();
      placeholder.name = "Image Placeholder";
      placeholder.resize(width - 32, 160);
      placeholder.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
      placeholder.cornerRadius = 8;
      body.appendChild(placeholder);
      placeholder.layoutSizingHorizontal = "FILL";
      createdIds.imagePlaceholderId = placeholder.id;
    }

    if (params.body.text) {
      const text = figma.createText();
      text.fontName = { family: "Inter", style: "Regular" };
      text.characters = params.body.text;
      text.fontSize = 14;
      text.fills = [{ type: "SOLID", color: { r: 0.3, g: 0.3, b: 0.3 } }];
      body.appendChild(text);
      text.layoutSizingHorizontal = "FILL";
      createdIds.bodyTextId = text.id;
    }

    card.appendChild(body);
    body.layoutSizingHorizontal = "FILL";
    body.layoutSizingVertical = "HUG";
    createdIds.bodyId = body.id;
  }

  // Footer section
  if (params.footer) {
    const footer = figma.createFrame();
    footer.name = "Footer";
    footer.layoutMode = "HORIZONTAL";
    footer.itemSpacing = 8;
    footer.paddingTop = footer.paddingBottom = 12;
    footer.paddingLeft = footer.paddingRight = 16;
    footer.primaryAxisAlignItems = "MAX";
    footer.fills = [];

    footer.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
    footer.strokeWeight = 1;
    footer.strokeAlign = "INSIDE";

    if (params.footer.secondaryAction) {
      const btn = await createButton({
        text: params.footer.secondaryAction,
        variant: "ghost",
        size: "sm",
      });
      const btnNode = await figma.getNodeByIdAsync(btn.nodeId) as FrameNode;
      footer.appendChild(btnNode);
      createdIds.secondaryButtonId = btn.nodeId;
    }

    if (params.footer.primaryAction) {
      const btn = await createButton({
        text: params.footer.primaryAction,
        variant: "primary",
        size: "sm",
      });
      const btnNode = await figma.getNodeByIdAsync(btn.nodeId) as FrameNode;
      footer.appendChild(btnNode);
      createdIds.primaryButtonId = btn.nodeId;
    }

    card.appendChild(footer);
    footer.layoutSizingHorizontal = "FILL";
    footer.layoutSizingVertical = "HUG";
    createdIds.footerId = footer.id;
  }

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(card);

  return {
    success: true,
    ...createdIds,
    name: card.name,
    size: { width: card.width, height: card.height },
  };
}

async function createInput(params: {
  label?: string;
  placeholder: string;
  x?: number;
  y?: number;
  width?: number;
  type?: "text" | "email" | "password" | "search";
  required?: boolean;
  parentId?: string;
}) {
  const width = params.width ?? 280;

  const container = figma.createFrame();
  container.name = `Input: ${params.label ?? params.placeholder}`;
  container.x = params.x ?? 0;
  container.y = params.y ?? 0;
  container.layoutMode = "VERTICAL";
  container.itemSpacing = 6;
  container.layoutSizingHorizontal = "HUG";
  container.layoutSizingVertical = "HUG";
  container.fills = [];

  const createdIds: Record<string, string> = { containerId: container.id };

  await ensureFontLoaded({ family: "Inter", style: "Medium" });
  await ensureFontLoaded({ family: "Inter", style: "Regular" });

  // Label
  if (params.label) {
    const labelFrame = figma.createFrame();
    labelFrame.layoutMode = "HORIZONTAL";
    labelFrame.itemSpacing = 4;
    labelFrame.layoutSizingHorizontal = "HUG";
    labelFrame.layoutSizingVertical = "HUG";
    labelFrame.fills = [];

    const label = figma.createText();
    label.fontName = { family: "Inter", style: "Medium" };
    label.characters = params.label;
    label.fontSize = 14;
    label.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
    labelFrame.appendChild(label);
    createdIds.labelId = label.id;

    if (params.required) {
      const asterisk = figma.createText();
      asterisk.fontName = { family: "Inter", style: "Medium" };
      asterisk.characters = "*";
      asterisk.fontSize = 14;
      asterisk.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.3, b: 0.3 } }];
      labelFrame.appendChild(asterisk);
    }

    container.appendChild(labelFrame);
  }

  // Input field
  const inputFrame = figma.createFrame();
  inputFrame.name = "Input Field";
  inputFrame.resize(width, 40);
  inputFrame.layoutMode = "HORIZONTAL";
  inputFrame.paddingLeft = inputFrame.paddingRight = 12;
  inputFrame.counterAxisAlignItems = "CENTER";
  inputFrame.layoutSizingHorizontal = "FIXED";
  inputFrame.layoutSizingVertical = "FIXED";
  inputFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  inputFrame.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
  inputFrame.strokeWeight = 1;
  inputFrame.cornerRadius = 8;

  if (params.type === "search") {
    const iconPlaceholder = figma.createRectangle();
    iconPlaceholder.name = "Search Icon";
    iconPlaceholder.resize(16, 16);
    iconPlaceholder.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
    iconPlaceholder.cornerRadius = 2;
    inputFrame.appendChild(iconPlaceholder);
    inputFrame.itemSpacing = 8;
  }

  const placeholderText = figma.createText();
  placeholderText.fontName = { family: "Inter", style: "Regular" };
  placeholderText.characters = params.placeholder;
  placeholderText.fontSize = 14;
  placeholderText.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
  placeholderText.layoutSizingHorizontal = "FILL";
  inputFrame.appendChild(placeholderText);
  createdIds.placeholderTextId = placeholderText.id;

  container.appendChild(inputFrame);
  createdIds.inputFrameId = inputFrame.id;

  const parent = await getParentAsync(params.parentId);
  parent.appendChild(container);

  return {
    success: true,
    ...createdIds,
    name: container.name,
    size: { width: container.width, height: container.height },
  };
}

// ============================================
// BATCH OPERATIONS - Execute multiple commands
// ============================================

function resolveReferences(params: any, resultMap: Map<string, any>): any {
  if (typeof params === "string" && params.startsWith("$ref:")) {
    const path = params.slice(5); // Remove "$ref:"
    const [id, ...fields] = path.split(".");
    let value = resultMap.get(id);
    for (const field of fields) {
      value = value?.[field];
    }
    return value;
  }

  if (Array.isArray(params)) {
    return params.map((p) => resolveReferences(p, resultMap));
  }

  if (params && typeof params === "object") {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      resolved[key] = resolveReferences(value, resultMap);
    }
    return resolved;
  }

  return params;
}

async function executeBatch(params: {
  commands: Array<{ command: string; params: any; id?: string }>;
}) {
  const results: any[] = [];
  const resultMap = new Map<string, any>();

  for (const cmd of params.commands) {
    try {
      const resolvedParams = resolveReferences(cmd.params, resultMap);
      const handler = commandHandlers.get(cmd.command);

      if (!handler) {
        results.push({ success: false, error: `Unknown command: ${cmd.command}` });
        continue;
      }

      const cmdResult = await handler(resolvedParams);
      results.push(cmdResult);

      if (cmd.id) {
        resultMap.set(cmd.id, cmdResult);
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    success: true,
    results,
    executedCount: results.length,
    successCount: results.filter((r) => r.success).length,
  };
}

// ============================================
// EXPORT NODE - Screenshot/export functionality
// ============================================

async function exportNode(params: {
  nodeId?: string;
  format?: "PNG" | "JPG" | "SVG" | "PDF";
  scale?: number;
}) {
  let node: SceneNode | null = null;

  // Use provided nodeId or get current selection
  if (params.nodeId) {
    node = await figma.getNodeByIdAsync(params.nodeId) as SceneNode | null;
  } else {
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      node = selection[0];
    }
  }

  if (!node) {
    throw new Error("No node found. Provide a nodeId or select a node in Figma.");
  }

  const format = params.format || "PNG";
  const scale = params.scale || 2;

  // Export settings
  const settings: ExportSettings = format === "SVG"
    ? { format: "SVG" }
    : format === "PDF"
    ? { format: "PDF" }
    : { format: format as "PNG" | "JPG", constraint: { type: "SCALE", value: scale } };

  // Export the node
  const bytes = await node.exportAsync(settings);

  // Convert to base64
  const base64 = figma.base64Encode(bytes);

  // Get mime type
  const mimeTypes: Record<string, string> = {
    PNG: "image/png",
    JPG: "image/jpeg",
    SVG: "image/svg+xml",
    PDF: "application/pdf",
  };

  return {
    success: true,
    nodeId: node.id,
    nodeName: node.name,
    format,
    scale,
    mimeType: mimeTypes[format],
    base64,
    size: {
      width: node.width,
      height: node.height,
    },
  };
}

// ============================================
// FIND NODES - Search by type, name, or properties
// ============================================

async function findNodesFunc(params: {
  type?: string;
  name?: string;
  nameContains?: string;
  parentId?: string;
  maxResults?: number;
  scopeToSelection?: boolean;
}) {
  // Determine search root: parentId > scopeToSelection > entire page
  let searchRoots: BaseNode[] = [];

  if (params.parentId) {
    const parent = await figma.getNodeByIdAsync(params.parentId);
    if (!parent || !("findAll" in parent)) {
      throw new Error("Parent node not found or cannot contain children");
    }
    searchRoots = [parent];
  } else if (params.scopeToSelection !== false && figma.currentPage.selection.length > 0) {
    // Default to selection for better performance on large files
    searchRoots = figma.currentPage.selection;
  } else {
    searchRoots = [figma.currentPage];
  }

  const maxResults = params.maxResults || 100;
  const results: Array<{
    id: string;
    name: string;
    type: string;
    parentId: string | null;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }> = [];

  for (const root of searchRoots) {
    if (results.length >= maxResults) break;

    if (!("findAll" in root)) continue;

    (root as ChildrenMixin).findAll((node) => {
      if (results.length >= maxResults) return false;

      // Filter by type
      if (params.type && node.type !== params.type) return false;

      // Filter by exact name
      if (params.name && node.name !== params.name) return false;

      // Filter by name contains
      if (params.nameContains && !node.name.includes(params.nameContains)) return false;

      const sceneNode = node as SceneNode;
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        parentId: node.parent?.id || null,
        position: { x: sceneNode.x, y: sceneNode.y },
        size: { width: sceneNode.width, height: sceneNode.height },
      });

      return false; // Continue searching
    });
  }

  return {
    success: true,
    nodes: results,
    count: results.length,
    truncated: results.length >= maxResults,
    scopedToSelection: params.scopeToSelection !== false && !params.parentId && figma.currentPage.selection.length > 0,
  };
}

// ============================================
// GET TREE - Full hierarchy in one call
// ============================================

async function getTree(params: {
  nodeId?: string;
  depth?: number;
}) {
  const maxDepth = params.depth ?? 3;

  const rootNode = params.nodeId
    ? await figma.getNodeByIdAsync(params.nodeId)
    : figma.currentPage;

  if (!rootNode) {
    throw new Error("Node not found");
  }

  function buildTree(node: BaseNode, currentDepth: number): any {
    const sceneNode = node as SceneNode;
    const result: any = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // Add position/size for scene nodes
    if ("x" in sceneNode) {
      result.position = { x: sceneNode.x, y: sceneNode.y };
      result.size = { width: sceneNode.width, height: sceneNode.height };
    }

    // Add text content for text nodes
    if (node.type === "TEXT") {
      result.characters = (node as TextNode).characters;
    }

    // Recurse into children if within depth limit
    if (currentDepth < maxDepth && "children" in node) {
      result.children = (node as ChildrenMixin).children.map((child) =>
        buildTree(child, currentDepth + 1)
      );
    } else if ("children" in node) {
      result.childCount = (node as ChildrenMixin).children.length;
    }

    return result;
  }

  return {
    success: true,
    tree: buildTree(rootNode, 0),
  };
}

// ============================================
// BULK MODIFY - Apply changes to multiple nodes
// ============================================

// ============================================
// UNDO SUPPORT - Store snapshots before changes
// ============================================

interface PropertySnapshot {
  nodeId: string;
  property: string;
  previousValue: any;
}

let lastOperationSnapshot: PropertySnapshot[] = [];

async function undoLastOperation() {
  if (lastOperationSnapshot.length === 0) {
    return {
      success: false,
      error: "No operation to undo",
    };
  }

  const results: Array<{ nodeId: string; property: string; success: boolean; error?: string }> = [];

  for (const snapshot of lastOperationSnapshot) {
    try {
      const node = await figma.getNodeByIdAsync(snapshot.nodeId);
      if (!node) {
        results.push({ nodeId: snapshot.nodeId, property: snapshot.property, success: false, error: "Node not found" });
        continue;
      }

      const sceneNode = node as SceneNode;

      // Restore the previous value based on property type
      switch (snapshot.property) {
        case "fills":
          if ("fills" in sceneNode) {
            (sceneNode as GeometryMixin).fills = snapshot.previousValue;
          }
          break;
        case "strokes":
          if ("strokes" in sceneNode) {
            (sceneNode as GeometryMixin).strokes = snapshot.previousValue;
          }
          break;
        case "strokeWeight":
          if ("strokeWeight" in sceneNode) {
            (sceneNode as GeometryMixin).strokeWeight = snapshot.previousValue;
          }
          break;
        case "opacity":
          sceneNode.opacity = snapshot.previousValue;
          break;
        case "cornerRadius":
          if ("cornerRadius" in sceneNode) {
            (sceneNode as RectangleNode).cornerRadius = snapshot.previousValue;
          }
          break;
        case "visible":
          sceneNode.visible = snapshot.previousValue;
          break;
        case "fontSize":
          if (sceneNode.type === "TEXT") {
            const textNode = sceneNode as TextNode;
            await ensureFontLoaded(textNode.fontName as FontName);
            textNode.fontSize = snapshot.previousValue;
          }
          break;
        case "fontName":
          if (sceneNode.type === "TEXT") {
            const textNode = sceneNode as TextNode;
            await ensureFontLoaded(snapshot.previousValue);
            textNode.fontName = snapshot.previousValue;
          }
          break;
        case "textAlignHorizontal":
          if (sceneNode.type === "TEXT") {
            (sceneNode as TextNode).textAlignHorizontal = snapshot.previousValue;
          }
          break;
        case "letterSpacing":
          if (sceneNode.type === "TEXT") {
            (sceneNode as TextNode).letterSpacing = snapshot.previousValue;
          }
          break;
        case "lineHeight":
          if (sceneNode.type === "TEXT") {
            (sceneNode as TextNode).lineHeight = snapshot.previousValue;
          }
          break;
        case "textDecoration":
          if (sceneNode.type === "TEXT") {
            (sceneNode as TextNode).textDecoration = snapshot.previousValue;
          }
          break;
        case "textCase":
          if (sceneNode.type === "TEXT") {
            (sceneNode as TextNode).textCase = snapshot.previousValue;
          }
          break;
        case "x":
          sceneNode.x = snapshot.previousValue;
          break;
        case "y":
          sceneNode.y = snapshot.previousValue;
          break;
        case "width":
        case "height":
          if ("resize" in sceneNode) {
            const frameNode = sceneNode as FrameNode;
            if (snapshot.property === "width") {
              frameNode.resize(snapshot.previousValue, frameNode.height);
            } else {
              frameNode.resize(frameNode.width, snapshot.previousValue);
            }
          }
          break;
        case "rotation":
          if ("rotation" in sceneNode) {
            (sceneNode as any).rotation = snapshot.previousValue;
          }
          break;
        case "layoutSizingHorizontal":
          if ("layoutSizingHorizontal" in sceneNode) {
            (sceneNode as FrameNode).layoutSizingHorizontal = snapshot.previousValue;
          }
          break;
        case "layoutSizingVertical":
          if ("layoutSizingVertical" in sceneNode) {
            (sceneNode as FrameNode).layoutSizingVertical = snapshot.previousValue;
          }
          break;
        case "paddingTop":
        case "paddingRight":
        case "paddingBottom":
        case "paddingLeft":
        case "itemSpacing":
          if (snapshot.property in sceneNode) {
            (sceneNode as any)[snapshot.property] = snapshot.previousValue;
          }
          break;
        case "effects":
          if ("effects" in sceneNode) {
            (sceneNode as BlendMixin).effects = snapshot.previousValue;
          }
          break;
        default:
          results.push({ nodeId: snapshot.nodeId, property: snapshot.property, success: false, error: "Unknown property" });
          continue;
      }

      results.push({ nodeId: snapshot.nodeId, property: snapshot.property, success: true });
    } catch (e) {
      results.push({
        nodeId: snapshot.nodeId,
        property: snapshot.property,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Clear the snapshot after undo
  const restoredCount = results.filter(r => r.success).length;
  lastOperationSnapshot = [];

  return {
    success: true,
    results,
    restoredCount,
    failedCount: results.filter(r => !r.success).length,
  };
}

// Shadow presets
const shadowPresets = {
  small: { offset: { x: 0, y: 1 }, blur: 2, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.1 } },
  medium: { offset: { x: 0, y: 4 }, blur: 8, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.15 } },
  large: { offset: { x: 0, y: 8 }, blur: 16, spread: -2, color: { r: 0, g: 0, b: 0, a: 0.2 } },
  xl: { offset: { x: 0, y: 16 }, blur: 32, spread: -4, color: { r: 0, g: 0, b: 0, a: 0.25 } },
};

async function bulkModify(params: {
  nodeIds: string[];
  changes: {
    // Original properties
    fillColor?: { r: number; g: number; b: number };
    strokeColor?: { r: number; g: number; b: number };
    strokeWeight?: number;
    opacity?: number;
    cornerRadius?: number;
    visible?: boolean;
    fontSize?: number;
    // Text properties (Phase 1.1)
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    letterSpacing?: number;
    lineHeight?: number;
    textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
    textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
    // Layout properties (Phase 1.2)
    width?: number | "hug" | "fill";
    height?: number | "hug" | "fill";
    x?: number;
    y?: number;
    rotation?: number;
    // Auto-layout properties (Phase 1.3)
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    itemSpacing?: number;
    // Transform properties (Phase 1.4)
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    // Effects (Phase 3.3)
    clearEffects?: boolean;
    addDropShadow?: "small" | "medium" | "large" | "xl" | { color: { r: number; g: number; b: number; a: number }; offset: { x: number; y: number }; blur: number; spread: number };
    addBlur?: number;
  };
}) {
  const results: Array<{ nodeId: string; success: boolean; error?: string }> = [];
  const snapshots: PropertySnapshot[] = [];

  for (const nodeId of params.nodeIds) {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        results.push({ nodeId, success: false, error: "Node not found" });
        continue;
      }

      const sceneNode = node as SceneNode;

      // Apply fill color
      if (params.changes.fillColor && "fills" in sceneNode) {
        snapshots.push({ nodeId, property: "fills", previousValue: (sceneNode as GeometryMixin).fills });
        // Clear any bound fill style first (use async method)
        if ("setFillStyleIdAsync" in sceneNode) {
          await (sceneNode as any).setFillStyleIdAsync("");
        }
        (sceneNode as GeometryMixin).fills = [
          { type: "SOLID", color: params.changes.fillColor },
        ];
      }

      // Apply stroke color
      if (params.changes.strokeColor && "strokes" in sceneNode) {
        snapshots.push({ nodeId, property: "strokes", previousValue: (sceneNode as GeometryMixin).strokes });
        (sceneNode as GeometryMixin).strokes = [
          { type: "SOLID", color: params.changes.strokeColor },
        ];
      }

      // Apply stroke weight
      if (params.changes.strokeWeight !== undefined && "strokeWeight" in sceneNode) {
        snapshots.push({ nodeId, property: "strokeWeight", previousValue: (sceneNode as GeometryMixin).strokeWeight });
        (sceneNode as GeometryMixin).strokeWeight = params.changes.strokeWeight;
      }

      // Apply opacity
      if (params.changes.opacity !== undefined) {
        snapshots.push({ nodeId, property: "opacity", previousValue: sceneNode.opacity });
        sceneNode.opacity = params.changes.opacity;
      }

      // Apply corner radius
      if (params.changes.cornerRadius !== undefined && "cornerRadius" in sceneNode) {
        snapshots.push({ nodeId, property: "cornerRadius", previousValue: (sceneNode as RectangleNode).cornerRadius });
        (sceneNode as RectangleNode).cornerRadius = params.changes.cornerRadius;
      }

      // Apply visibility
      if (params.changes.visible !== undefined) {
        snapshots.push({ nodeId, property: "visible", previousValue: sceneNode.visible });
        sceneNode.visible = params.changes.visible;
      }

      // ============================================
      // TEXT PROPERTIES (Phase 1.1)
      // ============================================
      if (sceneNode.type === "TEXT") {
        const textNode = sceneNode as TextNode;

        // Clear text style before making text changes
        if ((params.changes.fontFamily || params.changes.fontWeight || params.changes.fontSize ||
             params.changes.textAlign || params.changes.letterSpacing || params.changes.lineHeight ||
             params.changes.textDecoration || params.changes.textCase) && "setTextStyleIdAsync" in textNode) {
          await (textNode as any).setTextStyleIdAsync("");
        }

        // Apply font size
        if (params.changes.fontSize !== undefined) {
          snapshots.push({ nodeId, property: "fontSize", previousValue: textNode.fontSize });
          await ensureFontLoaded(textNode.fontName as FontName);
          textNode.fontSize = params.changes.fontSize;
        }

        // Apply font family and/or weight
        if (params.changes.fontFamily !== undefined || params.changes.fontWeight !== undefined) {
          const currentFont = textNode.fontName as FontName;
          snapshots.push({ nodeId, property: "fontName", previousValue: currentFont });

          const newFont: FontName = {
            family: params.changes.fontFamily ?? currentFont.family,
            style: params.changes.fontWeight ?? currentFont.style,
          };
          await ensureFontLoaded(newFont);
          textNode.fontName = newFont;
        }

        // Apply text alignment
        if (params.changes.textAlign !== undefined) {
          snapshots.push({ nodeId, property: "textAlignHorizontal", previousValue: textNode.textAlignHorizontal });
          textNode.textAlignHorizontal = params.changes.textAlign;
        }

        // Apply letter spacing
        if (params.changes.letterSpacing !== undefined) {
          snapshots.push({ nodeId, property: "letterSpacing", previousValue: textNode.letterSpacing });
          textNode.letterSpacing = { value: params.changes.letterSpacing, unit: "PIXELS" };
        }

        // Apply line height
        if (params.changes.lineHeight !== undefined) {
          snapshots.push({ nodeId, property: "lineHeight", previousValue: textNode.lineHeight });
          if (params.changes.lineHeight < 10) {
            textNode.lineHeight = { value: params.changes.lineHeight * 100, unit: "PERCENT" };
          } else {
            textNode.lineHeight = { value: params.changes.lineHeight, unit: "PIXELS" };
          }
        }

        // Apply text decoration
        if (params.changes.textDecoration !== undefined) {
          snapshots.push({ nodeId, property: "textDecoration", previousValue: textNode.textDecoration });
          textNode.textDecoration = params.changes.textDecoration;
        }

        // Apply text case
        if (params.changes.textCase !== undefined) {
          snapshots.push({ nodeId, property: "textCase", previousValue: textNode.textCase });
          textNode.textCase = params.changes.textCase;
        }
      }

      // ============================================
      // LAYOUT PROPERTIES (Phase 1.2)
      // ============================================

      // Apply position changes
      if (params.changes.x !== undefined) {
        snapshots.push({ nodeId, property: "x", previousValue: sceneNode.x });
        sceneNode.x = params.changes.x;
      }

      if (params.changes.y !== undefined) {
        snapshots.push({ nodeId, property: "y", previousValue: sceneNode.y });
        sceneNode.y = params.changes.y;
      }

      // Apply rotation
      if (params.changes.rotation !== undefined && "rotation" in sceneNode) {
        snapshots.push({ nodeId, property: "rotation", previousValue: (sceneNode as any).rotation });
        (sceneNode as any).rotation = params.changes.rotation;
      }

      // Apply width/height with hug/fill support
      if (params.changes.width !== undefined && "resize" in sceneNode) {
        const frameNode = sceneNode as FrameNode;
        if (typeof params.changes.width === "number") {
          snapshots.push({ nodeId, property: "width", previousValue: frameNode.width });
          frameNode.resize(params.changes.width, frameNode.height);
        } else if (params.changes.width === "hug" && "layoutSizingHorizontal" in frameNode) {
          snapshots.push({ nodeId, property: "layoutSizingHorizontal", previousValue: frameNode.layoutSizingHorizontal });
          frameNode.layoutSizingHorizontal = "HUG";
        } else if (params.changes.width === "fill" && "layoutSizingHorizontal" in frameNode) {
          snapshots.push({ nodeId, property: "layoutSizingHorizontal", previousValue: frameNode.layoutSizingHorizontal });
          frameNode.layoutSizingHorizontal = "FILL";
        }
      }

      if (params.changes.height !== undefined && "resize" in sceneNode) {
        const frameNode = sceneNode as FrameNode;
        if (typeof params.changes.height === "number") {
          snapshots.push({ nodeId, property: "height", previousValue: frameNode.height });
          frameNode.resize(frameNode.width, params.changes.height);
        } else if (params.changes.height === "hug" && "layoutSizingVertical" in frameNode) {
          snapshots.push({ nodeId, property: "layoutSizingVertical", previousValue: frameNode.layoutSizingVertical });
          frameNode.layoutSizingVertical = "HUG";
        } else if (params.changes.height === "fill" && "layoutSizingVertical" in frameNode) {
          snapshots.push({ nodeId, property: "layoutSizingVertical", previousValue: frameNode.layoutSizingVertical });
          frameNode.layoutSizingVertical = "FILL";
        }
      }

      // ============================================
      // AUTO-LAYOUT PROPERTIES (Phase 1.3)
      // ============================================
      if ("paddingTop" in sceneNode) {
        const frameNode = sceneNode as FrameNode;

        if (params.changes.paddingTop !== undefined) {
          snapshots.push({ nodeId, property: "paddingTop", previousValue: frameNode.paddingTop });
          frameNode.paddingTop = params.changes.paddingTop;
        }
        if (params.changes.paddingRight !== undefined) {
          snapshots.push({ nodeId, property: "paddingRight", previousValue: frameNode.paddingRight });
          frameNode.paddingRight = params.changes.paddingRight;
        }
        if (params.changes.paddingBottom !== undefined) {
          snapshots.push({ nodeId, property: "paddingBottom", previousValue: frameNode.paddingBottom });
          frameNode.paddingBottom = params.changes.paddingBottom;
        }
        if (params.changes.paddingLeft !== undefined) {
          snapshots.push({ nodeId, property: "paddingLeft", previousValue: frameNode.paddingLeft });
          frameNode.paddingLeft = params.changes.paddingLeft;
        }
        if (params.changes.itemSpacing !== undefined) {
          snapshots.push({ nodeId, property: "itemSpacing", previousValue: frameNode.itemSpacing });
          frameNode.itemSpacing = params.changes.itemSpacing;
        }
      }

      // ============================================
      // TRANSFORM PROPERTIES (Phase 1.4)
      // ============================================
      if (params.changes.flipHorizontal !== undefined || params.changes.flipVertical !== undefined) {
        // Figma uses a transformation matrix for flipping
        // Get current transform or use identity
        const currentTransform = "relativeTransform" in sceneNode
          ? [...(sceneNode as LayoutMixin).relativeTransform]
          : [[1, 0, 0], [0, 1, 0]] as Transform;

        if (params.changes.flipHorizontal) {
          // Flip horizontally by negating the x scale
          currentTransform[0][0] *= -1;
        }
        if (params.changes.flipVertical) {
          // Flip vertically by negating the y scale
          currentTransform[1][1] *= -1;
        }

        if ("relativeTransform" in sceneNode) {
          (sceneNode as LayoutMixin).relativeTransform = currentTransform as Transform;
        }
      }

      // ============================================
      // EFFECTS (Phase 3.3)
      // ============================================
      if ("effects" in sceneNode) {
        const blendNode = sceneNode as BlendMixin;

        // Clear effect style before making effect changes
        if ((params.changes.clearEffects || params.changes.addDropShadow || params.changes.addBlur) &&
            "setEffectStyleIdAsync" in blendNode) {
          await (blendNode as any).setEffectStyleIdAsync("");
        }

        // Clear all effects
        if (params.changes.clearEffects) {
          snapshots.push({ nodeId, property: "effects", previousValue: blendNode.effects });
          blendNode.effects = [];
        }

        // Add drop shadow (preset or custom)
        if (params.changes.addDropShadow) {
          snapshots.push({ nodeId, property: "effects", previousValue: [...blendNode.effects] });

          let shadowConfig: typeof shadowPresets.small;
          if (typeof params.changes.addDropShadow === "string") {
            shadowConfig = shadowPresets[params.changes.addDropShadow];
          } else {
            shadowConfig = params.changes.addDropShadow;
          }

          const shadowEffect: DropShadowEffect = {
            type: "DROP_SHADOW",
            color: shadowConfig.color,
            offset: shadowConfig.offset,
            radius: shadowConfig.blur,
            spread: shadowConfig.spread,
            visible: true,
            blendMode: "NORMAL",
          };

          blendNode.effects = [...blendNode.effects, shadowEffect];
        }

        // Add blur
        if (params.changes.addBlur !== undefined) {
          snapshots.push({ nodeId, property: "effects", previousValue: [...blendNode.effects] });

          const blurEffect: BlurEffect = {
            type: "LAYER_BLUR",
            radius: params.changes.addBlur,
            visible: true,
          };

          blendNode.effects = [...blendNode.effects, blurEffect];
        }
      }

      results.push({ nodeId, success: true });
    } catch (e) {
      results.push({
        nodeId,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Store snapshots for undo
  lastOperationSnapshot = snapshots;

  return {
    success: true,
    results,
    modifiedCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
  };
}

// ============================================
// EDIT COMPONENT - Modify master component
// ============================================

async function editComponent(params: {
  componentId: string;
  changes: {
    fillColor?: { r: number; g: number; b: number };
    strokeColor?: { r: number; g: number; b: number };
    strokeWeight?: number;
    opacity?: number;
    cornerRadius?: number;
    name?: string;
  };
  childChanges?: Array<{
    childName?: string;
    childType?: string;
    fillColor?: { r: number; g: number; b: number };
    text?: string;
    fontSize?: number;
  }>;
}) {
  const node = await figma.getNodeByIdAsync(params.componentId);

  if (!node) {
    throw new Error("Component not found");
  }

  if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
    throw new Error("Node is not a component or component set");
  }

  const component = node as ComponentNode | ComponentSetNode;

  // Apply component-level changes
  if (params.changes.name) {
    component.name = params.changes.name;
  }

  if (params.changes.fillColor && "fills" in component) {
    (component as GeometryMixin).fills = [
      { type: "SOLID", color: params.changes.fillColor },
    ];
  }

  if (params.changes.strokeColor && "strokes" in component) {
    (component as GeometryMixin).strokes = [
      { type: "SOLID", color: params.changes.strokeColor },
    ];
  }

  if (params.changes.strokeWeight !== undefined && "strokeWeight" in component) {
    (component as GeometryMixin).strokeWeight = params.changes.strokeWeight;
  }

  if (params.changes.opacity !== undefined) {
    component.opacity = params.changes.opacity;
  }

  if (params.changes.cornerRadius !== undefined && "cornerRadius" in component) {
    (component as any).cornerRadius = params.changes.cornerRadius;
  }

  // Apply child changes
  const childResults: Array<{ name: string; success: boolean; error?: string }> = [];

  if (params.childChanges && "findAll" in component) {
    for (const childChange of params.childChanges) {
      const matchingChildren = (component as ChildrenMixin).findAll((child) => {
        if (childChange.childName && child.name !== childChange.childName) return false;
        if (childChange.childType && child.type !== childChange.childType) return false;
        return true;
      });

      for (const child of matchingChildren) {
        try {
          if (childChange.fillColor && "fills" in child) {
            (child as GeometryMixin).fills = [
              { type: "SOLID", color: childChange.fillColor },
            ];
          }

          if (childChange.text && child.type === "TEXT") {
            const textNode = child as TextNode;
            await ensureFontLoaded(textNode.fontName as FontName);
            textNode.characters = childChange.text;
          }

          if (childChange.fontSize && child.type === "TEXT") {
            const textNode = child as TextNode;
            await ensureFontLoaded(textNode.fontName as FontName);
            textNode.fontSize = childChange.fontSize;
          }

          childResults.push({ name: child.name, success: true });
        } catch (e) {
          childResults.push({
            name: child.name,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
  }

  // Count instances that will be affected
  let instanceCount = 0;
  if (node.type === "COMPONENT") {
    // Find instances on current page
    figma.currentPage.findAll((n) => {
      if (n.type === "INSTANCE" && (n as InstanceNode).mainComponent?.id === node.id) {
        instanceCount++;
      }
      return false;
    });
  }

  return {
    success: true,
    componentId: component.id,
    componentName: component.name,
    componentType: component.type,
    childResults,
    instancesAffected: instanceCount,
  };
}

// ============================================
// ANALYZE NODE - Get layout context information
// ============================================

async function analyzeNode(params: { nodeId: string }) {
  const node = await figma.getNodeByIdAsync(params.nodeId);

  if (!node) {
    throw new Error("Node not found");
  }

  const sceneNode = node as SceneNode;
  const parent = node.parent;

  // Check if parent has auto-layout
  let parentLayout: any = null;
  if (parent && "layoutMode" in parent) {
    const layoutParent = parent as FrameNode;
    parentLayout = {
      mode: layoutParent.layoutMode,
      spacing: layoutParent.itemSpacing,
      padding: {
        top: layoutParent.paddingTop,
        right: layoutParent.paddingRight,
        bottom: layoutParent.paddingBottom,
        left: layoutParent.paddingLeft,
      },
      alignment: layoutParent.primaryAxisAlignItems,
      counterAlignment: layoutParent.counterAxisAlignItems,
    };
  }

  // Check node's own layout (if it's a frame)
  let ownLayout: any = null;
  if ("layoutMode" in sceneNode) {
    const frameNode = sceneNode as FrameNode;
    ownLayout = {
      mode: frameNode.layoutMode,
      spacing: frameNode.itemSpacing,
      padding: {
        top: frameNode.paddingTop,
        right: frameNode.paddingRight,
        bottom: frameNode.paddingBottom,
        left: frameNode.paddingLeft,
      },
    };
  }

  // Check sizing mode
  let sizing: any = null;
  if ("layoutSizingHorizontal" in sceneNode) {
    sizing = {
      horizontal: (sceneNode as FrameNode).layoutSizingHorizontal,
      vertical: (sceneNode as FrameNode).layoutSizingVertical,
    };
  }

  // Check constraints
  let constraints: any = null;
  if ("constraints" in sceneNode) {
    constraints = (sceneNode as ConstraintMixin).constraints;
  }

  // Determine if position is manually controllable
  const canMove = !parentLayout || parentLayout.mode === "NONE";

  return {
    success: true,
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    position: { x: sceneNode.x, y: sceneNode.y },
    size: { width: sceneNode.width, height: sceneNode.height },
    parent: parent
      ? {
          id: parent.id,
          name: parent.name,
          type: parent.type,
        }
      : null,
    parentLayout,
    ownLayout,
    sizing,
    constraints,
    canMove,
    isComponent: node.type === "COMPONENT",
    isInstance: node.type === "INSTANCE",
    isComponentSet: node.type === "COMPONENT_SET",
    mainComponentId:
      node.type === "INSTANCE" ? (node as InstanceNode).mainComponent?.id : null,
  };
}

// ============================================
// SET TEXT RANGE - Range-based text styling (Phase 2)
// ============================================

async function setTextRange(params: {
  nodeId: string;
  start: number;
  end: number;
  properties: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fillColor?: { r: number; g: number; b: number };
    textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
    letterSpacing?: number;
  };
}) {
  const node = await figma.getNodeByIdAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (node.type !== "TEXT") {
    throw new Error("Node is not a text node");
  }

  const textNode = node as TextNode;
  const { start, end, properties } = params;

  // Validate range
  if (start < 0 || end > textNode.characters.length || start >= end) {
    throw new Error(`Invalid range: start=${start}, end=${end}, textLength=${textNode.characters.length}`);
  }

  // Clear text style for the range before making changes
  if ("setTextStyleIdAsync" in textNode) {
    await (textNode as any).setTextStyleIdAsync("");
  }

  // Apply font size to range
  if (properties.fontSize !== undefined) {
    // Need to load fonts for all segments first
    const currentFont = textNode.getRangeFontName(start, end);
    if (currentFont !== figma.mixed) {
      await ensureFontLoaded(currentFont);
    }
    textNode.setRangeFontSize(start, end, properties.fontSize);
  }

  // Apply font family/weight to range
  if (properties.fontFamily !== undefined || properties.fontWeight !== undefined) {
    const currentFont = textNode.getRangeFontName(start, end);
    let baseFont: FontName;
    if (currentFont === figma.mixed) {
      baseFont = { family: "Inter", style: "Regular" };
    } else {
      baseFont = currentFont;
    }

    const newFont: FontName = {
      family: properties.fontFamily ?? baseFont.family,
      style: properties.fontWeight ?? baseFont.style,
    };
    await ensureFontLoaded(newFont);
    textNode.setRangeFontName(start, end, newFont);
  }

  // Apply fill color to range
  if (properties.fillColor !== undefined) {
    textNode.setRangeFills(start, end, [
      { type: "SOLID", color: properties.fillColor },
    ]);
  }

  // Apply text decoration to range
  if (properties.textDecoration !== undefined) {
    textNode.setRangeTextDecoration(start, end, properties.textDecoration);
  }

  // Apply letter spacing to range
  if (properties.letterSpacing !== undefined) {
    textNode.setRangeLetterSpacing(start, end, { value: properties.letterSpacing, unit: "PIXELS" });
  }

  return {
    success: true,
    nodeId: textNode.id,
    range: { start, end },
    appliedProperties: Object.keys(properties),
  };
}

// ============================================
// SHADOW PRESETS (Phase 3.1)
// ============================================

async function addShadowPreset(params: {
  nodeId: string;
  preset: "small" | "medium" | "large" | "xl";
}) {
  const node = await figma.getNodeByIdAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (!("effects" in node)) {
    throw new Error("Node does not support effects");
  }

  const blendNode = node as SceneNode & BlendMixin;

  // Clear effect style before making changes
  if ("setEffectStyleIdAsync" in blendNode) {
    await (blendNode as any).setEffectStyleIdAsync("");
  }

  const config = shadowPresets[params.preset];
  const shadowEffect: DropShadowEffect = {
    type: "DROP_SHADOW",
    color: config.color,
    offset: config.offset,
    radius: config.blur,
    spread: config.spread,
    visible: true,
    blendMode: "NORMAL",
  };

  blendNode.effects = [...blendNode.effects, shadowEffect];

  return {
    success: true,
    nodeId: node.id,
    preset: params.preset,
    effectCount: blendNode.effects.length,
  };
}

// ============================================
// CLEAR EFFECTS (Phase 3.2)
// ============================================

async function clearEffects(params: {
  nodeId: string;
  type?: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
}) {
  const node = await figma.getNodeByIdAsync(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if (!("effects" in node)) {
    throw new Error("Node does not support effects");
  }

  const blendNode = node as SceneNode & BlendMixin;

  // Clear effect style before making changes
  if ("setEffectStyleIdAsync" in blendNode) {
    await (blendNode as any).setEffectStyleIdAsync("");
  }

  const previousCount = blendNode.effects.length;

  if (params.type) {
    // Clear only specific effect type
    blendNode.effects = blendNode.effects.filter(e => e.type !== params.type);
  } else {
    // Clear all effects
    blendNode.effects = [];
  }

  return {
    success: true,
    nodeId: node.id,
    clearedType: params.type ?? "ALL",
    previousCount,
    newCount: blendNode.effects.length,
  };
}

// ============================================
// SMART SEARCH TOOLS (Phase 4)
// ============================================

// Helper function to compare colors with tolerance
function colorsMatch(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  tolerance: number
): boolean {
  return (
    Math.abs(c1.r - c2.r) <= tolerance &&
    Math.abs(c1.g - c2.g) <= tolerance &&
    Math.abs(c1.b - c2.b) <= tolerance
  );
}

// Find by color (Phase 4.1)
async function findByColor(params: {
  color: { r: number; g: number; b: number };
  tolerance?: number;
  searchFills?: boolean;
  searchStrokes?: boolean;
  parentId?: string;
  maxResults?: number;
  scopeToSelection?: boolean;
}) {
  const tolerance = params.tolerance ?? 0.1;
  const searchFills = params.searchFills !== false; // default true
  const searchStrokes = params.searchStrokes ?? false; // default false
  const maxResults = params.maxResults ?? 100;

  // Determine search roots: parentId > scopeToSelection > entire page
  let searchRoots: BaseNode[] = [];

  if (params.parentId) {
    const parent = await figma.getNodeByIdAsync(params.parentId);
    if (!parent || !("findAll" in parent)) {
      throw new Error("Parent node not found or cannot contain children");
    }
    searchRoots = [parent];
  } else if (params.scopeToSelection !== false && figma.currentPage.selection.length > 0) {
    // Default to selection for better performance on large files
    searchRoots = figma.currentPage.selection;
  } else {
    searchRoots = [figma.currentPage];
  }

  const results: Array<{
    id: string;
    name: string;
    type: string;
    matchType: "fill" | "stroke";
    matchedColor: { r: number; g: number; b: number };
  }> = [];

  for (const root of searchRoots) {
    if (results.length >= maxResults) break;
    if (!("findAll" in root)) continue;

    (root as ChildrenMixin).findAll((node) => {
      if (results.length >= maxResults) return false;

      // Check fills
      if (searchFills && "fills" in node) {
        const fills = (node as GeometryMixin).fills;
        if (Array.isArray(fills)) {
          for (const fill of fills) {
            if (fill.type === "SOLID" && colorsMatch(fill.color, params.color, tolerance)) {
              results.push({
                id: node.id,
                name: node.name,
                type: node.type,
                matchType: "fill",
                matchedColor: fill.color,
              });
              return false; // Don't add same node twice
            }
          }
        }
      }

      // Check strokes
      if (searchStrokes && "strokes" in node) {
        const strokes = (node as GeometryMixin).strokes;
        if (Array.isArray(strokes)) {
          for (const stroke of strokes) {
            if (stroke.type === "SOLID" && colorsMatch(stroke.color, params.color, tolerance)) {
              results.push({
                id: node.id,
                name: node.name,
                type: node.type,
                matchType: "stroke",
                matchedColor: stroke.color,
              });
              return false; // Don't add same node twice
            }
          }
        }
      }

      return false;
    });
  }

  return {
    success: true,
    nodes: results,
    count: results.length,
    searchedColor: params.color,
    scopedToSelection: params.scopeToSelection !== false && !params.parentId && figma.currentPage.selection.length > 0,
    tolerance,
    truncated: results.length >= maxResults,
  };
}

// Find by font (Phase 4.2)
async function findByFont(params: {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  parentId?: string;
  maxResults?: number;
  scopeToSelection?: boolean;
}) {
  const maxResults = params.maxResults ?? 100;

  // Determine search roots: parentId > scopeToSelection > entire page
  let searchRoots: BaseNode[] = [];

  if (params.parentId) {
    const parent = await figma.getNodeByIdAsync(params.parentId);
    if (!parent || !("findAll" in parent)) {
      throw new Error("Parent node not found or cannot contain children");
    }
    searchRoots = [parent];
  } else if (params.scopeToSelection !== false && figma.currentPage.selection.length > 0) {
    // Default to selection for better performance on large files
    searchRoots = figma.currentPage.selection;
  } else {
    searchRoots = [figma.currentPage];
  }

  const results: Array<{
    id: string;
    name: string;
    characters: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: number | "mixed";
  }> = [];

  for (const root of searchRoots) {
    if (results.length >= maxResults) break;
    if (!("findAll" in root)) continue;

    (root as ChildrenMixin).findAll((node) => {
      if (results.length >= maxResults) return false;

      if (node.type === "TEXT") {
        const textNode = node as TextNode;
        const fontName = textNode.fontName;
        const fontSize = textNode.fontSize;

        // Handle mixed fonts
        if (fontName === figma.mixed) {
          // Skip nodes with mixed fonts for simplicity, or include if no font filter
          if (!params.fontFamily && !params.fontWeight) {
            if (params.fontSize === undefined || fontSize === params.fontSize || fontSize === figma.mixed) {
              results.push({
                id: node.id,
                name: node.name,
                characters: textNode.characters.slice(0, 50) + (textNode.characters.length > 50 ? "..." : ""),
                fontFamily: "mixed",
                fontWeight: "mixed",
                fontSize: fontSize === figma.mixed ? "mixed" : fontSize,
              });
            }
          }
          return false;
        }

        // Check font family
        if (params.fontFamily && fontName.family !== params.fontFamily) {
          return false;
        }

        // Check font weight/style
        if (params.fontWeight && fontName.style !== params.fontWeight) {
          return false;
        }

        // Check font size
        if (params.fontSize !== undefined) {
          if (fontSize === figma.mixed || fontSize !== params.fontSize) {
            return false;
          }
        }

        results.push({
          id: node.id,
          name: node.name,
          characters: textNode.characters.slice(0, 50) + (textNode.characters.length > 50 ? "..." : ""),
          fontFamily: fontName.family,
          fontWeight: fontName.style,
          fontSize: fontSize === figma.mixed ? "mixed" : fontSize,
        });
      }

      return false;
    });
  }

  return {
    success: true,
    nodes: results,
    count: results.length,
    scopedToSelection: params.scopeToSelection !== false && !params.parentId && figma.currentPage.selection.length > 0,
    searchCriteria: {
      fontFamily: params.fontFamily,
      fontWeight: params.fontWeight,
      fontSize: params.fontSize,
    },
    truncated: results.length >= maxResults,
  };
}

// Find instances (Phase 4.3)
async function findInstances(params: {
  componentId?: string;
  componentName?: string;
  parentId?: string;
  maxResults?: number;
  scopeToSelection?: boolean;
}) {
  const maxResults = params.maxResults ?? 100;

  // Determine search roots: parentId > scopeToSelection > entire page
  let searchRoots: BaseNode[] = [];

  if (params.parentId) {
    const parent = await figma.getNodeByIdAsync(params.parentId);
    if (!parent || !("findAll" in parent)) {
      throw new Error("Parent node not found or cannot contain children");
    }
    searchRoots = [parent];
  } else if (params.scopeToSelection !== false && figma.currentPage.selection.length > 0) {
    // Default to selection for better performance on large files
    searchRoots = figma.currentPage.selection;
  } else {
    searchRoots = [figma.currentPage];
  }

  // If componentName is provided, find the component first
  let targetComponentId = params.componentId;
  if (!targetComponentId && params.componentName) {
    const component = figma.currentPage.findOne((n) =>
      (n.type === "COMPONENT" || n.type === "COMPONENT_SET") && n.name === params.componentName
    );
    if (component) {
      targetComponentId = component.id;
    }
  }

  const results: Array<{
    id: string;
    name: string;
    mainComponentId: string | null;
    mainComponentName: string | null;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }> = [];

  for (const root of searchRoots) {
    if (results.length >= maxResults) break;
    if (!("findAll" in root)) continue;

    (root as ChildrenMixin).findAll((node) => {
      if (results.length >= maxResults) return false;

      if (node.type === "INSTANCE") {
        const instance = node as InstanceNode;
        const mainComponent = instance.mainComponent;

        // If searching for specific component, filter
        if (targetComponentId) {
          if (!mainComponent || mainComponent.id !== targetComponentId) {
            // Also check if the main component's parent (component set) matches
            if (!mainComponent?.parent || mainComponent.parent.id !== targetComponentId) {
              return false;
            }
          }
        }

        results.push({
          id: node.id,
          name: node.name,
          mainComponentId: mainComponent?.id ?? null,
          mainComponentName: mainComponent?.name ?? null,
          position: { x: instance.x, y: instance.y },
          size: { width: instance.width, height: instance.height },
        });
      }

      return false;
    });
  }

  return {
    success: true,
    scopedToSelection: params.scopeToSelection !== false && !params.parentId && figma.currentPage.selection.length > 0,
    nodes: results,
    count: results.length,
    searchCriteria: {
      componentId: params.componentId,
      componentName: params.componentName,
    },
    truncated: results.length >= maxResults,
  };
}

// ============================================
// HANDLER REGISTRY - O(1) command dispatch
// ============================================

type CommandHandler = (params: any) => Promise<any> | any;

const commandHandlers = new Map<string, CommandHandler>([
  // Creation commands
  ["create_frame", createFrame],
  ["create_text", createText],
  ["create_rectangle", createRectangle],
  ["create_ellipse", createEllipse],
  ["create_component", createComponent],
  ["create_instance", createInstance],

  // Layout commands
  ["set_auto_layout", setAutoLayout],
  ["set_sizing_mode", setSizingMode],
  ["set_constraints", setConstraints],

  // Modification commands
  ["move_node", moveNode],
  ["resize_node", resizeNode],
  ["set_fill_color", setFillColor],
  ["add_stroke", addStroke],
  ["set_corner_radius", setCornerRadius],
  ["set_opacity", setOpacity],
  ["add_effect", addEffect],

  // Text commands
  ["set_text", setText],
  ["set_text_style", setTextStyle],

  // Organization commands
  ["reparent_node", reparentNode],
  ["duplicate_node", duplicateNode],
  ["group_nodes", groupNodes],
  ["delete_node", deleteNode],

  // Multi-node commands
  ["align_nodes", alignNodes],
  ["distribute_nodes", distributeNodes],

  // Query commands
  ["list_nodes", listNodes],
  ["get_selection", getSelection],
  ["set_selection", setSelection],
  ["zoom_to_fit", zoomToFit],

  // Template commands
  ["create_button", createButton],
  ["create_card", createCard],
  ["create_input", createInput],

  // Batch command
  ["batch", executeBatch],

  // Component set command
  ["combine_as_variants", combineAsVariants],
  ["create_variants", createVariants],

  // Component properties
  ["add_component_property", addComponentProperty],
  ["expose_as_property", exposeAsProperty],
  ["list_component_properties", listComponentProperties],

  // Export
  ["export_node", exportNode],

  // Advanced search & analysis
  ["find_nodes", findNodesFunc],
  ["get_tree", getTree],
  ["bulk_modify", bulkModify],
  ["edit_component", editComponent],
  ["analyze_node", analyzeNode],

  // New tools (Phases 2-5)
  ["set_text_range", setTextRange],
  ["add_shadow_preset", addShadowPreset],
  ["clear_effects", clearEffects],
  ["find_by_color", findByColor],
  ["find_by_font", findByFont],
  ["find_instances", findInstances],
  ["undo_last_operation", undoLastOperation],
]);

// Create a component with variants properly (no conflicts)
async function createVariants(params: {
  baseNodeId: string;
  propertyName: string;
  variants: Array<{
    name: string;
    fillColor?: { r: number; g: number; b: number };
    textColor?: { r: number; g: number; b: number };
    opacity?: number;
    strokeColor?: { r: number; g: number; b: number };
    strokeWeight?: number;
  }>;
  componentSetName?: string;
}) {
  const baseNode = await figma.getNodeByIdAsync(params.baseNodeId);
  if (!baseNode) {
    throw new Error("Base node not found");
  }

  const componentIds: string[] = [];
  const propertyName = params.propertyName;
  const baseSceneNode = baseNode as SceneNode;
  const baseX = baseSceneNode.x;
  const baseWidth = baseSceneNode.width;

  // Clone ALL variants first to avoid node destruction issues
  const clones: SceneNode[] = [];
  for (let i = 0; i < params.variants.length; i++) {
    const clone = baseSceneNode.clone();
    clone.x = baseX + (i * (baseWidth + 20));
    clones.push(clone);
  }

  // Remove the original base node since we cloned it
  baseSceneNode.remove();

  // Now process each clone
  for (let i = 0; i < params.variants.length; i++) {
    const variant = params.variants[i];
    const node = clones[i];

    // Apply variant-specific styles
    if (variant.fillColor && "fills" in node) {
      (node as GeometryMixin).fills = [{ type: "SOLID", color: variant.fillColor }];
    }

    if (variant.opacity !== undefined) {
      node.opacity = variant.opacity;
    }

    if (variant.strokeColor && "strokes" in node) {
      (node as GeometryMixin).strokes = [{ type: "SOLID", color: variant.strokeColor }];
      if (variant.strokeWeight) {
        (node as GeometryMixin).strokeWeight = variant.strokeWeight;
      }
    }

    // Apply text color to all text children if specified
    if (variant.textColor && "findAll" in node) {
      const textNodes = (node as FrameNode).findAll(n => n.type === "TEXT") as TextNode[];
      for (const textNode of textNodes) {
        textNode.fills = [{ type: "SOLID", color: variant.textColor }];
      }
    }

    // Create component with proper Property=Value naming
    const variantName = `${propertyName}=${variant.name}`;
    const component = figma.createComponentFromNode(node);
    component.name = variantName;
    componentIds.push(component.id);
  }

  // Combine all components as variants
  const components: ComponentNode[] = [];
  for (const id of componentIds) {
    const comp = await figma.getNodeByIdAsync(id);
    if (comp && comp.type === "COMPONENT") {
      components.push(comp as ComponentNode);
    }
  }

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  componentSet.name = params.componentSetName || "Component";

  // Auto-expose text properties on the component set
  // Find text nodes in the first variant and expose them
  const exposedProperties: Array<{ name: string; propertyId: string; defaultValue: string }> = [];
  const firstVariant = components[0];
  const textNodesInFirst = firstVariant.findAll(n => n.type === "TEXT") as TextNode[];

  for (const textNode of textNodesInFirst) {
    const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
    const uniquePropName = exposedProperties.find(p => p.name === propName)
      ? `${propName} ${exposedProperties.length + 1}`
      : propName;

    try {
      const propertyId = componentSet.addComponentProperty(
        uniquePropName,
        "TEXT",
        textNode.characters
      );

      // Link text nodes in ALL variants to this property
      for (const comp of components) {
        const matchingTextNodes = comp.findAll(n => n.type === "TEXT" && n.name === textNode.name) as TextNode[];
        for (const tn of matchingTextNodes) {
          tn.componentPropertyReferences = {
            ...tn.componentPropertyReferences,
            characters: propertyId,
          };
        }
      }

      exposedProperties.push({
        name: uniquePropName,
        propertyId,
        defaultValue: textNode.characters,
      });
    } catch (e) {
      // Skip if property can't be added
    }
  }

  return {
    success: true,
    componentSetId: componentSet.id,
    componentSetName: componentSet.name,
    propertyName: propertyName,
    variants: params.variants.map((v, i) => ({
      name: v.name,
      componentId: componentIds[i],
    })),
    variantCount: componentIds.length,
    exposedProperties,
  };
}

// Add a property to a component or component set
async function addComponentProperty(params: {
  componentId: string;
  propertyName: string;
  propertyType: "TEXT" | "BOOLEAN" | "INSTANCE_SWAP" | "VARIANT";
  defaultValue: string | boolean;
  variantOptions?: string[]; // For VARIANT type
}) {
  const node = await figma.getNodeByIdAsync(params.componentId);
  if (!node || (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET")) {
    throw new Error("Node is not a component or component set");
  }

  const component = node as ComponentNode | ComponentSetNode;

  let propertyId: string;

  if (params.propertyType === "VARIANT" && params.variantOptions) {
    propertyId = component.addComponentProperty(
      params.propertyName,
      "VARIANT",
      params.defaultValue as string,
      { variantOptions: params.variantOptions }
    );
  } else {
    propertyId = component.addComponentProperty(
      params.propertyName,
      params.propertyType,
      params.defaultValue
    );
  }

  return {
    success: true,
    componentId: component.id,
    propertyName: params.propertyName,
    propertyType: params.propertyType,
    propertyId,
  };
}

// Expose a layer (like text) as an editable component property
async function exposeAsProperty(params: {
  componentId: string;
  layerId: string;
  propertyName: string;
  propertyType: "TEXT" | "BOOLEAN";
}) {
  const component = await figma.getNodeByIdAsync(params.componentId);
  if (!component || (component.type !== "COMPONENT" && component.type !== "COMPONENT_SET")) {
    throw new Error("Node is not a component or component set");
  }

  const layer = await figma.getNodeByIdAsync(params.layerId);
  if (!layer) {
    throw new Error("Layer not found");
  }

  const comp = component as ComponentNode | ComponentSetNode;

  if (params.propertyType === "TEXT") {
    if (layer.type !== "TEXT") {
      throw new Error("Layer is not a text node");
    }
    // Add text property with current text as default
    const textNode = layer as TextNode;
    const propertyId = comp.addComponentProperty(
      params.propertyName,
      "TEXT",
      textNode.characters
    );
    // Link the text layer to this property
    textNode.componentPropertyReferences = {
      ...textNode.componentPropertyReferences,
      characters: propertyId,
    };

    return {
      success: true,
      componentId: comp.id,
      layerId: layer.id,
      propertyName: params.propertyName,
      propertyType: "TEXT",
      propertyId,
      defaultValue: textNode.characters,
    };
  } else if (params.propertyType === "BOOLEAN") {
    // Add boolean property for visibility
    const propertyId = comp.addComponentProperty(
      params.propertyName,
      "BOOLEAN",
      layer.visible
    );
    // Link layer visibility to this property
    (layer as SceneNode).componentPropertyReferences = {
      ...(layer as SceneNode).componentPropertyReferences,
      visible: propertyId,
    };

    return {
      success: true,
      componentId: comp.id,
      layerId: layer.id,
      propertyName: params.propertyName,
      propertyType: "BOOLEAN",
      propertyId,
      defaultValue: layer.visible,
    };
  }

  throw new Error("Unsupported property type");
}

// List all properties on a component
async function listComponentProperties(params: { componentId: string }) {
  const node = await figma.getNodeByIdAsync(params.componentId);
  if (!node || (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET")) {
    throw new Error("Node is not a component or component set");
  }

  const component = node as ComponentNode | ComponentSetNode;
  const properties = component.componentPropertyDefinitions;

  const propertyList = Object.entries(properties).map(([key, def]) => ({
    id: key,
    name: def.type === "VARIANT" ? key : key.split("#")[0],
    type: def.type,
    defaultValue: def.defaultValue,
    variantOptions: def.type === "VARIANT" ? def.variantOptions : undefined,
  }));

  return {
    success: true,
    componentId: component.id,
    componentName: component.name,
    properties: propertyList,
    count: propertyList.length,
  };
}

async function combineAsVariants(params: {
  componentIds: string[];
  name?: string;
}) {
  const components: ComponentNode[] = [];

  for (const id of params.componentIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node && node.type === "COMPONENT") {
      components.push(node as ComponentNode);
    }
  }

  if (components.length < 2) {
    throw new Error("Need at least 2 components to combine as variants");
  }

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  if (params.name) {
    componentSet.name = params.name;
  }

  // Auto-expose text properties on the component set
  const exposedProperties: Array<{ name: string; propertyId: string; defaultValue: string }> = [];
  const firstVariant = components[0];
  const textNodesInFirst = firstVariant.findAll(n => n.type === "TEXT") as TextNode[];

  for (const textNode of textNodesInFirst) {
    const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
    const uniquePropName = exposedProperties.find(p => p.name === propName)
      ? `${propName} ${exposedProperties.length + 1}`
      : propName;

    try {
      const propertyId = componentSet.addComponentProperty(
        uniquePropName,
        "TEXT",
        textNode.characters
      );

      // Link text nodes in ALL variants to this property
      for (const comp of components) {
        const matchingTextNodes = comp.findAll(n => n.type === "TEXT" && n.name === textNode.name) as TextNode[];
        for (const tn of matchingTextNodes) {
          tn.componentPropertyReferences = {
            ...tn.componentPropertyReferences,
            characters: propertyId,
          };
        }
      }

      exposedProperties.push({
        name: uniquePropName,
        propertyId,
        defaultValue: textNode.characters,
      });
    } catch (e) {
      // Skip if property can't be added
    }
  }

  return {
    success: true,
    componentSetId: componentSet.id,
    name: componentSet.name,
    variantCount: components.length,
    exposedProperties,
  };
}

// ============================================
// MESSAGE HANDLER - Main entry point
// ============================================

figma.ui.onmessage = async (msg: { id: string; command: string; params: any }) => {
  const { id, command, params } = msg;

  try {
    const handler = commandHandlers.get(command);

    if (!handler) {
      throw new Error(`Unknown command: ${command}`);
    }

    const result = await handler(params);
    figma.ui.postMessage({ id, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({ id, error: errorMessage });
  }
};
