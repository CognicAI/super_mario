
// Static background element positions (performance optimization)
export const SMALL_CLOUD_POSITIONS = [{ x: 160, y: 100 }, { x: 700, y: 200 }, { x: 1200, y: 80 }, { x: 1600, y: 160 }];
export const LARGE_CLOUD_POSITIONS = [{ x: 300, y: 160 }, { x: 900, y: 240 }, { x: 1500, y: 120 }];
export const DARK_HILL_POSITIONS = [{ x: 200, w: 600, h: 240 }, { x: 1000, w: 800, h: 360 }, { x: 1700, w: 500, h: 180 }];
export const LIGHT_HILL_POSITIONS = [{ x: 500, w: 400, h: 160 }, { x: 1300, w: 500, h: 220 }];
export const BUSH_POSITIONS = [{ x: 100, w: 120 }, { x: 600, w: 160 }, { x: 1100, w: 100 }, { x: 1560, w: 140 }];

export function drawEnvironment(ctx: CanvasRenderingContext2D, canvasHeight: number, tileSize: number): void {
    // Static background elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    SMALL_CLOUD_POSITIONS.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 30, 0, Math.PI * 2);
        ctx.arc(cloud.x + 30, cloud.y - 16, 50, 0, Math.PI * 2);
        ctx.arc(cloud.x + 60, cloud.y, 30, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    LARGE_CLOUD_POSITIONS.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 50, 0, Math.PI * 2);
        ctx.arc(cloud.x + 50, cloud.y - 20, 70, 0, Math.PI * 2);
        ctx.arc(cloud.x + 100, cloud.y, 50, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#3E8E58';
    DARK_HILL_POSITIONS.forEach(hill => {
        ctx.beginPath();
        ctx.ellipse(hill.x, canvasHeight - tileSize, hill.w / 2, hill.h, 0, Math.PI, 0);
        ctx.fill();
    });

    ctx.fillStyle = '#4FB06D';
    LIGHT_HILL_POSITIONS.forEach(hill => {
        ctx.beginPath();
        ctx.ellipse(hill.x, canvasHeight - tileSize, hill.w / 2, hill.h, 0, Math.PI, 0);
        ctx.fill();
    });

    ctx.fillStyle = '#228B22';
    BUSH_POSITIONS.forEach(bush => {
        ctx.beginPath();
        ctx.arc(bush.x, canvasHeight - tileSize, bush.w / 2, Math.PI, 0);
        ctx.fill();
    });
}
