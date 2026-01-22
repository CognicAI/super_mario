import React, { useEffect, useRef, useState } from 'react';
import { WheelSegment } from '../types';

interface SpinningWheelProps {
    segments: WheelSegment[];
    onSpinComplete: (selectedSubtopic: string) => void;
    autoSpin?: boolean;
}

const SpinningWheel: React.FC<SpinningWheelProps> = ({ segments, onSpinComplete, autoSpin = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const animationRef = useRef<number>();
    const velocityRef = useRef(0);
    const selectedIndexRef = useRef(0);

    const CANVAS_SIZE = 600;
    const CENTER_X = CANVAS_SIZE / 2;
    const CENTER_Y = CANVAS_SIZE / 2;
    const RADIUS = 250;

    // Auto-spin disabled by default - user must click button
    useEffect(() => {
        if (autoSpin && !isSpinning) {
            startSpin();
        }
    }, [autoSpin]);

    const startSpin = () => {
        setIsSpinning(true);

        // Random initial velocity (fast spin)
        velocityRef.current = 30 + Math.random() * 20; // 30-50 degrees per frame

        // Randomly select which segment will win
        const randomIndex = Math.floor(Math.random() * segments.length);
        selectedIndexRef.current = randomIndex;

        animate();
    };

    const animate = () => {
        if (velocityRef.current > 0.1) {
            // Apply friction
            velocityRef.current *= 0.98;

            // Update rotation
            setRotation(prev => (prev + velocityRef.current) % 360);

            animationRef.current = requestAnimationFrame(animate);
        } else {
            // Spin complete - snap to selected segment
            const segmentAngle = 360 / segments.length;
            const targetAngle = selectedIndexRef.current * segmentAngle;

            // Calculate final rotation to land on selected segment
            const finalRotation = (360 - targetAngle + segmentAngle / 2) % 360;
            setRotation(finalRotation);

            setIsSpinning(false);

            // Notify parent after a short delay
            setTimeout(() => {
                onSpinComplete(segments[selectedIndexRef.current].subtopic);
            }, 500);
        }
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Draw the wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Save context and rotate
        ctx.save();
        ctx.translate(CENTER_X, CENTER_Y);
        ctx.rotate((rotation * Math.PI) / 180);

        // Draw segments
        const segmentAngle = (2 * Math.PI) / segments.length;

        segments.forEach((segment, index) => {
            const startAngle = index * segmentAngle - Math.PI / 2;
            const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, RADIUS, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw label (Choice 1, Choice 2, etc.)
            ctx.save();
            const midAngle = (startAngle + endAngle) / 2;
            ctx.rotate(midAngle + Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.font = 'bold 28px Arial';
            ctx.fillText(segment.label, 0, -RADIUS * 0.65);
            ctx.restore();
        });

        ctx.restore();

        // Draw center circle (larger to accommodate button)
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 80, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw pointer (triangle pointing DOWN into the wheel)
        ctx.beginPath();
        ctx.moveTo(CENTER_X, 80); // Bottom point (pointing down)
        ctx.lineTo(CENTER_X - 25, 30); // Top left
        ctx.lineTo(CENTER_X + 25, 30); // Top right
        ctx.closePath();
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();

    }, [rotation, segments]);

    return (
        <div className="relative flex flex-col items-center justify-center">
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="drop-shadow-2xl"
            />

            {/* Center SPIN text - styled as part of the wheel circle */}
            {!isSpinning && (
                <div
                    onClick={startSpin}
                    className="absolute cursor-pointer select-none"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }}
                >
                    <div className="text-3xl font-bold text-black hover:scale-110 transition-transform active:scale-95"
                        style={{
                            WebkitTextStroke: '1px #000',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                        SPIN
                    </div>
                </div>
            )}

            {isSpinning && (
                <p className="mt-8 text-3xl text-white font-bold animate-pulse" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>
                    SPINNING...
                </p>
            )}
        </div>
    );
};

export default SpinningWheel;
