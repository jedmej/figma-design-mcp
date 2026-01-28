"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/code.ts
  figma.showUI(__html__, { width: 350, height: 400 });
  figma.ui.onmessage = (msg) => __async(void 0, null, function* () {
    const { id, command, params } = msg;
    try {
      let result;
      switch (command) {
        case "create_frame":
          result = yield createFrame(params);
          break;
        case "create_text":
          result = yield createText(params);
          break;
        case "create_rectangle":
          result = yield createRectangle(params);
          break;
        case "create_ellipse":
          result = yield createEllipse(params);
          break;
        case "set_auto_layout":
          result = yield setAutoLayout(params);
          break;
        case "create_component":
          result = yield createComponent(params);
          break;
        case "create_instance":
          result = yield createInstance(params);
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
          result = yield setText(params);
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
          result = yield setTextStyle(params);
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }
      figma.ui.postMessage({ id, result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      figma.ui.postMessage({ id, error: errorMessage });
    }
  });
  function findNode(nodeId) {
    return figma.currentPage.findOne((n) => n.id === nodeId);
  }
  function getParent(parentId) {
    if (parentId) {
      const parent = findNode(parentId);
      if (parent && "appendChild" in parent) {
        return parent;
      }
    }
    return figma.currentPage;
  }
  function createFrame(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const frame = figma.createFrame();
      frame.name = params.name;
      frame.x = (_a = params.x) != null ? _a : 0;
      frame.y = (_b = params.y) != null ? _b : 0;
      frame.resize((_c = params.width) != null ? _c : 400, (_d = params.height) != null ? _d : 300);
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
        size: { width: frame.width, height: frame.height }
      };
    });
  }
  function createText(params) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      const textNode = figma.createText();
      const fontWeight = (_a = params.fontWeight) != null ? _a : "Regular";
      yield figma.loadFontAsync({ family: "Inter", style: fontWeight });
      textNode.fontName = { family: "Inter", style: fontWeight };
      textNode.characters = params.text;
      textNode.x = (_b = params.x) != null ? _b : 0;
      textNode.y = (_c = params.y) != null ? _c : 0;
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
        position: { x: textNode.x, y: textNode.y }
      };
    });
  }
  function createRectangle(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e;
      const rect = figma.createRectangle();
      rect.name = (_a = params.name) != null ? _a : "Rectangle";
      rect.x = (_b = params.x) != null ? _b : 0;
      rect.y = (_c = params.y) != null ? _c : 0;
      rect.resize((_d = params.width) != null ? _d : 100, (_e = params.height) != null ? _e : 100);
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
        size: { width: rect.width, height: rect.height }
      };
    });
  }
  function createEllipse(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e;
      const ellipse = figma.createEllipse();
      ellipse.name = (_a = params.name) != null ? _a : "Ellipse";
      ellipse.x = (_b = params.x) != null ? _b : 0;
      ellipse.y = (_c = params.y) != null ? _c : 0;
      const w = (_d = params.width) != null ? _d : 100;
      ellipse.resize(w, (_e = params.height) != null ? _e : w);
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
        size: { width: ellipse.width, height: ellipse.height }
      };
    });
  }
  function setAutoLayout(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f;
      const node = findNode(params.nodeId);
      if (!node || node.type !== "FRAME") {
        throw new Error("Node not found or not a frame");
      }
      const frame = node;
      frame.layoutMode = (_a = params.direction) != null ? _a : "VERTICAL";
      frame.itemSpacing = (_b = params.spacing) != null ? _b : 10;
      frame.paddingTop = (_c = params.padding) != null ? _c : 20;
      frame.paddingRight = (_d = params.padding) != null ? _d : 20;
      frame.paddingBottom = (_e = params.padding) != null ? _e : 20;
      frame.paddingLeft = (_f = params.padding) != null ? _f : 20;
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
        itemSpacing: frame.itemSpacing
      };
    });
  }
  function createComponent(params) {
    return __async(this, null, function* () {
      var _a, _b;
      let component;
      if (params.fromNodeId) {
        const node = findNode(params.fromNodeId);
        if (!node) {
          throw new Error("Node not found");
        }
        component = figma.createComponentFromNode(node);
      } else {
        component = figma.createComponent();
        component.resize((_a = params.width) != null ? _a : 200, (_b = params.height) != null ? _b : 100);
      }
      component.name = params.name;
      return {
        success: true,
        nodeId: component.id,
        name: component.name,
        type: component.type,
        size: { width: component.width, height: component.height }
      };
    });
  }
  function createInstance(params) {
    return __async(this, null, function* () {
      var _a, _b;
      const component = findNode(params.componentId);
      if (!component || component.type !== "COMPONENT") {
        throw new Error("Component not found");
      }
      const instance = component.createInstance();
      instance.x = (_a = params.x) != null ? _a : 0;
      instance.y = (_b = params.y) != null ? _b : 0;
      if (params.parentId) {
        const parent = getParent(params.parentId);
        parent.appendChild(instance);
      }
      return {
        success: true,
        nodeId: instance.id,
        componentId: params.componentId,
        type: instance.type,
        position: { x: instance.x, y: instance.y }
      };
    });
  }
  function listNodes(params) {
    let nodes;
    if (params.parentId) {
      const parent = findNode(params.parentId);
      if (parent && "children" in parent) {
        nodes = parent.children;
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
      size: { width: node.width, height: node.height }
    }));
    return {
      success: true,
      nodes: nodeList,
      count: nodeList.length
    };
  }
  function deleteNode(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    const name = node.name;
    node.remove();
    return {
      success: true,
      deletedNodeId: params.nodeId,
      deletedName: name
    };
  }
  function moveNode(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    node.x = params.x;
    node.y = params.y;
    return {
      success: true,
      nodeId: node.id,
      newPosition: { x: node.x, y: node.y }
    };
  }
  function resizeNode(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if ("resize" in node) {
      node.resize(params.width, params.height);
    } else {
      throw new Error("Node cannot be resized");
    }
    return {
      success: true,
      nodeId: node.id,
      newSize: { width: node.width, height: node.height }
    };
  }
  function setFillColor(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if ("fills" in node) {
      node.fills = [{ type: "SOLID", color: params.color }];
    } else {
      throw new Error("Node does not support fills");
    }
    return {
      success: true,
      nodeId: node.id,
      color: params.color
    };
  }
  function addStroke(params) {
    var _a, _b;
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if ("strokes" in node) {
      node.strokes = [{ type: "SOLID", color: params.color }];
      node.strokeWeight = (_a = params.weight) != null ? _a : 1;
    } else {
      throw new Error("Node does not support strokes");
    }
    return {
      success: true,
      nodeId: node.id,
      strokeColor: params.color,
      strokeWeight: (_b = params.weight) != null ? _b : 1
    };
  }
  function getSelection() {
    const selection = figma.currentPage.selection;
    return {
      success: true,
      selection: selection.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type
      })),
      count: selection.length
    };
  }
  function setSelection(params) {
    const nodes = [];
    for (const id of params.nodeIds) {
      const node = findNode(id);
      if (node) {
        nodes.push(node);
      }
    }
    figma.currentPage.selection = nodes;
    return {
      success: true,
      selectedCount: nodes.length
    };
  }
  function zoomToFit(params) {
    let nodes;
    if (params.nodeIds && params.nodeIds.length > 0) {
      nodes = params.nodeIds.map((id) => findNode(id)).filter((n) => n !== null);
    } else {
      nodes = figma.currentPage.selection;
    }
    if (nodes.length > 0) {
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    return {
      success: true,
      zoomedToNodes: nodes.length
    };
  }
  function setCornerRadius(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if ("cornerRadius" in node) {
      node.cornerRadius = params.radius;
    } else {
      throw new Error("Node does not support corner radius");
    }
    return {
      success: true,
      nodeId: node.id,
      cornerRadius: params.radius
    };
  }
  function reparentNode(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    const newParent = findNode(params.newParentId);
    if (!newParent || !("appendChild" in newParent)) {
      throw new Error("New parent not found or cannot contain children");
    }
    const parent = newParent;
    if (params.index !== void 0) {
      parent.insertChild(params.index, node);
    } else {
      parent.appendChild(node);
    }
    return {
      success: true,
      nodeId: node.id,
      newParentId: parent.id,
      newParentName: parent.name
    };
  }
  function setSizingMode(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if (!("layoutSizingHorizontal" in node)) {
      throw new Error("Node does not support sizing modes");
    }
    const frameNode = node;
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
      verticalSizing: frameNode.layoutSizingVertical
    };
  }
  function setText(params) {
    return __async(this, null, function* () {
      const node = findNode(params.nodeId);
      if (!node) {
        throw new Error("Node not found");
      }
      if (node.type !== "TEXT") {
        throw new Error("Node is not a text node");
      }
      const textNode = node;
      yield figma.loadFontAsync(textNode.fontName);
      textNode.characters = params.text;
      return {
        success: true,
        nodeId: node.id,
        text: params.text
      };
    });
  }
  function setConstraints(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if (params.horizontal) {
      node.constraints = __spreadProps(__spreadValues({}, node.constraints), { horizontal: params.horizontal });
    }
    if (params.vertical) {
      node.constraints = __spreadProps(__spreadValues({}, node.constraints), { vertical: params.vertical });
    }
    return {
      success: true,
      nodeId: node.id,
      constraints: node.constraints
    };
  }
  function duplicateNode(params) {
    var _a, _b;
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    const clone = node.clone();
    clone.x = node.x + ((_a = params.offsetX) != null ? _a : 20);
    clone.y = node.y + ((_b = params.offsetY) != null ? _b : 20);
    return {
      success: true,
      originalId: node.id,
      newNodeId: clone.id,
      name: clone.name,
      position: { x: clone.x, y: clone.y }
    };
  }
  function groupNodes(params) {
    var _a;
    const nodes = [];
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
    group.name = (_a = params.name) != null ? _a : "Group";
    return {
      success: true,
      groupId: group.id,
      name: group.name,
      childCount: nodes.length
    };
  }
  function alignNodes(params) {
    const nodes = [];
    for (const id of params.nodeIds) {
      const node = findNode(id);
      if (node) {
        nodes.push(node);
      }
    }
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
      alignment: params.alignment
    };
  }
  function distributeNodes(params) {
    const nodes = [];
    for (const id of params.nodeIds) {
      const node = findNode(id);
      if (node) {
        nodes.push(node);
      }
    }
    if (nodes.length < 2) {
      throw new Error("Need at least 2 nodes to distribute");
    }
    if (params.direction === "HORIZONTAL") {
      nodes.sort((a, b) => a.x - b.x);
    } else {
      nodes.sort((a, b) => a.y - b.y);
    }
    if (params.spacing !== void 0) {
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
        const totalWidth = last.x + last.width - first.x;
        const nodesWidth = nodes.reduce((sum, n) => sum + n.width, 0);
        const gap = (totalWidth - nodesWidth) / (nodes.length - 1);
        let currentX = first.x;
        for (const node of nodes) {
          node.x = currentX;
          currentX += node.width + gap;
        }
      } else {
        const totalHeight = last.y + last.height - first.y;
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
      direction: params.direction
    };
  }
  function setOpacity(params) {
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    node.opacity = Math.max(0, Math.min(1, params.opacity));
    return {
      success: true,
      nodeId: node.id,
      opacity: node.opacity
    };
  }
  function addEffect(params) {
    var _a, _b, _c, _d, _e;
    const node = findNode(params.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }
    if (!("effects" in node)) {
      throw new Error("Node does not support effects");
    }
    let effect;
    if (params.type === "DROP_SHADOW" || params.type === "INNER_SHADOW") {
      effect = {
        type: params.type,
        color: (_a = params.color) != null ? _a : { r: 0, g: 0, b: 0, a: 0.25 },
        offset: (_b = params.offset) != null ? _b : { x: 0, y: 4 },
        radius: (_c = params.radius) != null ? _c : 8,
        spread: (_d = params.spread) != null ? _d : 0,
        visible: true,
        blendMode: "NORMAL"
      };
    } else {
      effect = {
        type: params.type,
        radius: (_e = params.radius) != null ? _e : 8,
        visible: true
      };
    }
    const blendNode = node;
    blendNode.effects = [...blendNode.effects, effect];
    return {
      success: true,
      nodeId: node.id,
      effectType: params.type,
      effectCount: blendNode.effects.length
    };
  }
  function setTextStyle(params) {
    return __async(this, null, function* () {
      const node = findNode(params.nodeId);
      if (!node) {
        throw new Error("Node not found");
      }
      if (node.type !== "TEXT") {
        throw new Error("Node is not a text node");
      }
      const textNode = node;
      yield figma.loadFontAsync(textNode.fontName);
      if (params.textAlign) {
        textNode.textAlignHorizontal = params.textAlign;
      }
      if (params.lineHeight !== void 0) {
        if (params.lineHeight < 10) {
          textNode.lineHeight = { value: params.lineHeight * 100, unit: "PERCENT" };
        } else {
          textNode.lineHeight = { value: params.lineHeight, unit: "PIXELS" };
        }
      }
      if (params.letterSpacing !== void 0) {
        textNode.letterSpacing = { value: params.letterSpacing, unit: "PIXELS" };
      }
      if (params.textDecoration) {
        textNode.textDecoration = params.textDecoration;
      }
      return {
        success: true,
        nodeId: node.id,
        textAlign: textNode.textAlignHorizontal
      };
    });
  }
})();
