// Figma Plugin Code - Handles design operations

figma.showUI(__html__, { width: 350, height: 400 });

// Handle messages from the UI (which receives WebSocket commands)
figma.ui.onmessage = async (msg: {
  id: string;
  command: string;
  params: any;
}) => {
  const { id, command, params } = msg;

  try {
    let result: any;

    switch (command) {
      case "create_frame":
        result = await createFrame(params);
        break;
      case "create_text":
        result = await createText(params);
        break;
      case "create_rectangle":
        result = await createRectangle(params);
        break;
      case "create_ellipse":
        result = await createEllipse(params);
        break;
      case "set_auto_layout":
        result = await setAutoLayout(params);
        break;
      case "create_component":
        result = await createComponent(params);
        break;
      case "create_instance":
        result = await createInstance(params);
        break;
      case "list_nodes":
        result = listNodes(params);
        break;
      case "delete_node":
        result = deleteNode(params);
        break;
      case "move_node":
        result = moveNode(params);
        break;
      case "resize_node":
        result = resizeNode(params);
        break;
      case "set_fill_color":
        result = setFillColor(params);
        break;
      case "add_stroke":
        result = addStroke(params);
        break;
      case "get_selection":
        result = getSelection();
        break;
      case "set_selection":
        result = setSelection(params);
        break;
      case "zoom_to_fit":
        result = zoomToFit(params);
        break;
      case "set_corner_radius":
        result = setCornerRadius(params);
        break;
      case "reparent_node":
        result = reparentNode(params);
        break;
      case "set_sizing_mode":
        result = setSizingMode(params);
        break;
      case "set_text":
        result = await setText(params);
        break;
      case "set_constraints":
        result = setConstraints(params);
        break;
      case "duplicate_node":
        result = duplicateNode(params);
        break;
      case "group_nodes":
        result = groupNodes(params);
        break;
      case "align_nodes":
        result = alignNodes(params);
        break;
      case "distribute_nodes":
        result = distributeNodes(params);
        break;
      case "set_opacity":
        result = setOpacity(params);
        break;
      case "add_effect":
        result = addEffect(params);
        break;
      case "set_text_style":
        result = await setTextStyle(params);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    figma.ui.postMessage({ id, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({ id, error: errorMessage });
  }
};

// Helper to find node by ID
function findNode(nodeId: string): SceneNode | null {
  return figma.currentPage.findOne((n) => n.id === nodeId) as SceneNode | null;
}

// Helper to get parent for appending
function getParent(parentId?: string): (FrameNode | GroupNode | PageNode) {
  if (parentId) {
    const parent = findNode(parentId);
    if (parent && ("appendChild" in parent)) {
      return parent as FrameNode | GroupNode;
    }
  }
  return figma.currentPage;
}

// Tool implementations

async function createFrame(params: {
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: { r: number; g: number; b: number };
}) {
  const frame = figma.createFrame();
  frame.name = params.name;
  frame.x = params.x ?? 0;
  frame.y = params.y ?? 0;
  frame.resize(params.width ?? 400, params.height ?? 300);

  if (params.fillColor) {
    frame.fills = [{ type: "SOLID", color: params.fillColor }];
  }

  figma.currentPage.appendChild(frame);

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

  // Load font before setting text
  const fontWeight = params.fontWeight ?? "Regular";
  await figma.loadFontAsync({ family: "Inter", style: fontWeight });

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

  return {
    success: true,
    nodeId: component.id,
    name: component.name,
    type: component.type,
    size: { width: component.width, height: component.height },
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
  const nodes: SceneNode[] = [];
  for (const id of params.nodeIds) {
    const node = findNode(id);
    if (node) {
      nodes.push(node);
    }
  }

  figma.currentPage.selection = nodes;

  return {
    success: true,
    selectedCount: nodes.length,
  };
}

function zoomToFit(params: { nodeIds?: string[] }) {
  let nodes: readonly SceneNode[];

  if (params.nodeIds && params.nodeIds.length > 0) {
    nodes = params.nodeIds
      .map((id) => findNode(id))
      .filter((n): n is SceneNode => n !== null);
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
  vertical?: "FIXED" | "FILL" | "HUG"
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

  // Load the current font before changing text
  await figma.loadFontAsync(textNode.fontName as FontName);
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
  const nodes: SceneNode[] = [];
  for (const id of params.nodeIds) {
    const node = findNode(id);
    if (node) {
      nodes.push(node);
    }
  }

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
  const nodes: SceneNode[] = [];
  for (const id of params.nodeIds) {
    const node = findNode(id);
    if (node) {
      nodes.push(node);
    }
  }

  if (nodes.length < 2) {
    throw new Error("Need at least 2 nodes to align");
  }

  // Calculate bounds
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
  const nodes: SceneNode[] = [];
  for (const id of params.nodeIds) {
    const node = findNode(id);
    if (node) {
      nodes.push(node);
    }
  }

  if (nodes.length < 2) {
    throw new Error("Need at least 2 nodes to distribute");
  }

  // Sort by position
  if (params.direction === "HORIZONTAL") {
    nodes.sort((a, b) => a.x - b.x);
  } else {
    nodes.sort((a, b) => a.y - b.y);
  }

  if (params.spacing !== undefined) {
    // Fixed spacing
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
    // Equal distribution
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
  await figma.loadFontAsync(textNode.fontName as FontName);

  if (params.textAlign) {
    textNode.textAlignHorizontal = params.textAlign;
  }

  if (params.lineHeight !== undefined) {
    if (params.lineHeight < 10) {
      // Percentage
      textNode.lineHeight = { value: params.lineHeight * 100, unit: "PERCENT" };
    } else {
      // Pixels
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
