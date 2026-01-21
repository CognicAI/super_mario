
export const MARIO_PIXELS = [
    "____RRRRR___",
    "___RRRRRRRRR",
    "___MMMSSSMS_",
    "__MSMS SSSMS",
    "__MSMM SSSMS",
    "__MMSSSSMMMM",
    "____SSSSSSS_",
    "___RRBRRR___",
    "__RRRBRRBRR_",
    "_RRRRBBBBRRR",
    "SSRBWBBWBRSS",
    "SS SBBBBBBSS",
    "S SBBBBBBBB S",
    "___BBB__BBB_",
    "__MMM____MMM",
    "_MMMM____MMMM"
];

interface PlayerState {
    pos: { x: number; y: number };
    width: number;
    height: number;
    facing: 1 | -1;
}

const INVULNERABILITY_TIME = 1000; // ms - should match App.tsx constant

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, timeSinceHit: number = Infinity): void {
    const pixelSize = 6;
    const startX = player.pos.x + (player.width - (12 * pixelSize)) / 2;
    const startY = player.pos.y;

    ctx.save();

    // Apply flashing effect during invulnerability period
    if (timeSinceHit < INVULNERABILITY_TIME) {
        // Flash every 100ms (10 flashes per second)
        const flashInterval = 100;
        const flashPhase = Math.floor(timeSinceHit / flashInterval) % 2;

        if (flashPhase === 1) {
            ctx.globalAlpha = 0.3; // Make player semi-transparent during flash
        }
    }

    MARIO_PIXELS.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            if (char === '_') continue;
            let color = '#000';
            switch (char) {
                case 'R': color = '#FF0000'; break;
                case 'B': color = '#0000FF'; break;
                case 'S': color = '#FFCC99'; break;
                case 'M': color = '#4B2E0B'; break;
                case 'W': color = '#FFFFFF'; break;
            }
            ctx.fillStyle = color;
            const drawX = player.facing === 1 ? startX + x * pixelSize : startX + (11 - x) * pixelSize;
            ctx.fillRect(drawX, startY + y * pixelSize, pixelSize, pixelSize);
        }
    });
    ctx.restore();
}
