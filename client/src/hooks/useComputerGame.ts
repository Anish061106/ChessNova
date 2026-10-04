import { useState, useCallback, useEffect, useRef } from 'react';
import { Color, TimeControl, TIME_CONTROLS, PieceSymbol, Square } from '../types/chess';
import { AIDifficulty, AIPlayerColorChoice } from '../types/ai';
import { stockfishService } from '../services/ai/stockfishService';
import { useChessGame } from './useChessGame';
import { useChessClock } from './useChessClock';
import { soundService } from '../utils/soundService';

interface UseComputerGameProps {
  initialDifficulty?: AIDifficulty;
  initialColorChoice?: AIPlayerColorChoice;
  initialTimeControl?: TimeControl;
}

export function useComputerGame({
  initialDifficulty = 'medium',
  initialColorChoice = 'white',
  initialTimeControl = TIME_CONTROLS[4], // 5+3 Blitz
}: UseComputerGameProps = {}) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>(initialDifficulty);
  const [colorChoice, setColorChoice] = useState<AIPlayerColorChoice>(initialColorChoice);
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [aiColor, setAiColor] = useState<Color>('b');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const sessionIdRef = useRef<number>(1);

  // Base chess engine hook
  const chessGame = useChessGame();

  // Clock Hook
  const clock = useChessClock({
    initialTimeControl,
    onTimeout: (_timedOutColor) => {
      stockfishService.stop();
      setIsThinking(false);
      soundService.play('gameEnd');
    },
  });

  // Calculate actual colors from user choice
  const determineColors = useCallback((choice: AIPlayerColorChoice): { human: Color; ai: Color } => {
    if (choice === 'random') {
      const isHumanWhite = Math.random() < 0.5;
      return {
        human: isHumanWhite ? 'w' : 'b',
        ai: isHumanWhite ? 'b' : 'w',
      };
    }
    const isHumanWhite = choice === 'white';
    return {
      human: isHumanWhite ? 'w' : 'b',
      ai: isHumanWhite ? 'b' : 'w',
    };
  }, []);

  // AI Move calculation trigger
  const triggerAiTurn = useCallback(
    async (fen: string, activeTurnColor: Color, currentSession: number) => {
      if (chessGame.isGameOver || isThinking) return;

      setIsThinking(true);
      setEngineError(null);

      try {
        const response = await stockfishService.requestBestMove(fen, difficulty, currentSession);

        // Discard if session changed while calculating
        if (currentSession !== sessionIdRef.current) {
          return;
        }

        // Validate and apply AI move through authoritative chess.js engine
        const success = chessGame.makeMove(
          response.from as Square,
          response.to as Square,
          (response.promotion as PieceSymbol) || undefined
        );

        if (success) {
          clock.switchTurn(activeTurnColor);
        } else {
          setEngineError('Engine move validation failed');
        }
      } catch (err: any) {
        if (currentSession === sessionIdRef.current) {
          setEngineError(err?.message || 'Computer calculation error');
        }
      } finally {
        if (currentSession === sessionIdRef.current) {
          setIsThinking(false);
        }
      }
    },
    [chessGame, clock, difficulty, isThinking]
  );

  // Start a fresh new computer game
  const startNewGame = useCallback(
    (newDiff?: AIDifficulty, newColor?: AIPlayerColorChoice, newTc?: TimeControl) => {
      const activeColorChoice = newColor || colorChoice;
      const activeTc = newTc || clock.timeControl;

      if (newDiff) setDifficulty(newDiff);
      if (newColor) setColorChoice(newColor);
      if (newTc) clock.setTimeControl(newTc);

      const colors = determineColors(activeColorChoice);
      setHumanColor(colors.human);
      setAiColor(colors.ai);
      chessGame.setOrientation(colors.human === 'w' ? 'white' : 'black');

      // Invalidate any ongoing calculation
      const newSession = stockfishService.createNewSession();
      sessionIdRef.current = newSession;
      setIsThinking(false);
      setEngineError(null);

      // Reset chess game board and clock
      chessGame.resetGame();
      clock.reset(activeTc);

      // If AI is White, trigger initial opening move
      if (colors.ai === 'w') {
        setTimeout(() => {
          triggerAiTurn(chessGame.getFen(), 'w', newSession);
        }, 500);
      }
    },
    [colorChoice, clock, determineColors, chessGame, triggerAiTurn]
  );

  // Restart current matchup
  const restartGame = useCallback(() => {
    startNewGame(difficulty, colorChoice, clock.timeControl);
  }, [startNewGame, difficulty, colorChoice, clock.timeControl]);

  // Handle human move submission
  const handleHumanMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      if (chessGame.isGameOver || isThinking || chessGame.turn !== humanColor) {
        return false;
      }

      const moveSuccess = chessGame.makeMove(from, to, promotion);
      if (moveSuccess) {
        clock.switchTurn(humanColor);

        // If game continues, trigger AI turn
        if (!chessGame.isGameOver) {
          const nextFen = chessGame.getFen();
          const currentSession = sessionIdRef.current;
          setTimeout(() => {
            triggerAiTurn(nextFen, aiColor, currentSession);
          }, 150);
        }
      }

      return moveSuccess;
    },
    [chessGame, isThinking, humanColor, clock, aiColor, triggerAiTurn]
  );

  // Resign active computer game
  const resign = useCallback(() => {
    stockfishService.stop();
    setIsThinking(false);
    sessionIdRef.current += 1;
    chessGame.resign(humanColor);
    clock.pause();
  }, [chessGame, humanColor, clock]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      stockfishService.stop();
    };
  }, []);

  const isHumanTurn = chessGame.turn === humanColor && !isThinking && !chessGame.isGameOver;

  return {
    chessGame,
    boardState: {
      turn: chessGame.turn,
      inCheck: chessGame.inCheck,
      isGameOver: chessGame.isGameOver,
      gameResult: chessGame.gameResult,
      history: chessGame.history,
      capturedPieces: chessGame.capturedPieces,
      selectedSquare: chessGame.selectedSquare,
      legalDestinations: chessGame.legalDestinations,
      pendingPromotion: chessGame.pendingPromotion,
      orientation: chessGame.orientation,
    },
    difficulty,
    setDifficulty,
    colorChoice,
    setColorChoice,
    humanColor,
    aiColor,
    isThinking,
    isHumanTurn,
    engineError,
    timeControl: clock.timeControl,
    setTimeControl: clock.setTimeControl,
    clock,
    makeHumanMove: handleHumanMove,
    selectSquare: chessGame.selectSquare,
    confirmPromotion: chessGame.confirmPromotion,
    cancelPromotion: chessGame.cancelPromotion,
    flipBoard: chessGame.flipBoard,
    startNewGame,
    restartGame,
    resign,
  };
}
