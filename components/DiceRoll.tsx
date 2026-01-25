
import React, { useState, useEffect, useRef } from 'react';
import { WheelSegment } from '../types';

interface DiceRollProps {
    segments: WheelSegment[];
    onSpinComplete: (subtopic: string) => void;
}

const DiceRoll: React.FC<DiceRollProps> = ({ segments, onSpinComplete }) => {
    const [isRolling, setIsRolling] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);
    // Default rotation to show face 1 cleanly
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [showResult, setShowResult] = useState(false);

    // Map segments to dice numbers 1-6
    // Ensure we have at most 6 segments, or handle overflow if necessary (but requirement implies 1-6)
    const mappedSegments = segments.slice(0, 6);

    const handleRoll = () => {
        if (isRolling) return;
        setIsRolling(true);
        setShowResult(false);

        // Play sound if available (optional, skipping for now as audioService isn't passed)

        // Desired result (random 1-6)
        const result = Math.floor(Math.random() * 6) + 1;
        setDiceResult(result);

        // Determine final rotation based on result
        // These rotations assume standard dice layout
        // 1: front (0, 0)
        // 2: back (0, 180) -> wait, verify standard dice pairs usually sum to 7. 
        // Standard dice: 1 opposite 6, 2 opposite 5, 3 opposite 4.
        // Let's just define specific rotations that show the face.
        // CSS Cube: Front(1), Back(6), Right(3), Left(4), Top(5), Bottom(2) - Typical CSS box layout varies.
        // Let's assume standard CSS box construction:
        // Front: translateZ(100px)
        // Back: rotateY(180deg) translateZ(100px)
        // Right: rotateY(90deg) translateZ(100px)
        // Left: rotateY(-90deg) translateZ(100px)
        // Top: rotateX(90deg) translateZ(100px)
        // Bottom: rotateX(-90deg) translateZ(100px)

        // Rotations to bring face to front:
        // 1 (Front): rotateX(0) rotateY(0)
        // 6 (Back): rotateX(0) rotateY(180)
        // 3 (Right): rotateX(0) rotateY(-90)
        // 4 (Left): rotateX(0) rotateY(90)
        // 5 (Top): rotateX(-90) rotateY(0)
        // 2 (Bottom): rotateX(90) rotateY(0)

        let targetRot = { x: 0, y: 0 };
        switch (result) {
            case 1: targetRot = { x: 0, y: 0 }; break;
            case 6: targetRot = { x: 0, y: 180 }; break;
            case 3: targetRot = { x: 0, y: -90 }; break;
            case 4: targetRot = { x: 0, y: 90 }; break;
            case 5: targetRot = { x: -90, y: 0 }; break;
            case 2: targetRot = { x: 90, y: 0 }; break;
        }

        // Add extra spins for effect (multiple full rotations)
        // Randomize extra spins to make it look dynamic
        const extraX = 720 + Math.floor(Math.random() * 2) * 360;
        const extraY = 720 + Math.floor(Math.random() * 2) * 360;

        // Apply strict final rotation + multiples of 360
        // Actually, we want to ANIMATE to this value.
        // If we simply set state, CSS transition handles it.
        // We need to make sure we don't just snap.

        // Set a "wild" rotation first to simulate tumbling? 
        // Or just rotate directly to the target with high multiplier.

        const finalX = targetRot.x + (Math.random() > 0.5 ? 720 : 1080); // 2 or 3 spins
        const finalY = targetRot.y + (Math.random() > 0.5 ? 720 : 1080);

        setRotation({
            x: finalX,
            y: finalY
        });

        // Wait for animation to finish
        setTimeout(() => {
            setIsRolling(false);
            setShowResult(true);
            // Wait a bit more before triggering completion
            setTimeout(() => {
                if (mappedSegments[result - 1]) {
                    onSpinComplete(mappedSegments[result - 1].subtopic);
                }
            }, 1000);
        }, 2000); // 2s duration matches CSS transition
    };

    return (
        <div className="flex w-full max-w-7xl mx-auto gap-32 items-center justify-center p-8">
            {/* LEFT SIDE: DICE AREA */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">

                {/* DICE CONTAINER */}
                <div className="scene w-[200px] h-[200px] perspective-[600px] mb-12">
                    <div
                        className={`cube w-full h-full relative transform-style-3d transition-transform duration-[2000ms] ease-out`}
                        style={{
                            transform: `translateZ(-100px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                        }}
                    >
                        {/* Face 1: Front */}
                        <div className="face front absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex items-center justify-center translate-z-100">
                            <div className="dot w-6 h-6 bg-black rounded-full shadow-inner"></div>
                        </div>

                        {/* Face 6: Back */}
                        <div className="face back absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex flex-col justify-between p-6 rotate-y-180 translate-z-100">
                            <div className="flex justify-between"><div className="dot w-6 h-6 bg-black rounded-full"></div><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                            <div className="flex justify-between"><div className="dot w-6 h-6 bg-black rounded-full"></div><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                            <div className="flex justify-between"><div className="dot w-6 h-6 bg-black rounded-full"></div><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                        </div>

                        {/* Face 3: Right */}
                        <div className="face right absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex justify-between p-6 rotate-y-90 translate-z-100">
                            <div className="dot w-6 h-6 bg-black rounded-full self-start"></div>
                            <div className="dot w-6 h-6 bg-black rounded-full self-center"></div>
                            <div className="dot w-6 h-6 bg-black rounded-full self-end"></div>
                        </div>

                        {/* Face 4: Left */}
                        <div className="face left absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex justify-between p-6 rotate-y-neg-90 translate-z-100">
                            <div className="flex flex-col justify-between">
                                <div className="dot w-6 h-6 bg-black rounded-full"></div>
                                <div className="dot w-6 h-6 bg-black rounded-full"></div>
                            </div>
                            <div className="flex flex-col justify-between">
                                <div className="dot w-6 h-6 bg-black rounded-full"></div>
                                <div className="dot w-6 h-6 bg-black rounded-full"></div>
                            </div>
                        </div>

                        {/* Face 5: Top */}
                        <div className="face top absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex flex-col justify-between p-6 rotate-x-90 translate-z-100">
                            <div className="flex justify-between"><div className="dot w-6 h-6 bg-black rounded-full"></div><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                            <div className="flex justify-center"><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                            <div className="flex justify-between"><div className="dot w-6 h-6 bg-black rounded-full"></div><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                        </div>

                        {/* Face 2: Bottom */}
                        <div className="face bottom absolute w-full h-full bg-white border-4 border-gray-300 rounded-xl flex flex-col justify-between p-6 rotate-x-neg-90 translate-z-100">
                            <div className="flex justify-center"><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                            <div className="flex justify-center"><div className="dot w-6 h-6 bg-black rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                {/* STATUS TEXT / BUTTON */}
                <div className="text-center h-24">
                    {isRolling ? (
                        <h2 className="text-4xl font-black text-white animate-pulse tracking-widest">ROLLING...</h2>
                    ) : (
                        <button
                            onClick={handleRoll}
                            className="bg-yellow-400 hover:bg-yellow-300 text-black text-2xl font-black py-4 px-10 rounded-full border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 transition-all transform hover:scale-105 shadow-lg"
                        >
                            ROLL THE DICE!
                        </button>
                    )}
                </div>

            </div>

            {/* RIGHT SIDE: LIST AREA */}
            <div className="flex-[2]">
                <h3 className="text-3xl font-bold text-yellow-400 mb-6 uppercase tracking-wider border-b-4 border-yellow-400/50 pb-2 inline-block">
                    Source to Pay Steps:
                </h3>
                <div className="flex flex-col gap-3">
                    {mappedSegments.map((seg, idx) => {
                        const num = idx + 1;
                        const isSelected = diceResult === num;
                        // Fade out others if result shown, highlight selected
                        const opacityClass = showResult ? (isSelected ? 'opacity-100 scale-105' : 'opacity-40 grayscale') : 'opacity-100';

                        return (
                            <div
                                key={seg.id}
                                className={`
                        flex items-center p-4 rounded-lg border-2 transition-all duration-500
                        ${opacityClass}
                        ${isSelected && showResult ? 'bg-white text-black border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'bg-white/10 text-white border-white/20'}
                      `}
                            >
                                <div className={`
                            flex items-center justify-center w-12 h-12 rounded-lg mr-4 font-black text-2xl border-2
                            ${isSelected && showResult ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-black/40 text-yellow-400 border-yellow-400/50'}
                        `}>
                                    {num}
                                </div>
                                <div className="text-xl font-bold uppercase tracking-wide flex-1">
                                    {seg.subtopic}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* INJECT CUSTOM STYLES for 3D Transforms that Tailwind might miss or for cleaner code */}
            <style>{`
        .scene {
            perspective: 600px;
        }
        .transform-style-3d {
            transform-style: preserve-3d;
        }
        .translate-z-100 {
            transform: translateZ(100px);
        }
        .rotate-y-180 { transform: rotateY(180deg) translateZ(100px); }
        .rotate-y-90 { transform: rotateY(90deg) translateZ(100px); }
        .rotate-y-neg-90 { transform: rotateY(-90deg) translateZ(100px); }
        .rotate-x-90 { transform: rotateX(90deg) translateZ(100px); }
        .rotate-x-neg-90 { transform: rotateX(-90deg) translateZ(100px); }
        
        /* Face shading */
        .face { box-shadow: inset 0 0 20px rgba(0,0,0,0.1); }
      `}</style>
        </div>
    );
};

export default DiceRoll;
