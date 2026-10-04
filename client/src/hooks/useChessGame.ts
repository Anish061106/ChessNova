import { useState, useCallback, useRef } from 'react';
import { Chess, type Move } from 'chess.js';
import {
  Square,
  PieceSymbol,
  Color,
  BoardOrientation,
  BoardThemeName,
  LegalDestination,
  PendingPromotion,
  PairedMove,
  GameResult,
  CapturedPiecesState,
} from '../types/chess';
import { soundService } from '../utils/soundService';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function calculateCapturedPieces(chess: Chess): CapturedPiecesState {
  const initialCounts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };

  const currentCounts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  // Count current pieces on the board
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        currentCounts[cell.color][cell.type]++;
      }
    }
  }

  // Pieces captured by White are Black pieces that are missing
  const whiteCaptured: PieceSymbol[] = [];
  // Pieces captured by Black are White pieces that are missing
  const blackCaptured: PieceSymbol[] = [];

  const pieceOrder: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

  for (const type of pieceOrder) {
    // Missing Black pieces (captured by White)
    const missingBlack = Math.max(0, initialCounts.b[type] - currentCounts.b[type]);
    for (let i = 0; i < missingBlack; i++) {
      whiteCaptured.push(type);
    }
    // Missing White pieces (captured by Black)
    const missingWhite = Math.max(0, initialCounts.w[type] - currentCounts.w[type]);
    for (let i = 0; i < missingWhite; i++) {
      blackCaptured.push(type);
    }
  }

  const whiteScore = whiteCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
  const blackScore = blackCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);

  return {
    white: whiteCaptured,
    black: blackCaptured,
    whiteAdvantage: whiteScore - blackScore,
  };
}

function findKingSquare(chess: Chess, color: Color): Square | null {
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) {
        return cell.square;
      }
    }
  }
  return null;
}

function computePairedMoves(history: Move[]): PairedMove[] {
  const paired: PairedMove[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = history[i];
    const blackMove = history[i + 1];

    paired.push({
      moveNumber,
      white: whiteMove
        ? {
            san: whiteMove.san,
            from: whiteMove.from,
            to: whiteMove.to,
            piece: whiteMove.piece,
            color: whiteMove.color,
            captured: whiteMove.captured,
            promotion: whiteMove.promotion,
          }
        : undefined,
      black: blackMove
        ? {
            san: blackMove.san,
            from: blackMove.from,
            to: blackMove.to,
            piece: blackMove.piece,
            color: blackMove.color,
            captured: blackMove.captured,
            promotion: blackMove.promotion,
          }
        : undefined,
    });
  }
  return paired;
}

function computeGameResult(chess: Chess): GameResult | null {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === 'w' ? 'b' : 'w';
    return { winner, reason: 'checkmate' };
  } else if (chess.isStalemate()) {
    return { winner: 'draw', reason: 'stalemate' };
  } else if (chess.isThreefoldRepetition()) {
    return { winner: 'draw', reason: 'threefold_repetition' };
  } else if (chess.isInsufficientMaterial()) {
    return { winner: 'draw', reason: 'insufficient_material' };
  } else {
    return { winner: 'draw', reason: '50_move_rule' };
  }
}

