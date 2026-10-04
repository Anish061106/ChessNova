import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Puzzle, PuzzleAttemptRecord } from '../types/puzzle';
import { puzzleApi } from '../services/puzzleApi';
import { soundService } from '../utils/soundService';
import { Square, PieceSymbol, Color, BoardOrientation } from '../types/chess';

export type PuzzleStatus = 'loading' | 'ready' | 'correct_step' | 'incorrect' | 'complete' | 'failed';

export function usePuzzleGame(initialDifficulty: string = 'medium') {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>('loading');
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [history, setHistory] = useState<PuzzleAttemptRecord[]>([]);

  // Chess.js instance
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>('');
  const [turn, setTurn] = useState<Color>('w');
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [checkSquare, setCheckSquare] = useState<Square | null>(null);

  // Sync board state from chessRef
  const syncBoardState = useCallback(() => {
    const chess = chessRef.current;
    setFen(chess.fen());
    setTurn(chess.turn());

    if (chess.isCheck()) {
      const board = chess.board();
      for (const row of board) {
        for (const cell of row) {
          if (cell && cell.type === 'k' && cell.color === chess.turn()) {
            setCheckSquare(cell.square);
            return;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }
  }, []);

  // Load a new puzzle
  const loadPuzzle = useCallback(async (puzzlePromise: Promise<Puzzle>) => {
    setStatus('loading');
    setFeedbackMessage('');
    setSelectedSquare(null);
    setLastMove(null);

    try {
      const puzzle = await puzzlePromise;
      if (!puzzle) throw new Error('Puzzle not found');

      setCurrentPuzzle(puzzle);
      chessRef.current = new Chess(puzzle.fen);
      syncBoardState();

      const initialColor = chessRef.current.turn();
      setOrientation(initialColor === 'w' ? 'white' : 'black');
      setMoveIndex(0);
      setAttemptsCount(0);
      setStartTime(Date.now());
      setStatus('ready');
    } catch (err: any) {
      setStatus('failed');
      setFeedbackMessage(err.message || 'Failed to load puzzle');
    }
  }, [syncBoardState]);

  // Load random puzzle
  const loadNextPuzzle = useCallback((difficulty?: string) => {
    loadPuzzle(puzzleApi.getRandomPuzzle(difficulty || initialDifficulty));
  }, [loadPuzzle, initialDifficulty]);

  // Initial load
  useEffect(() => {
    loadNextPuzzle();
    puzzleApi.getHistory(15).then(setHistory).catch(() => {});
  }, [loadNextPuzzle]);

  // Handle player move attempt
  const makePlayerMove = useCallback(
    async (from: Square, to: Square, promotion?: PieceSymbol): Promise<boolean> => {
      if (status === 'loading' || status === 'complete' || !currentPuzzle) {
        return false;
      }

      const chess = chessRef.current;
      const moveUci = `${from}${to}${promotion ? promotion.toLowerCase() : ''}`;

      // 1. Legal chess move validation
      try {
        const legal = chess.move({
          from,
          to,
          promotion: promotion || undefined,
        });

        if (!legal) return false;
      } catch {
        return false;
      }

      // Valid legal move applied
      syncBoardState();
      setLastMove({ from, to });
      soundService.play('move');

      // 2. Validate step against solution
      try {
        const validation = await puzzleApi.validateMove(currentPuzzle.id, moveUci, moveIndex);

        if (validation.isCorrect) {
          if (validation.isComplete) {
            // Puzzle successfully completed!
            setStatus('complete');
            setFeedbackMessage('🎉 Brilliant! Puzzle solved!');
            soundService.play('gameEnd');

            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            puzzleApi.submitAttempt(currentPuzzle.id, true, [moveUci], timeTaken);

            // Refresh attempt history
            puzzleApi.getHistory(15).then(setHistory).catch(() => {});
          } else {
            // Step correct, play opponent response
            setStatus('correct_step');
            setFeedbackMessage('Best move! Keep going...');

            if (validation.opponentResponseUci) {
              const oppUci = validation.opponentResponseUci;
              const oppFrom = oppUci.substring(0, 2) as Square;
              const oppTo = oppUci.substring(2, 4) as Square;
              const oppPromo = oppUci.length > 4 ? (oppUci[4] as PieceSymbol) : undefined;

              setTimeout(() => {
                chessRef.current.move({
                  from: oppFrom,
                  to: oppTo,
                  promotion: oppPromo,
                });
                syncBoardState();
                setLastMove({ from: oppFrom, to: oppTo });
                soundService.play('move');
                setMoveIndex(validation.nextExpectedMoveIndex || moveIndex + 2);
                setStatus('ready');
              }, 450);
            }
          }
          return true;
        } else {
          // Incorrect move
          setStatus('incorrect');
          setFeedbackMessage('Not the best move. Try again!');
          setAttemptsCount((prev) => prev + 1);
          soundService.play('check');

          // Undo incorrect move after brief pause
          setTimeout(() => {
            chessRef.current.undo();
            syncBoardState();
            setStatus('ready');
          }, 600);
          return false;
        }
      } catch {
        return false;
      }
    },
    [status, currentPuzzle, moveIndex, startTime, syncBoardState]
  );

  // Restart / retry current puzzle
  const retryCurrent = useCallback(() => {
    if (!currentPuzzle) return;
    chessRef.current = new Chess(currentPuzzle.fen);
    syncBoardState();
    setMoveIndex(0);
    setLastMove(null);
    setStatus('ready');
    setFeedbackMessage('');
  }, [currentPuzzle, syncBoardState]);

  return {
    puzzle: currentPuzzle,
    status,
    feedbackMessage,
    attemptsCount,
    history,
    boardState: {
      fen,
      turn,
      orientation,
      selectedSquare,
      lastMove,
      checkSquare,
    },
    makePlayerMove,
    selectSquare: setSelectedSquare,
    retryCurrent,
    loadNextPuzzle,
    loadPuzzleById: (id: string) => loadPuzzle(puzzleApi.getPuzzleById(id)),
    flipBoard: () => setOrientation((prev) => (prev === 'white' ? 'black' : 'white')),
  };
}
