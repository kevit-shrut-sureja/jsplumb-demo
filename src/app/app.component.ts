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
      position: { x: 800, y: 0 },
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
      position: { x: 800, y: 200 },
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

  renderWorkflow(nodes: any[]) {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // ========== 1. Positioning Logic Starts ========== //
    const positionWorkflowNodes = (rawNodes: any[]) => {
      const nodes = Object.fromEntries(rawNodes.map((n) => [n.id, { ...n }]));
      const childMap: Record<string, string[]> = {};
      const parentMap: Record<string, string[]> = {};

      Object.values(nodes).forEach((node: any) => {
        const id = node.id;
        const next = node.configs?.next_step_id;
        if (next) {
          childMap[id] = childMap[id] || [];
          childMap[id].push(next);
          parentMap[next] = parentMap[next] || [];
          parentMap[next].push(id);
        }

        if (node.type === 'condition' && node.configs?.branch) {
          const { true: trueBranch, false: falseBranch } = node.configs.branch;
          if (trueBranch) {
            childMap[id] = childMap[id] || [];
            childMap[id].push(trueBranch);
            parentMap[trueBranch] = parentMap[trueBranch] || [];
            parentMap[trueBranch].push(id);
          }
          if (falseBranch) {
            childMap[id] = childMap[id] || [];
            childMap[id].push(falseBranch);
            parentMap[falseBranch] = parentMap[falseBranch] || [];
            parentMap[falseBranch].push(id);
          }
        }
      });
      const rootNodes = Object.values(nodes).filter(
        (n: any) => !parentMap[n.id]
      );
      const positioned = new Set();
      const layerY = 200;
      const gapX = 300;
      const nodeWidths: Record<string, number> = {};
      let globalOffsetX = 0;

      function positionDFS(id: string, depth = 0, offsetX = 0): number {
        const children = childMap[id] || [];

        if (children.length === 0) {
          nodes[id].position = { x: offsetX, y: depth * layerY };
          nodeWidths[id] = 1;
          positioned.add(id);
          return 1;
        }

        let widthSum = 0;
        const childWidths: number[] = [];

        children.forEach((childId) => {
          const w = positionDFS(childId, depth + 1, offsetX + widthSum * gapX);
          childWidths.push(w);
          widthSum += w;
        });

        const childXs = children.map((cid) => nodes[cid].position.x);
        const centerX = (childXs[0] + childXs[childXs.length - 1]) / 2;

        nodes[id].position = { x: centerX, y: depth * layerY };
        nodeWidths[id] = widthSum;
        positioned.add(id);
        return widthSum;
      }

      rootNodes.forEach((root: any, index: number) => {
        const isTrigger = root.type === 'trigger';
        const startX = isTrigger ? 800 : globalOffsetX; // 👈 Set your desired trigger X here
        positionDFS(root.id, 0, startX);
        globalOffsetX = Math.max(
          globalOffsetX,
          startX + nodeWidths[root.id] * gapX + gapX
        );
      });

      Object.values(nodes).forEach((n: any) => {
        if (!n.position) {
          n.position = { x: globalOffsetX, y: 0 };
          globalOffsetX += gapX;
        }
      });

      // ✅ Write back final position to original workflowData
      Object.values(nodes).forEach((n: any) => {
        const original = rawNodes.find((r) => r.id === n.id);
        if (original) {
          original.position = n.position;
        }
      });

      return Object.values(nodes);
    };

    const positionedNodes = positionWorkflowNodes(nodes);
    const positions = Object.fromEntries(
      positionedNodes.map((n: any) => [n.id, n.position])
    );

    // ========== 2. Joiner & Downstream Adjustment ========== //
    for (const node of nodes) {
      if (node.type === 'joiner') {
        const [sourceA, sourceB] = node.configs.source;
        const posA = positions[sourceA];
        const posB = positions[sourceB];

        // Get condition this joiner relates to (could be nested)
        const findTopmostCondition = (childId: string): any => {
          const visited = new Set<string>();
          let currentId = childId;

          while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const parent = nodes.find((n) => {
              if (n.type !== 'condition') return false;
              return (
                n.configs.branch?.true === currentId ||
                n.configs.branch?.false === currentId
              );
            });

            if (parent) {
              currentId = parent.id;
            } else {
              break;
            }
          }

          // At this point, currentId is either the topmost condition or the original child
          return nodes.find(
            (n) => n.id === currentId && n.type === 'condition'
          );
        };

        const topCondition =
          findTopmostCondition(sourceA) || findTopmostCondition(sourceB);

        const centerX = topCondition
          ? positions[topCondition.id].x
          : (posA.x + posB.x) / 2;

        const centerY = Math.max(posA.y, posB.y) + 100;

        positions[node.id] = { x: centerX, y: centerY };

        const visited = new Set<string>();
        const positionDownstream = (
          id: string,
          parentX: number,
          parentY: number
        ) => {
          if (!id || visited.has(id)) return;
          visited.add(id);

          const child = nodeMap.get(id);
          if (!child) return;

          const x = parentX;
          const y = parentY + 150;
          positions[id] = { x, y };

          if (child.type === 'condition') {
            const trueBranch = child.configs?.branch?.true;
            const falseBranch = child.configs?.branch?.false;
            if (trueBranch) positionDownstream(trueBranch, x - 250, y);
            if (falseBranch) positionDownstream(falseBranch, x + 250, y);
          } else if (child.configs?.next_step_id) {
            positionDownstream(child.configs.next_step_id, x, y);
          }
        };

        if (node.configs.next_step_id) {
          positionDownstream(node.configs.next_step_id, centerX, centerY);
        }
      }
    }

    // ========== 3. DOM Cleanup & Rendering ========== //
    this.canvasRef.nativeElement.innerHTML = '';

    for (const node of nodes) {
      const pos = positions[node.id];
      const div = document.createElement('div');
      div.id = node.id;
      div.className = 'block';
      div.style.position = 'absolute';

      if (node.type === 'joiner') {
        div.style.height = '40px';
        div.style.width = '40px';
        div.style.padding = '0px';
        div.style.backgroundColor = 'black';
        div.style.color = 'transparent';
        div.style.border = 'none';
      } else {
        div.style.height = 'fit-content';
        div.style.width = 'fit-content';
        div.style.backgroundColor = 'white';
        div.style.borderWidth = '1px';
        div.style.borderColor = '#B2C1DA';
        div.style.borderStyle = 'solid';
        div.style.borderRadius = '5px';
        div.style.color = 'black';
        div.style.padding = '10px';
        div.style.whiteSpace = 'nowrap';
      }

      if (node.type === 'branch') {
        const parent = nodeMap.get(node.configs.source[0]);
        const label =
          parent?.configs.branch?.true === node.id ? 'TRUE' : 'FALSE';
        div.innerText = label;
      } else {
        div.innerText = node.subType;
      }

      this.canvasRef.nativeElement.appendChild(div);
    }

    // New: Advanced getConditionForJoiner, designed for N-level nested conditions
    const getConditionForJoiner = (joinerNode: any): any => {
      const sources: string[] = joinerNode.configs?.source || [];
      if (sources.length < 2) {
        return null;
      }

      const sourceAId = sources[0];
      const sourceBId = sources[1];

      // Helper function to get all direct parents of a node
      // (This 'getParents' needs to be defined in renderWorkflow's scope or passed in)
      const getParents = (nodeId: string): string[] => {
        const parents: string[] = [];
        // Assuming 'nodes' array from renderWorkflow scope is accessible here
        nodes.forEach((n: any) => {
          if (n.configs?.next_step_id === nodeId) {
            parents.push(n.id);
          }
          if (n.type === 'condition' && n.configs?.branch) {
            if (
              n.configs.branch.true === nodeId ||
              n.configs.branch.false === nodeId
            ) {
              parents.push(n.id);
            }
          }
        });
        return parents;
      };

      // Function to collect ALL unique ancestors with their path (not just depth)
      // This is a BFS-like traversal going upwards, recording parent chains.
      const collectAllAncestors = (startNodeId: string): Set<string> => {
        const ancestors = new Set<string>();
        const queue: string[] = [startNodeId];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          if (visited.has(currentId)) continue;
          visited.add(currentId);

          if (currentId !== startNodeId) {
            // Only add true ancestors, not the starting node itself
            ancestors.add(currentId);
          }

          const parents = getParents(currentId);
          parents.forEach((pId) => {
            if (!visited.has(pId)) {
              queue.push(pId);
            }
          });
        }
        return ancestors;
      };

      const ancestorsA = collectAllAncestors(sourceAId);
      const ancestorsB = collectAllAncestors(sourceBId);

      let lowestCommonCondition: any = null;
      let maxCommonConditionY = -Infinity; // To find the "lowest" (highest Y) common condition

      // Iterate through all nodes to find common condition ancestors
      for (const node of nodes) {
        // Assuming 'nodes' array from renderWorkflow scope is accessible here
        if (
          node.type === 'condition' &&
          ancestorsA.has(node.id) &&
          ancestorsB.has(node.id)
        ) {
          const nodePos = positions[node.id]; // 'positions' map must be available here
          if (nodePos && nodePos.y > maxCommonConditionY) {
            maxCommonConditionY = nodePos.y;
            lowestCommonCondition = node;
          }
        }
      }

      return lowestCommonCondition;
    };

    // Example usage within your renderWorkflow (replacing the old findTopmostCondition logic):
    // ... (inside renderWorkflow)

    // In the "Joiner & Downstream Adjustment" section:

    for (const node of nodes) {
      if (node.type === 'joiner') {
        // const [sourceA, sourceB] = node.configs.source; // Not strictly needed here, as getConditionForJoiner uses it

        const conditionNode = getConditionForJoiner(node); // Use the improved function

        const joinerPos = positions[node.id];

        if (conditionNode) {
          const conditionPos = positions[conditionNode.id];

          if (joinerPos.x !== conditionPos.x) {
            console.log(
              `🔁 Overriding Joiner [${node.id}] X from ${joinerPos.x} to match Condition [${conditionNode.id}] X = ${conditionPos.x}`
            );
            positions[node.id].x = conditionPos.x;

            // Propagate this X change to downstream nodes from the joiner
            const adjustDownstreamX = (
              currentId: string,
              newX: number,
              adjustmentVisited = new Set<string>()
            ) => {
              if (adjustmentVisited.has(currentId)) return;
              adjustmentVisited.add(currentId);

              if (positions[currentId]) {
                positions[currentId].x = newX;
              }

              const nodeToAdjust = nodeMap.get(currentId);
              if (nodeToAdjust) {
                // If it's a condition downstream, its branches might need relative adjustments
                if (nodeToAdjust.type === 'condition') {
                  const trueBranch = nodeToAdjust.configs?.branch?.true;
                  const falseBranch = nodeToAdjust.configs?.branch?.false;
                  // These offsets (e.g., -250, +250) are arbitrary and depend on your desired visual spread.
                  // You might need to make them dynamic based on subtree widths or fixed.
                  if (trueBranch)
                    adjustDownstreamX(
                      trueBranch,
                      newX - 250,
                      adjustmentVisited
                    );
                  if (falseBranch)
                    adjustDownstreamX(
                      falseBranch,
                      newX + 250,
                      adjustmentVisited
                    );
                } else if (nodeToAdjust.configs?.next_step_id) {
                  adjustDownstreamX(
                    nodeToAdjust.configs.next_step_id,
                    newX,
                    adjustmentVisited
                  );
                }
              }
            };

            if (node.configs.next_step_id) {
              adjustDownstreamX(
                node.configs.next_step_id,
                conditionPos.x,
                new Set<string>()
              );
            }
          } else {
            console.log(
              `✅ Joiner [${node.id}] already aligned with Condition [${conditionNode.id}] at X = ${conditionPos.x}`
            );
          }
        } else {
          console.log(
            `⚠️ Joiner [${node.id}] at (x=${joinerPos.x}, y=${joinerPos.y}) has no associated condition`
          );
        }
        // Ensure Y position is below the max of its sources, as before
        const posA = positions[node.configs.source[0]];
        const posB = positions[node.configs.source[1]];
        positions[node.id].y = Math.max(posA.y, posB.y) + 150;
      }
    }

    for (const node of nodes) {
      const div = document.getElementById(node.id)!;
      const rect = div.getBoundingClientRect();
      const parentRect = this.canvasRef.nativeElement.getBoundingClientRect();
      const { x, y } = positions[node.id];

      div.style.left = `${x - rect.width / 2 - (parentRect.left - 10)}px`;
      div.style.top = `${y}px`;
      this.instance.manage(div);
    }

    // ========== 4. Connectors with Deduplication ========== //
    const addedEdges = new Set<string>(); // Track edges: `${sourceId}-->${targetId}`

    const addConnection = (
      sourceId: string,
      targetId: string,
      anchors: [any, any],
      overlays: any[] = []
    ) => {
      const key = `${sourceId}-->${targetId}`;
      if (addedEdges.has(key)) return;
      addedEdges.add(key);

      this.instance.connect({
        source: document.getElementById(sourceId)!,
        target: document.getElementById(targetId)!,
        anchors,
        overlays,
      });
    };

    for (const node of nodes) {
      if (node.type === 'condition') {
        addConnection(node.id, node.configs.branch.true, ['Bottom', 'Right']);
        addConnection(node.id, node.configs.branch.false, ['Bottom', 'Left']);
      } else if (node.type === 'joiner') {
        const [sourceA, sourceB] = node.configs.source;
        addConnection(
          sourceA,
          node.id,
          ['Bottom', 'Left'],
          [this.createPlusOverlay(sourceA)]
        );
        addConnection(
          sourceB,
          node.id,
          ['Bottom', 'Right'],
          [this.createPlusOverlay(sourceB)]
        );

        if (node.configs.next_step_id) {
          addConnection(
            node.id,
            node.configs.next_step_id,
            ['Bottom', 'Top'],
            [this.createPlusOverlay(node.id)]
          );
        }
      } else if (
        node.configs.next_step_id &&
        nodeMap.get(node.configs.next_step_id)?.type !== 'joiner'
      ) {
        const shouldShowPlus = node.type !== 'condition';
        addConnection(
          node.id,
          node.configs.next_step_id,
          ['Bottom', 'Top'],
          shouldShowPlus ? [this.createPlusOverlay(node.id)] : []
        );
      }
    }

    // ✅ Final alignment: snap all joiners to the X of their condition
    for (const node of nodes) {
      if (node.type === 'joiner') {
        const conditionNode = getConditionForJoiner(node);
        const joinerPos = positions[node.id];
    
        if (conditionNode) {
          const conditionPos = positions[conditionNode.id];
          if (joinerPos.x !== conditionPos.x) {
            positions[node.id].x = conditionPos.x;
    
            // ✅ Update DOM position for joiner
            const div = document.getElementById(node.id);
            if (div) {
              const rect = div.getBoundingClientRect();
              const parentRect = this.canvasRef.nativeElement.getBoundingClientRect();
              div.style.left = `${conditionPos.x - rect.width / 2 - (parentRect.left - 10)}px`;
            }
          }
        }
    
        // ✅ Now align next block using new joiner X
        const nextId = node.configs?.next_step_id;
        const nextNode = nodeMap.get(nextId);
        if (nextId && nextNode?.type !== 'joiner') {
          const nextY = positions[node.id].y + 200;
          if (nextNode.type === 'condition') {
            positions[nextId] = { x: positions[node.id].x, y: nextY };
    
            // TRUE/FALSE branches
            const trueId = nextNode.configs?.branch?.true;
            const falseId = nextNode.configs?.branch?.false;
    
            if (trueId) {
              positions[trueId] = { x: positions[nextId].x - 250, y: nextY + 200 };
            }
            if (falseId) {
              positions[falseId] = { x: positions[nextId].x + 250, y: nextY + 200 };
            }
          } else {
            // Linear block (action, etc.)
            positions[nextId] = { x: positions[node.id].x, y: nextY };
          }
        }
            const div = document.getElementById(nextId);
    if (div) {
      const rect = div.getBoundingClientRect();
      const parentRect = this.canvasRef.nativeElement.getBoundingClientRect();
      div.style.left = `${positions[nextId].x - rect.width / 2 - (parentRect.left - 10)}px`;
      div.style.top = `${positions[nextId].y}px`;
    }
    
      }
    }
    

    // ✅ Final pass: Push joiner's X to its immediate non-joiner next block
    const positionSubTreeFrom = (startId: string, parentX: number, parentY: number): number => {
      const visited = new Set<string>();
    
      const dfs = (id: string, x: number, y: number): number => {
        if (visited.has(id)) return 0;
        visited.add(id);
    
        const node = nodeMap.get(id);
        if (!node) return 0;
    
        positions[id] = { x, y };
    
        if (node.type === 'condition') {
          const trueId = node.configs?.branch?.true;
          const falseId = node.configs?.branch?.false;
          const nextY = y + 200;
          let width = 0;
    
          if (trueId) {
            const w = dfs(trueId, x - 250, nextY);
            width += w;
          }
          if (falseId) {
            const w = dfs(falseId, x + 250, nextY);
            width += w;
          }
    
          return Math.max(width, 1);
        } else if (node.configs?.next_step_id) {
          const nextId = node.configs.next_step_id;
          const nextNode = nodeMap.get(nextId);
    
          // 🛑 Stop layout if next is another joiner
          if (nextNode?.type === 'joiner') return 0;
    
          return dfs(nextId, x, y + 200);
        }
    
        return 1;
      };
    
      return dfs(startId, parentX, parentY + 200);
    };
    
    
    
    // Apply reflow from each joiner's next step (only if it's NOT another joiner)
    for (const node of nodes) {
      if (node.type === 'joiner' && node.configs?.next_step_id) {
        const nextId = node.configs.next_step_id;
        const nextNode = nodeMap.get(nextId);
    
        if (nextNode?.type !== 'joiner') {
          const joinerPos = positions[node.id];
          positionSubTreeFrom(nextId, joinerPos.x, joinerPos.y);
        }
      }
    }
    
  
    setTimeout(() => {
      this.instance.repaintEverything();
    }, 0)
  }

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