export function useChessGame(initialFen?: string) {
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const chess = chessRef.current;

  // React states representing the chess engine & UI
  const [fen, setFen] = useState<string>(chess.fen());
  const [turn, setTurn] = useState<Color>(chess.turn());
  const [inCheck, setInCheck] = useState<boolean>(chess.isCheck());
  const [checkSquare, setCheckSquare] = useState<Square | null>(
    chess.isCheck() ? findKingSquare(chess, chess.turn()) : null
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(chess.isGameOver());
  const [gameResult, setGameResult] = useState<GameResult | null>(() => computeGameResult(chess));

  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pairedHistory, setPairedHistory] = useState<PairedMove[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiecesState>({
    white: [],
    black: [],
    whiteAdvantage: 0,
  });

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalDestinations, setLegalDestinations] = useState<LegalDestination[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [boardTheme, setBoardTheme] = useState<BoardThemeName>('classic');

  // Helper to sync all derived states after a move or reset
  const syncGameState = useCallback((executedMove?: Move) => {
    const currentChess = chessRef.current;
    const currentFen = currentChess.fen();
    const currentTurn = currentChess.turn();
    const checked = currentChess.isCheck();
    const over = currentChess.isGameOver();

    setFen(currentFen);
    setTurn(currentTurn);
    setInCheck(checked);
    setCheckSquare(checked ? findKingSquare(currentChess, currentTurn) : null);
    setIsGameOver(over);

    const result = computeGameResult(currentChess);
    setGameResult(result);

    if (over) {
      soundService.play('gameEnd');
    } else if (checked) {
      soundService.play('check');
    } else if (executedMove) {
      if (executedMove.promotion) {
        soundService.play('promotion');
      } else if (executedMove.flags.includes('k') || executedMove.flags.includes('q')) {
        soundService.play('castle');
      } else if (executedMove.captured) {
        soundService.play('capture');
      } else {
        soundService.play('move');
      }
    }

    if (executedMove) {
      setLastMove({ from: executedMove.from, to: executedMove.to });
    } else {
      setLastMove(null);
    }

    const verboseHistory = currentChess.history({ verbose: true });
    setPairedHistory(computePairedMoves(verboseHistory));
    setCapturedPieces(calculateCapturedPieces(currentChess));
  }, []);

  // Resignation action
  const resign = useCallback((resigningColor: Color) => {
    const winner: Color = resigningColor === 'w' ? 'b' : 'w';
    setIsGameOver(true);
    setGameResult({ winner, reason: 'resignation' });
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
    soundService.play('gameEnd');
  }, []);

  // Timeout action (flag fallen)
  const flagTimeout = useCallback((timedOutColor: Color) => {
    const winner: Color = timedOutColor === 'w' ? 'b' : 'w';
    setIsGameOver(true);
    setGameResult({ winner, reason: 'timeout' });
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
    soundService.play('gameEnd');
  }, []);

  // Check if a move requires pawn promotion dialog
  const isPromotionMove = useCallback((from: Square, to: Square): boolean => {
    const currentChess = chessRef.current;
    const piece = currentChess.get(from);
    if (!piece || piece.type !== 'p') return false;

    // White pawn reaching 8th rank
    if (piece.color === 'w' && from[1] === '7' && to[1] === '8') return true;
    // Black pawn reaching 1st rank
    if (piece.color === 'b' && from[1] === '2' && to[1] === '1') return true;

    return false;
  }, []);

  // Execute a validated move through chess.js
  const makeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: PieceSymbol): boolean => {
      try {
        const currentChess = chessRef.current;

        // Block move attempts if game is already over
        if (isGameOver || currentChess.isGameOver()) {
          return false;
        }

        // Check if move requires promotion and promotion piece is not supplied yet
        if (isPromotionMove(from, to) && !promotionPiece) {
          // Check if this move is actually legal first before popping modal
          const moves = currentChess.moves({ square: from, verbose: true });
          const isValid = moves.some((m) => m.to === to);
          if (isValid) {
            setPendingPromotion({ from, to });
            return false;
          }
        }

        const moveObj: { from: Square; to: Square; promotion?: PieceSymbol } = {
          from,
          to,
          promotion: promotionPiece,
        };

        const result = currentChess.move(moveObj);
        if (result) {
          // Clear selection & promotion
          setSelectedSquare(null);
          setLegalDestinations([]);
          setPendingPromotion(null);

          syncGameState(result);
          return true;
        }
      } catch (err) {
        console.debug('Invalid chess move attempted:', err);
      }

      return false;
    },
    [isGameOver, isPromotionMove, syncGameState]
  );

  // Square selection / Click-to-move handler
  const selectSquare = useCallback(
    (square: Square) => {
      const currentChess = chessRef.current;

      // If game is over, do not allow selection
      if (isGameOver || currentChess.isGameOver()) {
        setSelectedSquare(null);
        setLegalDestinations([]);
        return;
      }

      // If a square was already selected and user clicked a legal destination:
      if (selectedSquare) {
        if (selectedSquare === square) {
          // Deselect on re-click
          setSelectedSquare(null);
          setLegalDestinations([]);
          return;
        }

        const isLegal = legalDestinations.some((dest) => dest.square === square);
        if (isLegal) {
          makeMove(selectedSquare, square);
          return;
        }
      }

      // Check piece on square
      const piece = currentChess.get(square);

      // Only allow selecting pieces belonging to active turn
      if (piece && piece.color === currentChess.turn()) {
        setSelectedSquare(square);

        const legalMoves = currentChess.moves({ square, verbose: true });
        const destinations: LegalDestination[] = legalMoves.map((m) => ({
          square: m.to,
          isCapture: Boolean(m.captured) || m.flags.includes('e'),
        }));

        setLegalDestinations(destinations);
      } else {
        // Clicked empty square or opponent piece with no prior selection
        setSelectedSquare(null);
        setLegalDestinations([]);
      }
    },
    [selectedSquare, legalDestinations, makeMove]
  );

  // Confirm promotion piece from dialog
  const confirmPromotion = useCallback(
    (promotionPiece: PieceSymbol) => {
      if (!pendingPromotion) return;
      makeMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
    },
    [pendingPromotion, makeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalDestinations([]);
  }, []);

  // Board Orientation
  const flipBoard = useCallback(() => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Reset current game back to starting position
  const resetGame = useCallback(() => {
    chessRef.current.reset();
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
    syncGameState();
  }, [syncGameState]);

  // Start a fresh new game
  const newGame = useCallback(() => {
    chessRef.current = new Chess();
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
    setOrientation('white');
    syncGameState();
  }, [syncGameState]);

  // Utility getters
  const getFen = useCallback(() => chessRef.current.fen(), []);
  const getPgn = useCallback(() => chessRef.current.pgn(), []);
  const getPieceAt = useCallback((square: Square): { type: PieceSymbol; color: Color } | null => {
    const piece = chessRef.current.get(square);
    return piece ? { type: piece.type, color: piece.color } : null;
  }, []);

  return {
    chess: chessRef.current,
    fen,
    turn,
    inCheck,
    checkSquare,
    isGameOver,
    gameResult,
    lastMove,
    history: pairedHistory,
    capturedPieces,

    // UI state
    selectedSquare,
    legalDestinations,
    pendingPromotion,
    orientation,
    boardTheme,

    // Actions
    selectSquare,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    flipBoard,
    resetGame,
    newGame,
    resign,
    flagTimeout,
    setBoardTheme,
    setOrientation,
    getFen,
    getPgn,
    getPieceAt,
  };
}
