import React from 'react';

interface SubtopicRevealProps {
    subtopic: string;
    onContinue: () => void;
    onSpinAgain: () => void;
}

const SubtopicReveal: React.FC<SubtopicRevealProps> = ({ subtopic, onContinue, onSpinAgain }) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 animate-fadeIn">
            <div className="max-w-5xl p-12 text-center animate-scaleIn">
                <div className="text-8xl mb-6 animate-bounce">🎯</div>
                <h2 className="text-6xl mb-8 text-yellow-400 uppercase" style={{ WebkitTextStroke: '3px black', paintOrder: 'stroke fill' }}>
                    Your Topic!
                </h2>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-12 rounded-lg shadow-2xl border-4 border-white text-4xl leading-relaxed mb-8 font-bold">
                    {subtopic}
                </div>
                <div className="flex gap-6 justify-center">
                    <button
                        onClick={onSpinAgain}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-12 py-6 text-3xl border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2 transition-all uppercase font-bold"
                    >
                        Spin Again
                    </button>
                    <button
                        onClick={onContinue}
                        className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-3xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all uppercase font-bold"
                    >
                        Continue to Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubtopicReveal;
