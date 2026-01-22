
// Static background element positions (performance optimization)
export const SMALL_CLOUD_POSITIONS = [{ x: 160, y: 100 }, { x: 700, y: 200 }, { x: 1200, y: 80 }, { x: 1600, y: 160 }];
export const LARGE_CLOUD_POSITIONS = [{ x: 300, y: 160 }, { x: 900, y: 240 }, { x: 1500, y: 120 }];

export function drawEnvironment(ctx: CanvasRenderingContext2D, canvasHeight: number, tileSize: number): void {
    // No background elements - keep it clean and simple like the reference image
    // The sky color (set in App.tsx) provides the base
    // This allows the game elements to stand out clearly
}
