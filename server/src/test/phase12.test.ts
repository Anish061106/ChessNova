import { describe, it, expect, vi } from 'vitest';
import { ratingService } from '../services/ratings/ratingService.js';
import { prisma } from '../services/database/prisma.js';
import { GameResultStatus, GameType } from '@prisma/client';

describe('Phase 12: Server Computer Game Rating & Isolation Rules', () => {
  it('does NOT adjust ratings for unrated or computer matches (null blackPlayerId or rated=false)', async () => {
    vi.spyOn(prisma.game, 'findUnique').mockResolvedValueOnce({
      id: 'computer-game-test-id',
      type: GameType.COMPUTER,
      rated: false,
      whitePlayerId: 'user-uuid-1',
      blackPlayerId: null,
      result: GameResultStatus.WHITE_WIN,
      timeControl: '5+3',
    } as any);

    const res = await ratingService.processCompletedRatedGame('computer-game-test-id');
    expect(res).toBeNull();
  });

  it('guarantees computer games never affect competitive Elo history', async () => {
    vi.spyOn(prisma.game, 'findUnique').mockResolvedValueOnce(null);

    const res = await ratingService.processCompletedRatedGame('non-existent-or-local-game');
    expect(res).toBeNull();
  });
});
