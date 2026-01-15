
export const GOOMBA_PIXELS = [
    "____BBBB____",
    "___BBBBBB___",
    "__BBBBBBBB__",
    "_BBWWBBWWBB_",
    "_BBWWBWWBWBB_",
    "_BBBBBBBBBB_",
    "__BBBBBBBB__",
    "___MM__MM___"
];

interface EnemyState {
    pos: { x: number; y: number };
    isDead: boolean;
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState): void {
    const pixelSize = enemy.isDead ? 3 : 6;
    const startX = enemy.pos.x;
    const startY = enemy.isDead ? enemy.pos.y + 32 : enemy.pos.y;

    GOOMBA_PIXELS.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            if (char === '_') continue;
            let color = '#000';
            switch (char) {
                case 'B': color = '#8B4513'; break;
                case 'W': color = '#FFFFFF'; break;
                case 'M': color = '#000000'; break;
            }
            ctx.fillStyle = color;
            ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
        }
    });
}
