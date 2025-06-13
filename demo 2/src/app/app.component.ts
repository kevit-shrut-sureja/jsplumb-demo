import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { newInstance, BrowserJsPlumbInstance } from '@jsplumb/browser-ui';
import panzoom from 'panzoom';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  instance!: BrowserJsPlumbInstance;

  workflowData = [
    {
      id: 'uuid1',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'trigger',
      subType: 'send_mail',
      configs: {
        source: null,
        next_step_id: 'uuid2',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid2',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'action',
      subType: 'add_tag',
      configs: {
        source: ['uuid1'],
        next_step_id: 'uuid3',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid3',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'condition',
      subType: 'message_delivered',
      configs: {
        source: ['uuid2'],
        branch: {
          true: 'uuid4',
          false: 'uuid5',
        },
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid4', // TRUE branch of first condition
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'branch',
      subType: null,
      configs: {
        source: ['uuid3'],
        next_step_id: 'uuid7', // Leads to nested condition
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid5', // FALSE branch of first condition
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'branch',
      subType: null,
      configs: {
        source: ['uuid3'],
        next_step_id: 'uuid101', // Directly to exit
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid7',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'condition',
      subType: 'link_clicked',
      configs: {
        source: ['uuid4'],
        branch: {
          true: 'uuid8',
          false: 'uuid9',
        },
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid8', // TRUE branch of nested condition
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'branch',
      subType: null,
      configs: {
        source: ['uuid7'],
        next_step_id: 'joiner1',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid9', // FALSE branch of nested condition
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'branch',
      subType: null,
      configs: {
        source: ['uuid7'],
        next_step_id: 'joiner1',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'joiner1', // FALSE branch of nested condition
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'joiner',
      subType: null,
      configs: {
        source: ['uuid8', 'uuid9'],
        next_step_id: 'uuid10',
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid10',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'action',
      subType: 'exit',
      configs: {
        source: ['uuid8', 'uuid9'],
        next_step_id: null,
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
    {
      id: 'uuid101',
      workflow_id: 'workflow1',
      workspace_id: 'workspace1',
      type: 'action',
      subType: 'exit',
      configs: {
        source: 'uuid5',
        next_step_id: null,
      },
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z',
    },
  ];

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

    panzoom(this.canvasRef.nativeElement, {
      zoomSpeed: 0.065,
      maxZoom: 3,
      minZoom: 0.3,
      smoothScroll: false,
    });
  }

  renderWorkflow(nodes: any[]) {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const positions: Record<string, { x: number; y: number }> = {};
    const spacingY = 200;
    const baseX = 500;

    const getPosition = (
      nodeId: string,
      parentX: number = baseX,
      depth: number = 0,
      branchDirection: 'center' | 'left' | 'right' = 'center'
    ): { x: number; y: number } => {
      if (positions[nodeId]) return positions[nodeId];

      const node = nodeMap.get(nodeId);
      if (!node) return { x: parentX, y: depth * spacingY };

      // Branch offset logic
      let offsetX = 0;
      if (branchDirection === 'left') offsetX = -250;
      if (branchDirection === 'right') offsetX = 250;

      const x = parentX + offsetX;
      const y = depth * spacingY;
      positions[nodeId] = { x, y };

      // Now recurse based on node type
      if (node.type === 'condition') {
        const trueChild = node.configs?.branch?.true;
        const falseChild = node.configs?.branch?.false;
        if (trueChild) getPosition(trueChild, x, depth + 1, 'left');
        if (falseChild) getPosition(falseChild, x, depth + 1, 'right');
      } else if (node.configs?.next_step_id) {
        getPosition(node.configs.next_step_id, x, depth + 1, 'center');
      }

      return positions[nodeId];
    };

    // Compute positions
    // Entry node – the trigger or root node
    const startNode = nodes.find(
      (n) =>
        !Object.values(nodeMap).some(
          (p) =>
            p.configs?.next_step_id === n.id ||
            p.configs?.branch?.true === n.id ||
            p.configs?.branch?.false === n.id
        )
    );

    if (startNode) {
      getPosition(startNode.id, baseX, 0, 'center');
    }

    // Step 1: Force compute all paths before we adjust the exit
    const exitNode = nodes.find(
      (n) => n.type === 'action' && n.subType === 'exit'
    );

    if (exitNode) {
      const sources = exitNode.configs.source;
      const xs = sources.map((id: string) => positions[id]?.x || 0);
      const ys = sources.map((id: string) => positions[id]?.y || 0);

      const avgX = xs.reduce((sum: any, x: any) => sum + x, 0) / xs.length;
      const maxY = Math.max(...ys);

      for (const node of nodes) {
        if (node.type === 'joiner') {
          const [sourceA, sourceB] = node.configs.source;
          const posA = positions[sourceA];
          const posB = positions[sourceB];

          const centerX = ((posA.x + posB.x) / 2) + 60;
          const centerY = Math.max(posA.y, posB.y) + 150;

          positions[node.id] = { x: centerX, y: centerY };
        }
      }
    }

    // Render blocks
    for (const node of nodes) {
      const pos = positions[node.id];
      const div = document.createElement('div');
      div.id = node.id;
      div.className = 'block';
      div.style.position = 'absolute';
      if (node.type === 'joiner') {
        div.style.height = '0px';
        div.style.width = '0px';
        div.style.padding = '0px';
        div.style.backgroundColor = 'transparent';
        div.style.color = 'transparent';
        div.style.border = 'none';
      } else {
        div.style.height = '40px';
        div.style.width = '100px';
        div.style.backgroundColor = 'red';
        div.style.color = 'white';
        div.style.padding = '10px';
      }

      div.style.left = pos.x + 'px';
      div.style.top = pos.y + 'px';

      if (node.type === 'branch') {
        const parent = nodeMap.get(node.configs.source[0]);
        const label =
          parent?.configs.branch?.true === node.id ? 'TRUE' : 'FALSE';
        div.innerText = label;
      } else {
        div.innerText = `${node.type.toUpperCase()}${
          node.subType ? ' (' + node.subType + ')' : ''
        }`;
      }

      this.canvasRef.nativeElement.appendChild(div);
      this.instance.manage(div);
    }

    console.log(nodes);
    // Step 2: Create connections
    for (const node of nodes) {
      if (node.type === 'condition') {
        // TRUE
        this.instance.connect({
          source: document.getElementById(node.id)!,
          target: document.getElementById(node.configs.branch.true)!,
          anchors: ['Bottom', 'Right'],
        });
    
        // FALSE
        this.instance.connect({
          source: document.getElementById(node.id)!,
          target: document.getElementById(node.configs.branch.false)!,
          anchors: ['Bottom', 'Left'],
        });
      } else if (node.type === 'joiner') {
        const [sourceA, sourceB] = node.configs.source;
    
        // sourceA → joiner (with +)
        this.instance.connect({
          source: document.getElementById(sourceA)!,
          target: document.getElementById(node.id)!,
          anchors: ['Bottom', 'Left'],
          overlays: [this.createPlusOverlay(sourceA)],
        });
    
        // sourceB → joiner (with +)
        this.instance.connect({
          source: document.getElementById(sourceB)!,
          target: document.getElementById(node.id)!,
          anchors: ['Bottom', 'Right'],
          overlays: [this.createPlusOverlay(sourceB)],
        });
    
        // joiner → next (with +)
        if (node.configs.next_step_id) {
          this.instance.connect({
            source: document.getElementById(node.id)!,
            target: document.getElementById(node.configs.next_step_id)!,
            anchors: ['Bottom', 'Top'],
            overlays: [this.createPlusOverlay(node.id)],
          });
        }
      } else if (
        node.configs.next_step_id &&
        nodeMap.get(node.configs.next_step_id)?.type !== 'joiner'
      ) {
        const shouldShowPlus = node.type !== 'condition';
    
        this.instance.connect({
          source: document.getElementById(node.id)!,
          target: document.getElementById(node.configs.next_step_id)!,
          anchors: ['Bottom', 'Top'],
          overlays: shouldShowPlus ? [this.createPlusOverlay(node.id)] : [],
        });
      }
    }
    
  }

  createPlusOverlay(sourceId: string) {
    return {
      type: 'Custom',
      options: {
        create: () => {
          const btn = document.createElement('button');
          btn.innerText = '+';
          btn.style.background = 'green';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '50%';
          btn.style.width = '20px';
          btn.style.height = '20px';
          btn.style.cursor = 'pointer';
          btn.onclick = (e) => {
            e.stopPropagation();
            console.log('Clicked plus on connector from', sourceId);
          };
          return btn;
        },
        location: 0.5,
        id: 'plus',
      },
    };
  }
  
}
