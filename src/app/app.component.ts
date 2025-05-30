import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { newInstance, BrowserJsPlumbInstance } from '@jsplumb/browser-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  instance!: BrowserJsPlumbInstance;
  idCounter = 1;
  dragData: any = null;

  triggerBlock = { id: 'trigger', label: 'Trigger', left: 600, top: 50 };
  exitBlock = { id: 'exit', label: 'Exit', left: 600, top: 300 };
  flowBlocks: any[] = [];

  actionBlocks = [
    { name: 'Send WhatsApp Template', label: 'Action' },
    { name: 'Send Email', label: 'Action' },
    { name: 'Assign to Team member', label: 'Action' },
    { name: 'Add Tag', label: 'Action' },
    { name: 'Change Lead Stage', label: 'Action' },
    { name: 'Create Note', label: 'Action' },
    { name: 'Delay Step', label: 'Action' },
    { name: 'Exit Workflow', label: 'Action' },
  ];

  conditionBlocks = [
    { name: 'Message Delivered ?', label: 'Condition' },
    { name: 'Message Seen ?', label: 'Condition' },
    { name: 'Email Delivered ?', label: 'Condition' },
    { name: 'Email Opened ?', label: 'Condition' },
    { name: 'Custom Condition', label: 'Condition' },
  ];

  ngAfterViewInit() {
    const container = document.getElementById('board')!;
    this.instance = newInstance({ container });

    this.renderBlock(this.triggerBlock);
    this.renderBlock(this.exitBlock);
    this.rebuildConnections();
  }

  dragStart(event: DragEvent, block: any) {
    console.log('drag startt')
    // Store the block data as JSON string in the drag event's dataTransfer
    event.dataTransfer?.setData('application/json', JSON.stringify(block));
    this.dragData = { block };
  }

  dragOver(event: DragEvent) {
    // This fires continuously while dragging over the board
    // You can add throttling or conditional logic here
    console.log('Dragging over board...', event.clientX, event.clientY);
  }

  dropBlock(event: MouseEvent) {
    console.log('dropped')
    if (!this.dragData) return;
  
    const board = document.getElementById('board')!;
    const boardRect = board.getBoundingClientRect();
  
    const triggerEl = document.getElementById(this.triggerBlock.id)!;
    const triggerRect = triggerEl.getBoundingClientRect();
  
    const id = `block_${this.idCounter++}`;
    const newBlock = {
      id,
      label: this.dragData.block.label,
      name: this.dragData.block.name,
      left: 0,
      top: 0, // temp, will be recalculated
    };
  
    // Get Y of drop relative to triggerBlock
    const dropY = event.clientY - boardRect.top;
  
    // Find the correct insert index based on current top values
    const insertIndex = this.flowBlocks.findIndex((b) => dropY < b.top);
  
    if (insertIndex === -1) {
      this.flowBlocks.push(newBlock);
    } else {
      this.flowBlocks.splice(insertIndex, 0, newBlock);
    }
  
    // Now re-layout all blocks (with fixed 50px spacing from previous block)
    let currentTop = this.triggerBlock.top + 150;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  
    for (const block of this.flowBlocks) {
      block.top = currentTop;
      const el = document.getElementById(block.id);
      if (el) {
        const blockRect = el.getBoundingClientRect();
        const alignedLeft = triggerCenterX - blockRect.width / 2 - boardRect.left;
        block.left = alignedLeft;
        el.style.top = `${block.top}px`;
        el.style.left = `${block.left}px`;
      }
      currentTop += 150;
    }
  
    // Position exit block 50px after last block or after trigger
    this.exitBlock.top = currentTop;
    const exitEl = document.getElementById(this.exitBlock.id);
    if (exitEl) {
      const exitRect = exitEl.getBoundingClientRect();
      const alignedLeft = triggerCenterX - exitRect.width / 2 - boardRect.left;
      this.exitBlock.left = alignedLeft;
      exitEl.style.top = `${this.exitBlock.top}px`;
      exitEl.style.left = `${this.exitBlock.left}px`;
    }
  
    // Render the new block after DOM update
    this.renderBlock(newBlock, () => {
      // Align new block to trigger center after rendering (to avoid undefined width)
      const newEl = document.getElementById(newBlock.id)!;
      const newRect = newEl.getBoundingClientRect();
      newBlock.left = triggerCenterX - newRect.width / 2 - boardRect.left;
      newEl.style.left = `${newBlock.left}px`;
  
      this.rebuildConnections();
    });
  
    this.dragData = null;
  }
  
  
  
  

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  renderBlock(block: any, callback?: () => void) {
    setTimeout(() => {
      const el = document?.getElementById(block.id)!;
      el.style.position = 'absolute';
      el.style.left = `${block.left}px`;
      el.style.top = `${block.top}px`;

      // Add target endpoint at the top
      this.instance.addEndpoint(el, {
        anchor: 'Top',
        endpoint: 'Blank',
        paintStyle: { fill: '#e74c3c' },
        target: true,
      });

      if (block.label === 'Condition') {
        // Two source endpoints for Condition block at BottomLeft and BottomRight
        this.instance.addEndpoint(el, {
          anchor: 'BottomLeft',
          endpoint: 'Blank',
          paintStyle: { fill: '#2ecc71' },
          source: true,
        });
        this.instance.addEndpoint(el, {
          anchor: 'BottomRight',
          endpoint: 'Blank',
          paintStyle: { fill: '#2ecc71' },
          source: true,
        });
      } else {
        // Normal blocks get one source endpoint at Bottom
        this.instance.addEndpoint(el, {
          anchor: 'Bottom',
          endpoint: 'Blank',
          paintStyle: { fill: '#2ecc71' },
          source: true,
        });
      }

      // this.instance.isDraggable(el);
      this.instance.setDraggable(el, false);

      if (callback) callback();
    }, 10);
  }

  rebuildConnections() {
    this.instance.deleteEveryConnection();

    const orderedFlow = [...this.flowBlocks].sort((a, b) => a.top - b.top);
    const sequence = [this.triggerBlock, ...orderedFlow, this.exitBlock];

    for (let i = 0; i < sequence.length - 1; i++) {
      const sourceBlock = sequence[i];
      const targetBlock = sequence[i + 1];

      const sourceEl = document.getElementById(sourceBlock.id);
      const targetEl = document.getElementById(targetBlock.id);

      if (sourceEl && targetEl) {
        if (sourceBlock.label === 'Condition') {
          // Connect BOTH bottom endpoints to the next block

          const endpoints = this.instance.getEndpoints(sourceEl);

          // Filter source endpoints on BottomLeft and BottomRight
          const sourceEndpoints = endpoints.filter((ep) => {
            const anchor = ep._anchor as any; // cast to any to avoid TS error
            return (
              anchor.type === 'Bottom' &&
              (anchor.position?.[0] === 0 || anchor.position?.[0] === 1)
            );
          });

          // Fallback if filtering fails (just connect all source endpoints)
          const sources = sourceEndpoints.length
            ? sourceEndpoints
            : endpoints.filter((ep) => ep.isSource);

          sources.forEach((ep) => {
            const anchor = ep._anchor as any;
            this.instance.connect({
              source: ep,
              target: targetEl,
              connector: 'Flowchart',
              anchors: [anchor.type, 'Top'],
              overlays: [
                {
                  type: 'Arrow',
                  options: { location: 1, width: 10, length: 10 },
                },
              ],
            });
          });
        } else {
          // Normal single connection for other blocks
          this.instance.connect({
            source: sourceEl,
            target: targetEl,
            anchors: ['Bottom', 'Top'],
            connector: 'Flowchart',
            overlays: [
              {
                type: 'Arrow',
                options: { location: 1, width: 10, length: 10 },
              },
            ],
          });
        }
      }
    }
  }
}
