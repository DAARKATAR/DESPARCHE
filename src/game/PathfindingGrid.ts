import { Wall, Door, Barricade } from '../types/game';

export class PathfindingGrid {
  public cellSize: number = 40;
  public cols: number = 50; // 2000 / 40
  public rows: number = 45; // 1800 / 40

  // 1D arrays for high cache performance
  private staticBlocked: Uint8Array;
  private currentBlocked: Uint8Array;
  private distances: Int32Array;
  private flowX: Float32Array;
  private flowY: Float32Array;

  private lastTargetCellX: number = -1;
  private lastTargetCellY: number = -1;
  private lastComputeTime: number = 0;

  // Cached walls and doors for fast Line of Sight raycasting
  private solidWalls: Wall[] = [];
  private activeDoors: Door[] = [];

  constructor() {
    const totalCells = this.cols * this.rows;
    this.staticBlocked = new Uint8Array(totalCells);
    this.currentBlocked = new Uint8Array(totalCells);
    this.distances = new Int32Array(totalCells);
    this.flowX = new Float32Array(totalCells);
    this.flowY = new Float32Array(totalCells);
  }

  public init(walls: Wall[]) {
    this.solidWalls = walls.filter(w => w.isSolid);
    this.staticBlocked.fill(0);

    // Margin buffer so zombies don't rub against walls (zombie radius is ~16)
    const margin = 14;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cellX = c * this.cellSize;
        const cellY = r * this.cellSize;
        const cx = cellX + this.cellSize / 2;
        const cy = cellY + this.cellSize / 2;
        const idx = r * this.cols + c;

        // Map boundary check
        if (cellX < 120 || cellX + this.cellSize > 1880 || cellY < 120 || cellY + this.cellSize > 1580) {
          this.staticBlocked[idx] = 1;
          continue;
        }

        // Check intersection with static walls
        for (const w of this.solidWalls) {
          if (
            cx + this.cellSize / 2 + margin > w.x &&
            cx - this.cellSize / 2 - margin < w.x + w.w &&
            cy + this.cellSize / 2 + margin > w.y &&
            cy - this.cellSize / 2 - margin < w.y + w.h
          ) {
            this.staticBlocked[idx] = 1;
            break;
          }
        }
      }
    }
  }

  public updateDynamicObstacles(doors: Door[], barricades: Barricade[]) {
    this.activeDoors = doors;
    // Copy static blocked into current blocked
    this.currentBlocked.set(this.staticBlocked);

    // Block cells of closed doors
    for (const d of doors) {
      if (!d.isOpen) {
        const startC = Math.max(0, Math.floor((d.x - 10) / this.cellSize));
        const endC = Math.min(this.cols - 1, Math.floor((d.x + d.w + 10) / this.cellSize));
        const startR = Math.max(0, Math.floor((d.y - 10) / this.cellSize));
        const endR = Math.min(this.rows - 1, Math.floor((d.y + d.h + 10) / this.cellSize));

        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            this.currentBlocked[r * this.cols + c] = 1;
          }
        }
      }
    }

    // Block cells of intact window barricades
    for (const b of barricades) {
      if (b.planks > 0) {
        const startC = Math.max(0, Math.floor((b.x - 5) / this.cellSize));
        const endC = Math.min(this.cols - 1, Math.floor((b.x + b.w + 5) / this.cellSize));
        const startR = Math.max(0, Math.floor((b.y - 5) / this.cellSize));
        const endR = Math.min(this.rows - 1, Math.floor((b.y + b.h + 5) / this.cellSize));

        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            this.currentBlocked[r * this.cols + c] = 1;
          }
        }
      }
    }
  }

  public updatePlayerFlowField(targetX: number, targetY: number, force: boolean = false) {
    const now = performance.now();
    const targetCellX = Math.max(0, Math.min(this.cols - 1, Math.floor(targetX / this.cellSize)));
    const targetCellY = Math.max(0, Math.min(this.rows - 1, Math.floor(targetY / this.cellSize)));

    // Recompute if target moved cells or 120ms elapsed
    if (!force && targetCellX === this.lastTargetCellX && targetCellY === this.lastTargetCellY && (now - this.lastComputeTime < 120)) {
      return;
    }

    this.lastTargetCellX = targetCellX;
    this.lastTargetCellY = targetCellY;
    this.lastComputeTime = now;

    // Reset distance array with -1 (unvisited)
    this.distances.fill(-1);
    this.flowX.fill(0);
    this.flowY.fill(0);

    // Find nearest walkable seed cell if target is blocked (e.g. near wall)
    let startIdx = targetCellY * this.cols + targetCellX;
    if (this.currentBlocked[startIdx] === 1) {
      let found = false;
      for (let dist = 1; dist <= 3 && !found; dist++) {
        for (let dr = -dist; dr <= dist && !found; dr++) {
          for (let dc = -dist; dc <= dist; dc++) {
            const tr = targetCellY + dr;
            const tc = targetCellX + dc;
            if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols) {
              const testIdx = tr * this.cols + tc;
              if (this.currentBlocked[testIdx] === 0) {
                startIdx = testIdx;
                found = true;
                break;
              }
            }
          }
        }
      }
    }

    // BFS Queue
    const queue: number[] = [startIdx];
    this.distances[startIdx] = 0;

    let head = 0;
    const dirs = [
      [0, -1, 10], // Up
      [0, 1, 10],  // Down
      [-1, 0, 10], // Left
      [1, 0, 10],  // Right
      [-1, -1, 14], // Up-Left
      [1, -1, 14],  // Up-Right
      [-1, 1, 14],  // Down-Left
      [1, 1, 14],   // Down-Right
    ];

    while (head < queue.length) {
      const currIdx = queue[head++];
      const currC = currIdx % this.cols;
      const currR = Math.floor(currIdx / this.cols);
      const currDist = this.distances[currIdx];

      for (let i = 0; i < dirs.length; i++) {
        const [dc, dr, cost] = dirs[i];
        const nc = currC + dc;
        const nr = currR + dr;

        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;

        const nextIdx = nr * this.cols + nc;
        if (this.currentBlocked[nextIdx] === 1) continue;

        // Diagonal corner cutting check: both cardinal neighbors must be open
        if (dc !== 0 && dr !== 0) {
          const adj1 = currR * this.cols + nc;
          const adj2 = nr * this.cols + currC;
          if (this.currentBlocked[adj1] === 1 || this.currentBlocked[adj2] === 1) {
            continue;
          }
        }

        const newDist = currDist + cost;
        if (this.distances[nextIdx] === -1 || newDist < this.distances[nextIdx]) {
          this.distances[nextIdx] = newDist;
          queue.push(nextIdx);
        }
      }
    }

    // Compute Flow Direction Vector for each cell pointing towards neighbor with lowest distance
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        if (this.currentBlocked[idx] === 1 || this.distances[idx] <= 0) continue;

        let bestDist = this.distances[idx];
        let bestDx = 0;
        let bestDy = 0;

        for (let i = 0; i < dirs.length; i++) {
          const [dc, dr] = dirs[i];
          const nc = c + dc;
          const nr = r + dr;

          if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
          const nIdx = nr * this.cols + nc;
          const nDist = this.distances[nIdx];

          if (nDist >= 0 && nDist < bestDist) {
            // Diagonal safety check
            if (dc !== 0 && dr !== 0) {
              const adj1 = r * this.cols + nc;
              const adj2 = nr * this.cols + c;
              if (this.currentBlocked[adj1] === 1 || this.currentBlocked[adj2] === 1) {
                continue;
              }
            }
            bestDist = nDist;
            bestDx = dc;
            bestDy = dr;
          }
        }

        if (bestDx !== 0 || bestDy !== 0) {
          const len = Math.hypot(bestDx, bestDy);
          this.flowX[idx] = bestDx / len;
          this.flowY[idx] = bestDy / len;
        }
      }
    }
  }

  public getFlowVector(worldX: number, worldY: number): { x: number; y: number } | null {
    const c = Math.floor(worldX / this.cellSize);
    const r = Math.floor(worldY / this.cellSize);

    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return null;

    const idx = r * this.cols + c;
    const fx = this.flowX[idx];
    const fy = this.flowY[idx];

    if (fx === 0 && fy === 0) return null;
    return { x: fx, y: fy };
  }

  // Fast Line-of-Sight check using Line-Segment vs Box Intersections
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist > 750) return false; // Fog / max direct vision limit

    // Check solid walls
    for (const w of this.solidWalls) {
      if (this.lineIntersectsRect(x1, y1, x2, y2, w.x - 8, w.y - 8, w.w + 16, w.h + 16)) {
        return false;
      }
    }

    // Check closed doors
    for (const d of this.activeDoors) {
      if (!d.isOpen) {
        if (this.lineIntersectsRect(x1, y1, x2, y2, d.x, d.y, d.w, d.h)) {
          return false;
        }
      }
    }

    return true;
  }

  private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): boolean {
    // Check if either endpoint is inside rect
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

    // Check intersection with all 4 bounding lines of rectangle
    if (this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
    if (this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;
    if (this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh)) return true;
    if (this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry)) return true;

    return false;
  }

  private lineIntersectsLine(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
}

export const pathfindingGrid = new PathfindingGrid();
