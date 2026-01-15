import { useEffect, useRef } from 'react';
import { GameState } from '../types';

interface UseInputProps {
    gameState: GameState;
    onPause: () => void;
    onResume: () => void;
}

export function useInput({ gameState, onPause, onResume }: UseInputProps) {
    const keys = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Pause/Resume functionality
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (gameState === GameState.PLAYING) {
                    onPause();
                } else if (gameState === GameState.PAUSED) {
                    onResume();
                }
                return;
            }

            // Game controls (only when playing)
            if (gameState === GameState.PLAYING) {
                keys.current[e.key] = true;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState, onPause, onResume]);

    return keys;
}
