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
  var loadedFonts = /* @__PURE__ */ new Set();
  function ensureFontLoaded(font) {
    return __async(this, null, function* () {
      const key = `${font.family}:${font.style}`;
      if (loadedFonts.has(key)) return;
      yield figma.loadFontAsync(font);
      loadedFonts.add(key);
    });
  }
  (() => __async(void 0, null, function* () {
    const commonFonts = [
      { family: "Inter", style: "Regular" },
      { family: "Inter", style: "Medium" },
      { family: "Inter", style: "Semi Bold" },
      { family: "Inter", style: "Bold" }
    ];
    for (const font of commonFonts) {
      try {
        yield ensureFontLoaded(font);
      } catch (e) {
      }
    }
  }))();
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
  function findNodes(nodeIds) {
    const nodeMap = /* @__PURE__ */ new Map();
    const idSet = new Set(nodeIds);
    figma.currentPage.findAll((node) => {
      if (idSet.has(node.id)) {
        nodeMap.set(node.id, node);
      }
      return false;
    });
    return nodeMap;
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
      const parent = getParent(params.parentId);
      parent.appendChild(frame);
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
      yield ensureFontLoaded({ family: "Inter", style: fontWeight });
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
      const exposedProperties = [];
      const textNodes = component.findAll((n) => n.type === "TEXT");
      for (const textNode of textNodes) {
        const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
        const uniquePropName = exposedProperties.find((p) => p.name === propName) ? `${propName} ${exposedProperties.length + 1}` : propName;
        try {
          const propertyId = component.addComponentProperty(
            uniquePropName,
            "TEXT",
            textNode.characters
          );
          textNode.componentPropertyReferences = __spreadProps(__spreadValues({}, textNode.componentPropertyReferences), {
            characters: propertyId
          });
          exposedProperties.push({
            name: uniquePropName,
            propertyId,
            defaultValue: textNode.characters
          });
        } catch (e) {
        }
      }
      return {
        success: true,
        nodeId: component.id,
        name: component.name,
        type: component.type,
        size: { width: component.width, height: component.height },
        exposedProperties
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
    return __async(this, null, function* () {
      const node = yield figma.getNodeByIdAsync(params.nodeId);
      if (!node) {
        throw new Error("Node not found");
      }
      if ("fills" in node) {
        if ("setFillStyleIdAsync" in node) {
          yield node.setFillStyleIdAsync("");
        }
        node.fills = [{ type: "SOLID", color: params.color }];
      } else {
        throw new Error("Node does not support fills");
      }
      return {
        success: true,
        nodeId: node.id,
        color: params.color
      };
    });
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
    const nodeMap = findNodes(params.nodeIds);
    const nodes = params.nodeIds.map((id) => nodeMap.get(id)).filter((n) => n !== void 0);
    figma.currentPage.selection = nodes;
    return {
      success: true,
      selectedCount: nodes.length
    };
  }
  function zoomToFit(params) {
    let nodes;
    if (params.nodeIds && params.nodeIds.length > 0) {
      const nodeMap = findNodes(params.nodeIds);
      nodes = params.nodeIds.map((id) => nodeMap.get(id)).filter((n) => n !== void 0);
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
      yield ensureFontLoaded(textNode.fontName);
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
    const nodeMap = findNodes(params.nodeIds);
    const nodes = params.nodeIds.map((id) => nodeMap.get(id)).filter((n) => n !== void 0);
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
    const nodeMap = findNodes(params.nodeIds);
    const nodes = params.nodeIds.map((id) => nodeMap.get(id)).filter((n) => n !== void 0);
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
    const nodeMap = findNodes(params.nodeIds);
    const nodes = params.nodeIds.map((id) => nodeMap.get(id)).filter((n) => n !== void 0);
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
      yield ensureFontLoaded(textNode.fontName);
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
  var buttonSizes = {
    sm: { paddingH: 12, paddingV: 6, fontSize: 12 },
    md: { paddingH: 16, paddingV: 10, fontSize: 14 },
    lg: { paddingH: 24, paddingV: 14, fontSize: 16 }
  };
  var buttonVariants = {
    primary: { fill: { r: 0.3, g: 0.45, b: 0.95 }, text: { r: 1, g: 1, b: 1 }, stroke: null },
    secondary: { fill: { r: 0.95, g: 0.95, b: 0.97 }, text: { r: 0.2, g: 0.2, b: 0.25 }, stroke: null },
    outline: { fill: null, text: { r: 0.3, g: 0.45, b: 0.95 }, stroke: { r: 0.3, g: 0.45, b: 0.95 } },
    ghost: { fill: null, text: { r: 0.3, g: 0.45, b: 0.95 }, stroke: null }
  };
  function createButton(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f, _g;
      const variant = buttonVariants[(_a = params.variant) != null ? _a : "primary"];
      const size = buttonSizes[(_b = params.size) != null ? _b : "md"];
      const frame = figma.createFrame();
      frame.name = `Button: ${params.text}`;
      frame.x = (_c = params.x) != null ? _c : 0;
      frame.y = (_d = params.y) != null ? _d : 0;
      frame.layoutMode = "HORIZONTAL";
      frame.primaryAxisAlignItems = "CENTER";
      frame.counterAxisAlignItems = "CENTER";
      frame.paddingLeft = frame.paddingRight = size.paddingH;
      frame.paddingTop = frame.paddingBottom = size.paddingV;
      frame.layoutSizingHorizontal = "HUG";
      frame.layoutSizingVertical = "HUG";
      const fillColor = (_e = params.fillColor) != null ? _e : variant.fill;
      if (fillColor) {
        frame.fills = [{ type: "SOLID", color: fillColor }];
      } else {
        frame.fills = [];
      }
      frame.cornerRadius = (_f = params.cornerRadius) != null ? _f : 8;
      if (variant.stroke) {
        frame.strokes = [{ type: "SOLID", color: variant.stroke }];
        frame.strokeWeight = 1;
      }
      const textColor = (_g = params.textColor) != null ? _g : variant.text;
      yield ensureFontLoaded({ family: "Inter", style: "Medium" });
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
        size: { width: frame.width, height: frame.height }
      };
    });
  }
  function createCard(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e;
      const width = (_a = params.width) != null ? _a : 320;
      const card = figma.createFrame();
      card.name = params.name;
      card.x = (_b = params.x) != null ? _b : 0;
      card.y = (_c = params.y) != null ? _c : 0;
      card.resize(width, 100);
      card.layoutMode = "VERTICAL";
      card.itemSpacing = 0;
      card.layoutSizingHorizontal = "FIXED";
      card.layoutSizingVertical = "HUG";
      card.fills = [{ type: "SOLID", color: (_d = params.fillColor) != null ? _d : { r: 1, g: 1, b: 1 } }];
      card.cornerRadius = (_e = params.cornerRadius) != null ? _e : 12;
      if (params.shadow !== false) {
        card.effects = [{
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 4 },
          radius: 12,
          spread: 0,
          visible: true,
          blendMode: "NORMAL"
        }];
      }
      const createdIds = { cardId: card.id };
      yield ensureFontLoaded({ family: "Inter", style: "Semi Bold" });
      yield ensureFontLoaded({ family: "Inter", style: "Regular" });
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
          const btn = yield createButton({
            text: params.footer.secondaryAction,
            variant: "ghost",
            size: "sm"
          });
          const btnNode = yield figma.getNodeByIdAsync(btn.nodeId);
          footer.appendChild(btnNode);
          createdIds.secondaryButtonId = btn.nodeId;
        }
        if (params.footer.primaryAction) {
          const btn = yield createButton({
            text: params.footer.primaryAction,
            variant: "primary",
            size: "sm"
          });
          const btnNode = yield figma.getNodeByIdAsync(btn.nodeId);
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
      return __spreadProps(__spreadValues({
        success: true
      }, createdIds), {
        name: card.name,
        size: { width: card.width, height: card.height }
      });
    });
  }
  function createInput(params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const width = (_a = params.width) != null ? _a : 280;
      const container = figma.createFrame();
      container.name = `Input: ${(_b = params.label) != null ? _b : params.placeholder}`;
      container.x = (_c = params.x) != null ? _c : 0;
      container.y = (_d = params.y) != null ? _d : 0;
      container.layoutMode = "VERTICAL";
      container.itemSpacing = 6;
      container.layoutSizingHorizontal = "HUG";
      container.layoutSizingVertical = "HUG";
      container.fills = [];
      const createdIds = { containerId: container.id };
      yield ensureFontLoaded({ family: "Inter", style: "Medium" });
      yield ensureFontLoaded({ family: "Inter", style: "Regular" });
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
      return __spreadProps(__spreadValues({
        success: true
      }, createdIds), {
        name: container.name,
        size: { width: container.width, height: container.height }
      });
    });
  }
  function resolveReferences(params, resultMap) {
    if (typeof params === "string" && params.startsWith("$ref:")) {
      const path = params.slice(5);
      const [id, ...fields] = path.split(".");
      let value = resultMap.get(id);
      for (const field of fields) {
        value = value == null ? void 0 : value[field];
      }
      return value;
    }
    if (Array.isArray(params)) {
      return params.map((p) => resolveReferences(p, resultMap));
    }
    if (params && typeof params === "object") {
      const resolved = {};
      for (const [key, value] of Object.entries(params)) {
        resolved[key] = resolveReferences(value, resultMap);
      }
      return resolved;
    }
    return params;
  }
  function executeBatch(params) {
    return __async(this, null, function* () {
      const results = [];
      const resultMap = /* @__PURE__ */ new Map();
      for (const cmd of params.commands) {
        try {
          const resolvedParams = resolveReferences(cmd.params, resultMap);
          const handler = commandHandlers.get(cmd.command);
          if (!handler) {
            results.push({ success: false, error: `Unknown command: ${cmd.command}` });
            continue;
          }
          const cmdResult = yield handler(resolvedParams);
          results.push(cmdResult);
          if (cmd.id) {
            resultMap.set(cmd.id, cmdResult);
          }
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      return {
        success: true,
        results,
        executedCount: results.length,
        successCount: results.filter((r) => r.success).length
      };
    });
  }
  function exportNode(params) {
    return __async(this, null, function* () {
      let node = null;
      if (params.nodeId) {
        node = yield figma.getNodeByIdAsync(params.nodeId);
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
      const settings = format === "SVG" ? { format: "SVG" } : format === "PDF" ? { format: "PDF" } : { format, constraint: { type: "SCALE", value: scale } };
      const bytes = yield node.exportAsync(settings);
      const base64 = figma.base64Encode(bytes);
      const mimeTypes = {
        PNG: "image/png",
        JPG: "image/jpeg",
        SVG: "image/svg+xml",
        PDF: "application/pdf"
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
          height: node.height
        }
      };
    });
  }
  function findNodesFunc(params) {
    return __async(this, null, function* () {
      const parent = params.parentId ? yield figma.getNodeByIdAsync(params.parentId) : figma.currentPage;
      if (!parent || !("findAll" in parent)) {
        throw new Error("Parent node not found or cannot contain children");
      }
      const maxResults = params.maxResults || 100;
      const results = [];
      parent.findAll((node) => {
        var _a;
        if (results.length >= maxResults) return false;
        if (params.type && node.type !== params.type) return false;
        if (params.name && node.name !== params.name) return false;
        if (params.nameContains && !node.name.includes(params.nameContains)) return false;
        const sceneNode = node;
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          parentId: ((_a = node.parent) == null ? void 0 : _a.id) || null,
          position: { x: sceneNode.x, y: sceneNode.y },
          size: { width: sceneNode.width, height: sceneNode.height }
        });
        return false;
      });
      return {
        success: true,
        nodes: results,
        count: results.length,
        truncated: results.length >= maxResults
      };
    });
  }
  function getTree(params) {
    return __async(this, null, function* () {
      var _a;
      const maxDepth = (_a = params.depth) != null ? _a : 3;
      const rootNode = params.nodeId ? yield figma.getNodeByIdAsync(params.nodeId) : figma.currentPage;
      if (!rootNode) {
        throw new Error("Node not found");
      }
      function buildTree(node, currentDepth) {
        const sceneNode = node;
        const result = {
          id: node.id,
          name: node.name,
          type: node.type
        };
        if ("x" in sceneNode) {
          result.position = { x: sceneNode.x, y: sceneNode.y };
          result.size = { width: sceneNode.width, height: sceneNode.height };
        }
        if (node.type === "TEXT") {
          result.characters = node.characters;
        }
        if (currentDepth < maxDepth && "children" in node) {
          result.children = node.children.map(
            (child) => buildTree(child, currentDepth + 1)
          );
        } else if ("children" in node) {
          result.childCount = node.children.length;
        }
        return result;
      }
      return {
        success: true,
        tree: buildTree(rootNode, 0)
      };
    });
  }
  function bulkModify(params) {
    return __async(this, null, function* () {
      const results = [];
      for (const nodeId of params.nodeIds) {
        try {
          const node = yield figma.getNodeByIdAsync(nodeId);
          if (!node) {
            results.push({ nodeId, success: false, error: "Node not found" });
            continue;
          }
          const sceneNode = node;
          if (params.changes.fillColor && "fills" in sceneNode) {
            if ("setFillStyleIdAsync" in sceneNode) {
              yield sceneNode.setFillStyleIdAsync("");
            }
            sceneNode.fills = [
              { type: "SOLID", color: params.changes.fillColor }
            ];
          }
          if (params.changes.strokeColor && "strokes" in sceneNode) {
            sceneNode.strokes = [
              { type: "SOLID", color: params.changes.strokeColor }
            ];
          }
          if (params.changes.strokeWeight !== void 0 && "strokeWeight" in sceneNode) {
            sceneNode.strokeWeight = params.changes.strokeWeight;
          }
          if (params.changes.opacity !== void 0) {
            sceneNode.opacity = params.changes.opacity;
          }
          if (params.changes.cornerRadius !== void 0 && "cornerRadius" in sceneNode) {
            sceneNode.cornerRadius = params.changes.cornerRadius;
          }
          if (params.changes.visible !== void 0) {
            sceneNode.visible = params.changes.visible;
          }
          results.push({ nodeId, success: true });
        } catch (e) {
          results.push({
            nodeId,
            success: false,
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
      return {
        success: true,
        results,
        modifiedCount: results.filter((r) => r.success).length,
        failedCount: results.filter((r) => !r.success).length
      };
    });
  }
  function editComponent(params) {
    return __async(this, null, function* () {
      const node = yield figma.getNodeByIdAsync(params.componentId);
      if (!node) {
        throw new Error("Component not found");
      }
      if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
        throw new Error("Node is not a component or component set");
      }
      const component = node;
      if (params.changes.name) {
        component.name = params.changes.name;
      }
      if (params.changes.fillColor && "fills" in component) {
        component.fills = [
          { type: "SOLID", color: params.changes.fillColor }
        ];
      }
      if (params.changes.strokeColor && "strokes" in component) {
        component.strokes = [
          { type: "SOLID", color: params.changes.strokeColor }
        ];
      }
      if (params.changes.strokeWeight !== void 0 && "strokeWeight" in component) {
        component.strokeWeight = params.changes.strokeWeight;
      }
      if (params.changes.opacity !== void 0) {
        component.opacity = params.changes.opacity;
      }
      if (params.changes.cornerRadius !== void 0 && "cornerRadius" in component) {
        component.cornerRadius = params.changes.cornerRadius;
      }
      const childResults = [];
      if (params.childChanges && "findAll" in component) {
        for (const childChange of params.childChanges) {
          const matchingChildren = component.findAll((child) => {
            if (childChange.childName && child.name !== childChange.childName) return false;
            if (childChange.childType && child.type !== childChange.childType) return false;
            return true;
          });
          for (const child of matchingChildren) {
            try {
              if (childChange.fillColor && "fills" in child) {
                child.fills = [
                  { type: "SOLID", color: childChange.fillColor }
                ];
              }
              if (childChange.text && child.type === "TEXT") {
                const textNode = child;
                yield ensureFontLoaded(textNode.fontName);
                textNode.characters = childChange.text;
              }
              if (childChange.fontSize && child.type === "TEXT") {
                const textNode = child;
                yield ensureFontLoaded(textNode.fontName);
                textNode.fontSize = childChange.fontSize;
              }
              childResults.push({ name: child.name, success: true });
            } catch (e) {
              childResults.push({
                name: child.name,
                success: false,
                error: e instanceof Error ? e.message : String(e)
              });
            }
          }
        }
      }
      let instanceCount = 0;
      if (node.type === "COMPONENT") {
        figma.currentPage.findAll((n) => {
          var _a;
          if (n.type === "INSTANCE" && ((_a = n.mainComponent) == null ? void 0 : _a.id) === node.id) {
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
        instancesAffected: instanceCount
      };
    });
  }
  function analyzeNode(params) {
    return __async(this, null, function* () {
      var _a;
      const node = yield figma.getNodeByIdAsync(params.nodeId);
      if (!node) {
        throw new Error("Node not found");
      }
      const sceneNode = node;
      const parent = node.parent;
      let parentLayout = null;
      if (parent && "layoutMode" in parent) {
        const layoutParent = parent;
        parentLayout = {
          mode: layoutParent.layoutMode,
          spacing: layoutParent.itemSpacing,
          padding: {
            top: layoutParent.paddingTop,
            right: layoutParent.paddingRight,
            bottom: layoutParent.paddingBottom,
            left: layoutParent.paddingLeft
          },
          alignment: layoutParent.primaryAxisAlignItems,
          counterAlignment: layoutParent.counterAxisAlignItems
        };
      }
      let ownLayout = null;
      if ("layoutMode" in sceneNode) {
        const frameNode = sceneNode;
        ownLayout = {
          mode: frameNode.layoutMode,
          spacing: frameNode.itemSpacing,
          padding: {
            top: frameNode.paddingTop,
            right: frameNode.paddingRight,
            bottom: frameNode.paddingBottom,
            left: frameNode.paddingLeft
          }
        };
      }
      let sizing = null;
      if ("layoutSizingHorizontal" in sceneNode) {
        sizing = {
          horizontal: sceneNode.layoutSizingHorizontal,
          vertical: sceneNode.layoutSizingVertical
        };
      }
      let constraints = null;
      if ("constraints" in sceneNode) {
        constraints = sceneNode.constraints;
      }
      const canMove = !parentLayout || parentLayout.mode === "NONE";
      return {
        success: true,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        position: { x: sceneNode.x, y: sceneNode.y },
        size: { width: sceneNode.width, height: sceneNode.height },
        parent: parent ? {
          id: parent.id,
          name: parent.name,
          type: parent.type
        } : null,
        parentLayout,
        ownLayout,
        sizing,
        constraints,
        canMove,
        isComponent: node.type === "COMPONENT",
        isInstance: node.type === "INSTANCE",
        isComponentSet: node.type === "COMPONENT_SET",
        mainComponentId: node.type === "INSTANCE" ? (_a = node.mainComponent) == null ? void 0 : _a.id : null
      };
    });
  }
  var commandHandlers = /* @__PURE__ */ new Map([
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
    ["analyze_node", analyzeNode]
  ]);
  function createVariants(params) {
    return __async(this, null, function* () {
      const baseNode = yield figma.getNodeByIdAsync(params.baseNodeId);
      if (!baseNode) {
        throw new Error("Base node not found");
      }
      const componentIds = [];
      const propertyName = params.propertyName;
      const baseSceneNode = baseNode;
      const baseX = baseSceneNode.x;
      const baseWidth = baseSceneNode.width;
      const clones = [];
      for (let i = 0; i < params.variants.length; i++) {
        const clone = baseSceneNode.clone();
        clone.x = baseX + i * (baseWidth + 20);
        clones.push(clone);
      }
      baseSceneNode.remove();
      for (let i = 0; i < params.variants.length; i++) {
        const variant = params.variants[i];
        const node = clones[i];
        if (variant.fillColor && "fills" in node) {
          node.fills = [{ type: "SOLID", color: variant.fillColor }];
        }
        if (variant.opacity !== void 0) {
          node.opacity = variant.opacity;
        }
        if (variant.strokeColor && "strokes" in node) {
          node.strokes = [{ type: "SOLID", color: variant.strokeColor }];
          if (variant.strokeWeight) {
            node.strokeWeight = variant.strokeWeight;
          }
        }
        if (variant.textColor && "findAll" in node) {
          const textNodes = node.findAll((n) => n.type === "TEXT");
          for (const textNode of textNodes) {
            textNode.fills = [{ type: "SOLID", color: variant.textColor }];
          }
        }
        const variantName = `${propertyName}=${variant.name}`;
        const component = figma.createComponentFromNode(node);
        component.name = variantName;
        componentIds.push(component.id);
      }
      const components = [];
      for (const id of componentIds) {
        const comp = yield figma.getNodeByIdAsync(id);
        if (comp && comp.type === "COMPONENT") {
          components.push(comp);
        }
      }
      const componentSet = figma.combineAsVariants(components, figma.currentPage);
      componentSet.name = params.componentSetName || "Component";
      const exposedProperties = [];
      const firstVariant = components[0];
      const textNodesInFirst = firstVariant.findAll((n) => n.type === "TEXT");
      for (const textNode of textNodesInFirst) {
        const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
        const uniquePropName = exposedProperties.find((p) => p.name === propName) ? `${propName} ${exposedProperties.length + 1}` : propName;
        try {
          const propertyId = componentSet.addComponentProperty(
            uniquePropName,
            "TEXT",
            textNode.characters
          );
          for (const comp of components) {
            const matchingTextNodes = comp.findAll((n) => n.type === "TEXT" && n.name === textNode.name);
            for (const tn of matchingTextNodes) {
              tn.componentPropertyReferences = __spreadProps(__spreadValues({}, tn.componentPropertyReferences), {
                characters: propertyId
              });
            }
          }
          exposedProperties.push({
            name: uniquePropName,
            propertyId,
            defaultValue: textNode.characters
          });
        } catch (e) {
        }
      }
      return {
        success: true,
        componentSetId: componentSet.id,
        componentSetName: componentSet.name,
        propertyName,
        variants: params.variants.map((v, i) => ({
          name: v.name,
          componentId: componentIds[i]
        })),
        variantCount: componentIds.length,
        exposedProperties
      };
    });
  }
  function addComponentProperty(params) {
    return __async(this, null, function* () {
      const node = yield figma.getNodeByIdAsync(params.componentId);
      if (!node || node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
        throw new Error("Node is not a component or component set");
      }
      const component = node;
      let propertyId;
      if (params.propertyType === "VARIANT" && params.variantOptions) {
        propertyId = component.addComponentProperty(
          params.propertyName,
          "VARIANT",
          params.defaultValue,
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
        propertyId
      };
    });
  }
  function exposeAsProperty(params) {
    return __async(this, null, function* () {
      const component = yield figma.getNodeByIdAsync(params.componentId);
      if (!component || component.type !== "COMPONENT" && component.type !== "COMPONENT_SET") {
        throw new Error("Node is not a component or component set");
      }
      const layer = yield figma.getNodeByIdAsync(params.layerId);
      if (!layer) {
        throw new Error("Layer not found");
      }
      const comp = component;
      if (params.propertyType === "TEXT") {
        if (layer.type !== "TEXT") {
          throw new Error("Layer is not a text node");
        }
        const textNode = layer;
        const propertyId = comp.addComponentProperty(
          params.propertyName,
          "TEXT",
          textNode.characters
        );
        textNode.componentPropertyReferences = __spreadProps(__spreadValues({}, textNode.componentPropertyReferences), {
          characters: propertyId
        });
        return {
          success: true,
          componentId: comp.id,
          layerId: layer.id,
          propertyName: params.propertyName,
          propertyType: "TEXT",
          propertyId,
          defaultValue: textNode.characters
        };
      } else if (params.propertyType === "BOOLEAN") {
        const propertyId = comp.addComponentProperty(
          params.propertyName,
          "BOOLEAN",
          layer.visible
        );
        layer.componentPropertyReferences = __spreadProps(__spreadValues({}, layer.componentPropertyReferences), {
          visible: propertyId
        });
        return {
          success: true,
          componentId: comp.id,
          layerId: layer.id,
          propertyName: params.propertyName,
          propertyType: "BOOLEAN",
          propertyId,
          defaultValue: layer.visible
        };
      }
      throw new Error("Unsupported property type");
    });
  }
  function listComponentProperties(params) {
    return __async(this, null, function* () {
      const node = yield figma.getNodeByIdAsync(params.componentId);
      if (!node || node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
        throw new Error("Node is not a component or component set");
      }
      const component = node;
      const properties = component.componentPropertyDefinitions;
      const propertyList = Object.entries(properties).map(([key, def]) => ({
        id: key,
        name: def.type === "VARIANT" ? key : key.split("#")[0],
        type: def.type,
        defaultValue: def.defaultValue,
        variantOptions: def.type === "VARIANT" ? def.variantOptions : void 0
      }));
      return {
        success: true,
        componentId: component.id,
        componentName: component.name,
        properties: propertyList,
        count: propertyList.length
      };
    });
  }
  function combineAsVariants(params) {
    return __async(this, null, function* () {
      const components = [];
      for (const id of params.componentIds) {
        const node = yield figma.getNodeByIdAsync(id);
        if (node && node.type === "COMPONENT") {
          components.push(node);
        }
      }
      if (components.length < 2) {
        throw new Error("Need at least 2 components to combine as variants");
      }
      const componentSet = figma.combineAsVariants(components, figma.currentPage);
      if (params.name) {
        componentSet.name = params.name;
      }
      const exposedProperties = [];
      const firstVariant = components[0];
      const textNodesInFirst = firstVariant.findAll((n) => n.type === "TEXT");
      for (const textNode of textNodesInFirst) {
        const propName = textNode.name || textNode.characters.slice(0, 20) || "Text";
        const uniquePropName = exposedProperties.find((p) => p.name === propName) ? `${propName} ${exposedProperties.length + 1}` : propName;
        try {
          const propertyId = componentSet.addComponentProperty(
            uniquePropName,
            "TEXT",
            textNode.characters
          );
          for (const comp of components) {
            const matchingTextNodes = comp.findAll((n) => n.type === "TEXT" && n.name === textNode.name);
            for (const tn of matchingTextNodes) {
              tn.componentPropertyReferences = __spreadProps(__spreadValues({}, tn.componentPropertyReferences), {
                characters: propertyId
              });
            }
          }
          exposedProperties.push({
            name: uniquePropName,
            propertyId,
            defaultValue: textNode.characters
          });
        } catch (e) {
        }
      }
      return {
        success: true,
        componentSetId: componentSet.id,
        name: componentSet.name,
        variantCount: components.length,
        exposedProperties
      };
    });
  }
  figma.ui.onmessage = (msg) => __async(void 0, null, function* () {
    const { id, command, params } = msg;
    try {
      const handler = commandHandlers.get(command);
      if (!handler) {
        throw new Error(`Unknown command: ${command}`);
      }
      const result = yield handler(params);
      figma.ui.postMessage({ id, result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      figma.ui.postMessage({ id, error: errorMessage });
    }
  });
})();
