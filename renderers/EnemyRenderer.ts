
export const OBSTACLE_PIXELS = [
    "_____RR_____",
    "____RRRR____",
    "___RRRRRR___",
    "__RRWWWWRR__",
    "_RRWW!!WWRR_",
    "_RRW!!!!WRR_",
    "RRWW!!!!WWRR",
    "RRRRRRRRRRRR"
];

interface EnemyState {
    pos: { x: number; y: number };
    isDead: boolean;
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState): void {
    const pixelSize = enemy.isDead ? 3 : 6;
    const startX = enemy.pos.x;
    const startY = enemy.isDead ? enemy.pos.y + 32 : enemy.pos.y;

    OBSTACLE_PIXELS.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            if (char === '_' || char === ' ') continue;
            let color = '#000';
            switch (char) {
                case 'R': color = '#E74C3C'; break; // Red warning triangle
                case 'W': color = '#FFD93D'; break; // Yellow warning stripes
                case '!': color = '#000000'; break; // Black exclamation marks
            }
            ctx.fillStyle = color;
            ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
        }
    });
}
