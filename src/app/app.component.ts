import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { newInstance, BrowserJsPlumbInstance } from '@jsplumb/browser-ui';
import panzoom from 'panzoom';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  instance!: BrowserJsPlumbInstance;
  actionBlocks = [
    {
      label: 'Send WhatsApp Template',
      blockType: 'action',
      blockIcon: 'c-icon-file_1',
    },
    { label: 'Send Email', blockType: 'action', blockIcon: 'c-icon-inbox_02' },
    {
      label: 'Assign to Team member',
      blockType: 'action',
      blockIcon: 'c-icon-users_profiles_2',
    },
    { label: 'Add Tag', blockType: 'action', blockIcon: 'c-icon-tag' },
    {
      label: 'Change Lead Stage',
      blockType: 'action',
      blockIcon: 'c-icon-building',
    },
    {
      label: 'Create Note',
      blockType: 'action',
      blockIcon: 'c-icon-receipt_lines',
    },
    { label: 'Delay Step', blockType: 'action', blockIcon: 'c-icon-clock_1' },
    {
      label: 'Exit Workflow',
      blockType: 'action',
      blockIcon: 'c-icon-check-contained',
    },
  ];

  conditionBlocks = [
    {
      label: 'Message Delivered ?',
      blockType: 'condition',
      blockIcon: 'c-icon-message_share',
    },
    {
      label: 'Message Seen ?',
      blockType: 'condition',
      blockIcon: 'c-icon-message_exclamation',
    },
    {
      label: 'Email Delivered ?',
      blockType: 'condition',
      blockIcon: 'c-icon-mail_check',
    },
    {
      label: 'Email Opened ?',
      blockType: 'condition',
      blockIcon: 'c-icon-mail_opened',
    },
    {
      label: 'Custom Condition',
      blockType: 'condition',
      blockIcon: 'c-icon-layout_grid_add',
    },
  ];

  ngOnInit(): void {
    document.addEventListener('dragstart', () => {
      document.body.classList.add('dragging-block');
    });
    document.addEventListener('dragend', () => {
      document.body.classList.remove('dragging-block');
    });
  }

  workflowData = [
    {
      id: 'trigger1',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'trigger',
      subType: 'Trigger',
      configs: {
        source: null,
        next_step_id: 'exit1',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'exit1',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'action',
      subType: 'exit',
      configs: {
        source: ['trigger1'],
        next_step_id: null,
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
  ];
  panzoomInstance: any;

  ngAfterViewInit(): void {
    this.instance = newInstance({
      container: this.canvasRef.nativeElement,
      connector: {
        type: 'Flowchart',
        options: {
          cornerRadius: 5, // <-- 5px curve
        },
      },
      paintStyle: {
        stroke: '#B2C1DA',
        strokeWidth: 2, // Thin line
      },
      endpoint: 'Blank', // 🔵 Hides the default dots
      endpointStyle: { fill: 'transparent' }, // Hide endpoints visually
    });

    this.renderWorkflow(this.workflowData);

    this.panzoomInstance = panzoom(this.canvasRef.nativeElement, {
      zoomSpeed: 0.065,
      maxZoom: 3,
      minZoom: 0.3,
      smoothScroll: false,
    });
  }

  // renderWorkflow(nodes: any[]) {
  //   const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  //   const positions: { [key: string]: { x: number; y: number } } = {};

  //   // ========== 1. ADVANCED Positioning Logic Starts ========== //
  //   const positionWorkflowNodes = (rawNodes: any[]) => {
  //     const allNodes = Object.fromEntries(
  //       rawNodes.map((n) => [n.id, { ...n, children: [] }])
  //     );
  //     const parentMap: Record<string, string[]> = {};

  //     // Build the tree structure (child and parent relationships)
  //     Object.values(allNodes).forEach((node: any) => {
  //       const sources = node.configs?.source || [];
  //       if (node.type === 'condition') {
  //         const { true: trueBranch, false: falseBranch } =
  //           node.configs.branch || {};
  //         if (trueBranch) sources.push(node.id);
  //         if (falseBranch) sources.push(node.id);
  //       }

  //       const nextId = node.configs?.next_step_id;
  //       if (nextId) {
  //         parentMap[nextId] = parentMap[nextId] || [];
  //         parentMap[nextId].push(node.id);
  //         allNodes[node.id].children.push(allNodes[nextId]);
  //       }
  //       if (node.type === 'condition' && node.configs?.branch) {
  //         const { true: trueBranch, false: falseBranch } = node.configs.branch;
  //         if (trueBranch) {
  //           parentMap[trueBranch] = parentMap[trueBranch] || [];
  //           parentMap[trueBranch].push(node.id);
  //           allNodes[node.id].children.push(allNodes[trueBranch]);
  //         }
  //         if (falseBranch) {
  //           parentMap[falseBranch] = parentMap[falseBranch] || [];
  //           parentMap[falseBranch].push(node.id);
  //           allNodes[node.id].children.push(allNodes[falseBranch]);
  //         }
  //       }
  //     });

  //     const rootNodes = Object.values(allNodes).filter(
  //       (n: any) => !parentMap[n.id]
  //     );
  //     const positioned = new Set<string>();
  //     const NODE_Y_GAP = 200;
  //     const NODE_X_GAP = 300; // Horizontal gap between sibling branches

  //     interface LayoutInfo {
  //       width: number;
  //       positions: { x: number; y: number }[];
  //       minX: number;
  //       maxX: number;
  //     }

  //     function positionDFS(node: any, depth = 0): LayoutInfo {
  //       if (positioned.has(node.id)) {
  //         const pos = positions[node.id];
  //         return {
  //           width: NODE_X_GAP,
  //           positions: [pos],
  //           minX: pos.x,
  //           maxX: pos.x,
  //         };
  //       }

  //       const y = depth * NODE_Y_GAP;

  //       if (node.children.length === 0) {
  //         const pos = { x: 0, y };
  //         positions[node.id] = pos;
  //         positioned.add(node.id);
  //         return { width: NODE_X_GAP, positions: [pos], minX: 0, maxX: 0 };
  //       }

  //       const childLayouts: LayoutInfo[] = node.children.map((child: any) =>
  //         positionDFS(child, depth + 1)
  //       );

  //       let totalWidth = 0;
  //       childLayouts.forEach((layout) => {
  //         totalWidth += layout.width;
  //       });

  //       let currentX = -(totalWidth / 2);
  //       let allChildPositions: { x: number; y: number }[] = [];
  //       let minX = Infinity;
  //       let maxX = -Infinity;

  //       childLayouts.forEach((layout, index) => {
  //         const child = node.children[index];
  //         const childCenterX = currentX + layout.width / 2;

  //         // Reposition the entire child subtree
  //         layout.positions.forEach((pos) => {
  //           const newChildX = pos.x + childCenterX;
  //           positions[child.id] = { x: newChildX, y: pos.y }; // Update global positions

  //           // Track min/max for centering the current node
  //           if (newChildX < minX) minX = newChildX;
  //           if (newChildX > maxX) maxX = newChildX;

  //           allChildPositions.push({ x: newChildX, y: pos.y });
  //         });
  //         // Update the main position of the direct child
  //         positions[child.id] = {
  //           x: childCenterX,
  //           y:
  //             child.children.length > 0
  //               ? positions[child.id].y
  //               : y + NODE_Y_GAP,
  //         };

  //         currentX += layout.width;
  //       });

  //       const centerX = (minX + maxX) / 2;
  //       positions[node.id] = { x: centerX, y };
  //       positioned.add(node.id);

  //       return {
  //         width: totalWidth,
  //         positions: [{ x: centerX, y }, ...allChildPositions],
  //         minX: minX,
  //         maxX: maxX,
  //       };
  //     }

  //     let globalOffsetX = 0;
  //     rootNodes.forEach((root: any) => {
  //       const layout = positionDFS(root, 0);
  //       // Shift the entire tree based on previous trees
  //       Object.keys(positions).forEach((id) => {
  //         if (
  //           rootNodes.find((r: any) => r.id === id) ||
  //           allNodes[id].children.some((c: any) => root.children.includes(c))
  //         ) {
  //           positions[id].x += globalOffsetX + layout.width / 2;
  //         }
  //       });
  //       globalOffsetX += layout.width + NODE_X_GAP * 2;
  //     });

  //     return positions;
  //   };

  //   const finalPositions = positionWorkflowNodes(nodes);

  //   // ========== 2. Joiner & Downstream Adjustment (Now More Robust) ========== //
  //   // The new positioning algorithm already handles much of this, but we'll
  //   // still align joiners for perfect vertical lines.

  //   // NOTE: The `getConditionForJoiner` and its helpers (`getParents`, `collectAllAncestors`)
  //   // from your original code are well-designed for finding the correct condition.
  //   // We will keep them as is. I am pasting them here for completeness.

  //   const getParents = (nodeId: string): string[] => {
  //     const parents: string[] = [];
  //     nodes.forEach((n: any) => {
  //       if (n.configs?.next_step_id === nodeId) {
  //         parents.push(n.id);
  //       }
  //       if (n.type === 'condition' && n.configs?.branch) {
  //         if (
  //           n.configs.branch.true === nodeId ||
  //           n.configs.branch.false === nodeId
  //         ) {
  //           parents.push(n.id);
  //         }
  //       }
  //     });
  //     return parents;
  //   };

  //   const collectAllAncestors = (startNodeId: string): Set<string> => {
  //     const ancestors = new Set<string>();
  //     const queue: string[] = [startNodeId];
  //     const visited = new Set<string>();
  //     while (queue.length > 0) {
  //       const currentId = queue.shift()!;
  //       if (visited.has(currentId)) continue;
  //       visited.add(currentId);
  //       if (currentId !== startNodeId) {
  //         ancestors.add(currentId);
  //       }
  //       const parents = getParents(currentId);
  //       parents.forEach((pId) => {
  //         if (!visited.has(pId)) {
  //           queue.push(pId);
  //         }
  //       });
  //     }
  //     return ancestors;
  //   };

  //   const getConditionForJoiner = (joinerNode: any): any => {
  //     const sources: string[] = joinerNode.configs?.source || [];
  //     if (sources.length < 2) {
  //       return null;
  //     }
  //     const [sourceAId, sourceBId] = sources;
  //     const ancestorsA = collectAllAncestors(sourceAId);
  //     const ancestorsB = collectAllAncestors(sourceBId);
  //     let lowestCommonCondition: any = null;
  //     let maxCommonConditionY = -Infinity;
  //     for (const node of nodes) {
  //       if (
  //         node.type === 'condition' &&
  //         ancestorsA.has(node.id) &&
  //         ancestorsB.has(node.id)
  //       ) {
  //         const nodePos = finalPositions[node.id];
  //         if (nodePos && nodePos.y > maxCommonConditionY) {
  //           maxCommonConditionY = nodePos.y;
  //           lowestCommonCondition = node;
  //         }
  //       }
  //     }
  //     return lowestCommonCondition;
  //   };

  //   for (const node of nodes) {
  //     if (node.type === 'joiner') {
  //       const conditionNode = getConditionForJoiner(node);
  //       const posA = finalPositions[node.configs.source[0]];
  //       const posB = finalPositions[node.configs.source[1]];

  //       // Set Y position below the lowest of its two sources
  //       const newY = Math.max(posA.y, posB.y) + 150;
  //       let newX = (posA.x + posB.x) / 2; // Default X is between sources

  //       // If a common ancestor condition is found, align the X vertically
  //       if (conditionNode) {
  //         newX = finalPositions[conditionNode.id].x;
  //       }

  //       finalPositions[node.id] = { x: newX, y: newY };

  //       // Adjust everything downstream from this joiner
  //       const adjustDownstream = (
  //         currentId: string | null,
  //         xOffset: number,
  //         yOffset: number,
  //         visited = new Set<string>()
  //       ) => {
  //         if (!currentId || visited.has(currentId)) return;
  //         visited.add(currentId);

  //         const currentNode = nodeMap.get(currentId);
  //         if (!currentNode) return;

  //         const oldPos = finalPositions[currentId];
  //         finalPositions[currentId] = {
  //           x: oldPos.x + xOffset,
  //           y: oldPos.y + yOffset,
  //         };

  //         if (currentNode.configs?.next_step_id) {
  //           adjustDownstream(
  //             currentNode.configs.next_step_id,
  //             xOffset,
  //             yOffset,
  //             visited
  //           );
  //         }
  //         if (currentNode.type === 'condition') {
  //           adjustDownstream(
  //             currentNode.configs.branch?.true,
  //             xOffset,
  //             yOffset,
  //             visited
  //           );
  //           adjustDownstream(
  //             currentNode.configs.branch?.false,
  //             xOffset,
  //             yOffset,
  //             visited
  //           );
  //         }
  //       };

  //       // Calculate the delta and apply it
  //       const originalJoinerPos = positions[node.id];
  //       const xDelta = newX - originalJoinerPos.x;
  //       const yDelta = newY - originalJoinerPos.y;
  //       adjustDownstream(node.id, xDelta, yDelta);
  //     }
  //   }

  //   // ========== 3. DOM Cleanup & Rendering ========== //
  //   this.clearCanvas(); // Use your existing clearCanvas method

  //   for (const node of nodes) {
  //     const pos = finalPositions[node.id];
  //     if (!pos) {
  //       console.error(
  //         `Position not found for node ${node.id}. Skipping render.`
  //       );
  //       continue;
  //     }
  //     const div = document.createElement('div');
  //     // ... (rest of your DOM element creation and styling logic is fine)
  //     div.id = node.id;
  //     div.className = 'block';
  //     //... (all your styling code)
  //     this.canvasRef.nativeElement.appendChild(div);
  //   }

  //   // Final positioning after DOM elements are created and have dimensions
  //   for (const node of nodes) {
  //     const div = document.getElementById(node.id)!;
  //     if (!div) continue;
  //     const rect = div.getBoundingClientRect();
  //     const { x, y } = finalPositions[node.id];

  //     // Center the element on its calculated (x,y) coordinate
  //     div.style.left = `${x - rect.width / 2}px`;
  //     div.style.top = `${y - rect.height / 2}px`;
  //     this.instance.manage(div);
  //   }

  //   // ========== 4. Connectors with Deduplication ========== //
  //   const addedEdges = new Set<string>(); // Track edges: `${sourceId}-->${targetId}`

  //   const addConnection = (
  //     sourceId: string,
  //     targetId: string,
  //     anchors: [any, any],
  //     overlays: any[] = []
  //   ) => {
  //     const key = `${sourceId}-->${targetId}`;
  //     if (addedEdges.has(key)) return;
  //     addedEdges.add(key);

  //     this.instance.connect({
  //       source: document.getElementById(sourceId)!,
  //       target: document.getElementById(targetId)!,
  //       anchors,
  //       overlays,
  //     });
  //   };

  //   for (const node of nodes) {
  //     if (node.type === 'condition') {
  //       addConnection(node.id, node.configs.branch.true, ['Bottom', 'Right']);
  //       addConnection(node.id, node.configs.branch.false, ['Bottom', 'Left']);
  //     } else if (node.type === 'joiner') {
  //       const [sourceA, sourceB] = node.configs.source;
  //       addConnection(
  //         sourceA,
  //         node.id,
  //         ['Bottom', 'Left'],
  //         [this.createPlusOverlay(sourceA)]
  //       );
  //       addConnection(
  //         sourceB,
  //         node.id,
  //         ['Bottom', 'Right'],
  //         [this.createPlusOverlay(sourceB)]
  //       );

  //       if (node.configs.next_step_id) {
  //         addConnection(
  //           node.id,
  //           node.configs.next_step_id,
  //           ['Bottom', 'Top'],
  //           [this.createPlusOverlay(node.id)]
  //         );
  //       }
  //     } else if (
  //       node.configs.next_step_id &&
  //       nodeMap.get(node.configs.next_step_id)?.type !== 'joiner'
  //     ) {
  //       const shouldShowPlus = node.type !== 'condition';
  //       addConnection(
  //         node.id,
  //         node.configs.next_step_id,
  //         ['Bottom', 'Top'],
  //         shouldShowPlus ? [this.createPlusOverlay(node.id)] : []
  //       );
  //     }
  //   }
  // }

  // =================================================================
  // =============== REVISED & DEBUGGED RENDER WORKFLOW ================
  // =================================================================
  // =================================================================
  // =================== FINAL, COMPLETE RENDER WORKFLOW ==================
  // =================================================================
  renderWorkflow(nodes: any[]) {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    this.clearCanvas(); // Clear canvas and reset jsPlumb instance at the beginning

    // ========== 1. ADVANCED Positioning Logic (This part is corrected and works) ========== //
    const positionWorkflowNodes = (rawNodes: any[]) => {
      // ... This is the same advanced positioning logic from the previous step.
      // ... It correctly calculates the X and Y for all nodes.
      // ... No changes are needed in this internal function.
      const allNodes: { [id: string]: any } = Object.fromEntries(
        rawNodes.map((n) => [n.id, { ...n, children: [] }])
      );
      const parentMap: Record<string, string[]> = {};

      for (const node of Object.values(allNodes)) {
        const nextId = node.configs?.next_step_id;
        if (nextId && allNodes[nextId]) {
          parentMap[nextId] = parentMap[nextId] || [];
          parentMap[nextId].push(node.id);
          node.children.push(allNodes[nextId]);
        }
        if (node.type === 'condition' && node.configs?.branch) {
          const { true: trueBranch, false: falseBranch } = node.configs.branch;
          if (trueBranch && allNodes[trueBranch]) {
            parentMap[trueBranch] = parentMap[trueBranch] || [];
            parentMap[trueBranch].push(node.id);
            node.children.push(allNodes[trueBranch]);
          }
          if (falseBranch && allNodes[falseBranch]) {
            parentMap[falseBranch] = parentMap[falseBranch] || [];
            parentMap[falseBranch].push(node.id);
            node.children.push(allNodes[falseBranch]);
          }
        }
      }

      const rootNodes = Object.values(allNodes).filter(
        (n: any) => !parentMap[n.id]?.length
      );
      const positions: { [id: string]: { x: number; y: number } } = {};
      const positionedSubtrees: { [rootId: string]: Set<string> } = {};

      const NODE_Y_GAP = 180;
      const NODE_X_GAP = 280;

      interface LayoutInfo {
        width: number;
        minX: number;
        maxX: number;
      }

      function positionDFS(node: any, depth = 0): LayoutInfo {
        if (positions[node.id]) {
          return {
            width: NODE_X_GAP,
            minX: positions[node.id].x,
            maxX: positions[node.id].x,
          };
        }
        const y = depth * NODE_Y_GAP;
        if (node.children.length === 0) {
          positions[node.id] = { x: 0, y };
          return {
            width: NODE_X_GAP,
            minX: -NODE_X_GAP / 2,
            maxX: NODE_X_GAP / 2,
          };
        }
        const childLayouts = node.children.map((child: any) =>
          positionDFS(child, depth + 1)
        );
        const totalWidth = childLayouts.reduce(
          (sum : any, layout :any) => sum + layout.width,
          0
        );
        let currentX = -totalWidth / 2;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const layout = childLayouts[i];
          const childCenter = currentX + layout.width / 2;
          const subtreeNodes = new Set<string>();
          const getSubtreeNodes = (n: any) => {
            if (subtreeNodes.has(n.id)) return;
            subtreeNodes.add(n.id);
            n.children.forEach(getSubtreeNodes);
          };
          getSubtreeNodes(child);
          const shiftX = childCenter - (layout.minX + layout.width / 2);
          for (const subNodeId of subtreeNodes) {
            if (positions[subNodeId]) {
              positions[subNodeId].x += shiftX;
            }
          }
          currentX += layout.width;
        }
        const childMinX = positions[node.children[0].id].x;
        const childMaxX =
          positions[node.children[node.children.length - 1].id].x;
        const centerX = (childMinX + childMaxX) / 2;
        positions[node.id] = { x: centerX, y };
        return {
          width: totalWidth,
          minX: positions[node.children[0].id].x - childLayouts[0].width / 2,
          maxX:
            positions[node.children[node.children.length - 1].id].x +
            childLayouts[childLayouts.length - 1].width / 2,
        };
      }

      let globalOffsetX = 800;
      rootNodes.forEach((root: any) => {
        const currentSubtreeNodes = new Set<string>();
        const getSubtreeNodes = (n: any) => {
          if (currentSubtreeNodes.has(n.id)) return;
          currentSubtreeNodes.add(n.id);
          n.children.forEach(getSubtreeNodes);
        };
        positionDFS(root, 0);
        getSubtreeNodes(root);
        positionedSubtrees[root.id] = currentSubtreeNodes;
        let minXInSubtree = Infinity;
        for (const nodeId of currentSubtreeNodes) {
          if (positions[nodeId] && positions[nodeId].x < minXInSubtree) {
            minXInSubtree = positions[nodeId].x;
          }
        }
        const shiftX = globalOffsetX - minXInSubtree;
        for (const nodeId of currentSubtreeNodes) {
          if (positions[nodeId]) {
            positions[nodeId].x += shiftX;
          }
        }
        let maxXInSubtree = -Infinity;
        for (const nodeId of currentSubtreeNodes) {
          if (positions[nodeId] && positions[nodeId].x > maxXInSubtree) {
            maxXInSubtree = positions[nodeId].x;
          }
        }
        globalOffsetX = maxXInSubtree + NODE_X_GAP * 2;
      });
      return positions;
    };

    const finalPositions = positionWorkflowNodes(nodes);

    // ========== 2. Joiner Y-Position Adjustment (This part is also fine) ========== //
    for (const node of nodes) {
      if (node.type === 'joiner' && node.configs?.source?.length === 2) {
        const [sourceAId, sourceBId] = node.configs.source;
        const posA = finalPositions[sourceAId];
        const posB = finalPositions[sourceBId];
        const selfPos = finalPositions[node.id];
        if (posA && posB && selfPos) {
          const newY = Math.max(posA.y, posB.y) + 100;
          const yDelta = newY - selfPos.y;
          const visited = new Set<string>();
          const adjustDownstreamY = (currentId: string, offset: number) => {
            if (!currentId || visited.has(currentId)) return;
            visited.add(currentId);
            if (finalPositions[currentId])
              finalPositions[currentId].y += offset;
            const currentNode = nodeMap.get(currentId);
            if (!currentNode) return;
            if (currentNode.configs?.next_step_id)
              adjustDownstreamY(currentNode.configs.next_step_id, offset);
            if (currentNode.type === 'condition') {
              adjustDownstreamY(currentNode.configs.branch?.true, offset);
              adjustDownstreamY(currentNode.configs.branch?.false, offset);
            }
          };
          adjustDownstreamY(node.id, yDelta);
        }
      }
    }

    // ========== 3. DOM Rendering ========== //
    for (const node of nodes) {
      const pos = finalPositions[node.id];
      if (!pos) {
        console.error(
          `Position not found for node ${node.id}. Skipping render.`
        );
        continue;
      }
      const div = document.createElement('div');
      div.id = node.id;
      div.className = 'block';
      div.style.position = 'absolute';
      // Paste your original styling logic here to make the blocks look right
      div.style.height = 'fit-content';
      div.style.width = 'fit-content';
      div.style.backgroundColor = 'white';
      div.style.border = '1px solid #B2C1DA';
      div.style.borderRadius = '5px';
      div.style.padding = '10px';
      div.style.whiteSpace = 'nowrap';
      if (node.type === 'joiner') {
        div.style.height = '40px';
        div.style.width = '40px';
        div.style.padding = '0px';
        div.style.backgroundColor = 'black';
        div.style.color = 'transparent';
        div.style.border = 'none';
      } else if (node.type === 'branch') {
        const parent = nodeMap.get(node.configs.source[0]);
        div.innerText =
          parent?.configs.branch?.true === node.id ? 'TRUE' : 'FALSE';
      } else {
        div.innerText = node.subType || node.type;
      }
      this.canvasRef.nativeElement.appendChild(div);
    }

    // ========== 4. Final Centering & jsPlumb Management ========== //
    setTimeout(() => {
      for (const node of nodes) {
        const div = document.getElementById(node.id) as HTMLElement;
        if (!div) continue;
        const pos = finalPositions[node.id];
        const rect = div.getBoundingClientRect();
        div.style.left = `${pos.x - rect.width / 2}px`;
        div.style.top = `${pos.y - rect.height / 2}px`;
        this.instance.manage(div);
      }

      // ===================================================================
      // ========== 5. RESTORED Connectors with "+" button logic =========
      // ===================================================================
      const addedEdges = new Set<string>();
      const addConnection = (
        sourceId: string,
        targetId: string,
        anchors: [any, any],
        overlays: any[] = []
      ) => {
        if (!sourceId || !targetId) return;
        const key = `${sourceId}-->${targetId}`;
        if (addedEdges.has(key)) return;
        addedEdges.add(key);

        const sourceElement = document.getElementById(sourceId)!;
        const targetElement = document.getElementById(targetId)!;

        if (!sourceElement || !targetElement) {
          console.warn(
            `Could not find source (${sourceId}) or target (${targetId}) for connection.`
          );
          return;
        }

        this.instance.connect({
          source: sourceElement,
          target: targetElement,
          anchors,
          overlays,
          connector: { type: 'Flowchart', options: { cornerRadius: 5 } },
          paintStyle: { stroke: '#B2C1DA', strokeWidth: 2 },
          endpoint: 'Blank',
        });
      };

      for (const node of nodes) {
        if (node.type === 'condition') {
          addConnection(node.id, node.configs.branch.true, ['Bottom', 'Right']);
          addConnection(node.id, node.configs.branch.false, ['Bottom', 'Left']);
        } else if (node.type === 'joiner') {
          const [sourceA, sourceB] = node.configs.source;
          addConnection(sourceA, node.id, ['Bottom', 'Top']);
          addConnection(sourceB, node.id, ['Bottom', 'Top']);

          if (node.configs.next_step_id) {
            addConnection(
              node.id,
              node.configs.next_step_id,
              ['Bottom', 'Top'],
              [this.createPlusOverlay(node.id)] // Show plus after joiner
            );
          }
        } else if (node.configs.next_step_id) {
          // For all other nodes that have a next step
          addConnection(
            node.id,
            node.configs.next_step_id,
            ['Bottom', 'Top'],
            [this.createPlusOverlay(node.id)] // Show the plus overlay
          );
        }
      }
    }, 0);
  }

  // And remember to have your clearCanvas method
  // clearCanvas() {
  //   // A more robust clear method
  //   this.instance.deleteEveryEndpoint();
  //   this.instance.deleteEveryConnection();
  //   this.instance.reset();
  //   this.canvasRef.nativeElement.innerHTML = '';
  // }


  onDragStart(event: DragEvent, block: any) {
    event.dataTransfer?.setData('text', JSON.stringify(block));
  }

  createPlusOverlay(sourceId: string) {
    return {
      type: 'Custom',
      options: {
        create: () => {
          // Create wrapper div
          const wrapper = document.createElement('div');
          wrapper.style.width = '249px';
          wrapper.style.height = '66px';
          wrapper.style.borderRadius = '5px';
          wrapper.style.display = 'flex';
          wrapper.style.justifyContent = 'center';
          wrapper.style.alignItems = 'center';
          wrapper.style.pointerEvents = 'auto';
          wrapper.style.transition = 'all 0.2s ease';
          wrapper.style.background = 'transparent';
          wrapper.style.border = '1px dashed transparent';

          // Create + button
          const btn = document.createElement('button');
          btn.innerText = '+';
          btn.style.border = 'none';
          btn.style.borderRadius = '50%';
          btn.style.cursor = 'pointer';
          btn.style.zIndex = '1';
          btn.style.fontWeight = '700';
          btn.style.fontSize = '28px';
          btn.style.background = '#edf1f6'; // original background
          btn.style.color = '#B2C1DA'; // initial color

          // Pulse animation support
          const interval = setInterval(() => {
            const isDragging =
              document.body.classList.contains('dragging-block');
            btn.style.color = isDragging ? '#5b6b87' : '#B2C1DA';
            if (isDragging) {
              btn.classList.add('pulse-button');
            } else {
              btn.classList.remove('pulse-button');
            }
          }, 50);

          btn.onmouseleave = () => clearInterval(interval); // cleanup

          // Optional click handler
          btn.onclick = (e) => {
            e.stopPropagation();
            console.log('Clicked plus on connector from', sourceId);
          };

          // Handle drag over
          wrapper.ondragover = (e) => {
            e.preventDefault();
            wrapper.style.background = '#FAEBFF';
            wrapper.style.borderColor = '#a855f7';
            btn.style.background = 'transparent'; // change on dragover
          };

          // Handle drag leave
          wrapper.ondragleave = () => {
            wrapper.style.background = 'transparent';
            wrapper.style.borderColor = 'transparent';
            btn.style.background = '#edf1f6'; // restore original
          };

          // Handle drop
          wrapper.ondrop = (e) => {
            e.preventDefault();
            wrapper.style.background = 'transparent';
            wrapper.style.borderColor = 'transparent';
            btn.style.background = '#edf1f6'; // reset button bg on drop

            const droppedData = JSON.parse(e.dataTransfer!.getData('text'));
            this.handleDropOnPlus(sourceId, droppedData);
          };

          wrapper.appendChild(btn);
          return wrapper;
        },
        location: 0.5,
        id: 'plus',
      },
    };
  }

  handleDropOnPlus(sourceId: string, droppedBlock: any) {
    const timestamp = Date.now();
    const workflow_id = 'workflow1';
    const workspace_id = 'workspace1';
    const now = new Date().toISOString();

    const sourceNode = this.workflowData.find((n) => n.id === sourceId);
    const previousTargetId = sourceNode?.configs?.next_step_id || null;

    const isBranch = sourceNode?.type === 'branch';

    if (droppedBlock.blockType === 'condition') {
      const conditionId = 'uuid' + timestamp;
      const trueBranchId = 'uuid' + (timestamp + 1);
      const falseBranchId = 'uuid' + (timestamp + 2);
      const nestedJoinerId = 'joiner' + timestamp;

      // Create condition block
      const conditionBlock: any = {
        id: conditionId,
        workflow_id,
        workspace_id,
        type: 'condition',
        subType: droppedBlock.label,
        configs: {
          source: [sourceId],
          branch: {
            true: trueBranchId,
            false: falseBranchId,
          },
        },
        created_at: now,
        updated_at: now,
      };

      // Create true branch block
      const trueBranchBlock: any = {
        id: trueBranchId,
        workflow_id,
        workspace_id,
        type: 'branch',
        subType: null,
        configs: {
          source: [conditionId],
          next_step_id: nestedJoinerId,
        },
        created_at: now,
        updated_at: now,
      };

      // Create false branch block
      const falseBranchBlock: any = {
        id: falseBranchId,
        workflow_id,
        workspace_id,
        type: 'branch',
        subType: null,
        configs: {
          source: [conditionId],
          next_step_id: nestedJoinerId,
        },
        created_at: now,
        updated_at: now,
      };

      // Create nested joiner block
      const joinerBlock: any = {
        id: nestedJoinerId,
        workflow_id,
        workspace_id,
        type: 'joiner',
        subType: null,
        configs: {
          source: [trueBranchId, falseBranchId],
          next_step_id: previousTargetId,
        },
        created_at: now,
        updated_at: now,
      };

      // Update sourceNode to point to new condition block
      if (sourceNode) {
        sourceNode.configs.next_step_id = conditionId;
      }

      // If the previous target existed, update its source
      const previousTargetNode = this.workflowData.find(
        (n) => n.id === previousTargetId
      );

      if (previousTargetNode?.configs?.source) {
        previousTargetNode.configs.source =
          previousTargetNode.configs.source.map((src: string) =>
            src === sourceId ? nestedJoinerId : src
          );
      }

      this.workflowData.push(
        conditionBlock,
        trueBranchBlock,
        falseBranchBlock,
        joinerBlock
      );
    } else {
      // Insert normal action or delay block
      const newId = 'uuid' + timestamp;
      const newBlock: any = {
        id: newId,
        workflow_id,
        workspace_id,
        type: droppedBlock.blockType,
        subType: droppedBlock.label,
        configs: {
          source: [sourceId],
          next_step_id: previousTargetId,
        },
        created_at: now,
        updated_at: now,
      };

      if (sourceNode) {
        sourceNode.configs.next_step_id = newId;
      }

      // Fix source of next node
      const previousTargetNode = this.workflowData.find(
        (n) => n.id === previousTargetId
      );
      if (previousTargetNode?.configs?.source) {
        previousTargetNode.configs.source =
          previousTargetNode.configs.source.map((src: string) =>
            src === sourceId ? newId : src
          );
      }

      this.workflowData.push(newBlock);
    }

    setTimeout(() => {
      this.clearCanvas();
      this.renderWorkflow(this.workflowData);
    }, 50);
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;

    // Capture the current pan/zoom transform
    const transform = canvas.style.transform;

    // Clear jsPlumb and canvas children
    while (canvas.firstChild) {
      canvas.removeChild(canvas.firstChild);
    }
    this.instance.reset();

    // Restore panzoom transform
    canvas.style.transform = transform;
  }

  getAllEdgesDetailed(): any[] {
    const connections = this.instance.getConnections() as any[];

    return connections.map((conn: any) => ({
      sourceId: conn.sourceId,
      targetId: conn.targetId,
      anchors: conn.endpoints.map((ep: any) => ep.anchor?.type),
      overlays: Object.keys(conn.getOverlays?.() || {}),
    }));
  }
}
