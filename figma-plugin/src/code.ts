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

function findNode(nodeId: string): SceneNode | null {
  return figma.currentPage.findOne((n) => n.id === nodeId) as SceneNode | null;
}

function getParent(parentId?: string): FrameNode | GroupNode | PageNode {
  if (parentId) {
    const parent = findNode(parentId);
    if (parent && "appendChild" in parent) {
      return parent as FrameNode | GroupNode;
    }
  }
  return figma.currentPage;
}

// Bulk node lookup for multi-node operations
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

  const parent = getParent(params.parentId);
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

  const parent = getParent(params.parentId);
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

  const parent = getParent(params.parentId);
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

  const parent = getParent(params.parentId);
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
  const node = findNode(params.nodeId);
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
    const node = findNode(params.fromNodeId);
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
  const component = findNode(params.componentId);
  if (!component || component.type !== "COMPONENT") {
    throw new Error("Component not found");
  }

  const instance = (component as ComponentNode).createInstance();
  instance.x = params.x ?? 0;
  instance.y = params.y ?? 0;

  if (params.parentId) {
    const parent = getParent(params.parentId);
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

function listNodes(params: { parentId?: string }) {
  let nodes: readonly SceneNode[];

  if (params.parentId) {
    const parent = findNode(params.parentId);
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

function deleteNode(params: { nodeId: string }) {
  const node = findNode(params.nodeId);
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

function moveNode(params: { nodeId: string; x: number; y: number }) {
  const node = findNode(params.nodeId);
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

function resizeNode(params: { nodeId: string; width: number; height: number }) {
  const node = findNode(params.nodeId);
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

function setFillColor(params: {
  nodeId: string;
  color: { r: number; g: number; b: number };
}) {
  const node = findNode(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  if ("fills" in node) {
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

function addStroke(params: {
  nodeId: string;
  color: { r: number; g: number; b: number };
  weight?: number;
}) {
  const node = findNode(params.nodeId);
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

function setSelection(params: { nodeIds: string[] }) {
  const nodeMap = findNodes(params.nodeIds);
  const nodes = params.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is SceneNode => n !== undefined);

  figma.currentPage.selection = nodes;

  return {
    success: true,
    selectedCount: nodes.length,
  };
}

function zoomToFit(params: { nodeIds?: string[] }) {
  let nodes: readonly SceneNode[];

  if (params.nodeIds && params.nodeIds.length > 0) {
    const nodeMap = findNodes(params.nodeIds);
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

function setCornerRadius(params: { nodeId: string; radius: number }) {
  const node = findNode(params.nodeId);
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

function reparentNode(params: { nodeId: string; newParentId: string; index?: number }) {
  const node = findNode(params.nodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const newParent = findNode(params.newParentId);
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

function setSizingMode(params: {
  nodeId: string;
  horizontal?: "FIXED" | "FILL" | "HUG";
  vertical?: "FIXED" | "FILL" | "HUG";
}) {
  const node = findNode(params.nodeId);
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
  const node = findNode(params.nodeId);
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

function setConstraints(params: {
  nodeId: string;
  horizontal?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
  vertical?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
}) {
  const node = findNode(params.nodeId);
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

function duplicateNode(params: { nodeId: string; offsetX?: number; offsetY?: number }) {
  const node = findNode(params.nodeId);
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

function groupNodes(params: { nodeIds: string[]; name?: string }) {
  const nodeMap = findNodes(params.nodeIds);
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

function alignNodes(params: {
  nodeIds: string[];
  alignment: "LEFT" | "CENTER_H" | "RIGHT" | "TOP" | "CENTER_V" | "BOTTOM";
}) {
  const nodeMap = findNodes(params.nodeIds);
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

function distributeNodes(params: {
  nodeIds: string[];
  direction: "HORIZONTAL" | "VERTICAL";
  spacing?: number;
}) {
  const nodeMap = findNodes(params.nodeIds);
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

function setOpacity(params: { nodeId: string; opacity: number }) {
  const node = findNode(params.nodeId);
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

function addEffect(params: {
  nodeId: string;
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}) {
  const node = findNode(params.nodeId);
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
  const node = findNode(params.nodeId);
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

  const parent = getParent(params.parentId);
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

  const parent = getParent(params.parentId);
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

  const parent = getParent(params.parentId);
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
