import { PrismaClient, GameType, GameResultStatus, TerminationReason, RatingCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ChessNova Development Database Seed...');

  // 1. Create Demo Users
  const userWhite = await prisma.user.upsert({
    where: { username: 'demo_white' },
    update: {},
    create: {
      username: 'demo_white',
      email: 'demo.white@chessnova.local',
      passwordHash: '$2b$10$synthetic_dev_hash_not_for_production_demo_white',
      displayName: 'Demo White Player',
      country: 'US',
      bio: 'Grandmaster in training. Enjoying ChessNova local & blitz games.',
      settings: {
        create: {
          theme: 'dark',
          boardTheme: 'classic',
          soundEnabled: true,
          showLegalMoves: true,
        },
      },
    },
  });

  const userBlack = await prisma.user.upsert({
    where: { username: 'demo_black' },
    update: {},
    create: {
      username: 'demo_black',
      email: 'demo.black@chessnova.local',
      passwordHash: '$2b$10$synthetic_dev_hash_not_for_production_demo_black',
      displayName: 'Demo Black Player',
      country: 'CA',
      bio: 'Tactical player who loves rapid chess and chess puzzles.',
      settings: {
        create: {
          theme: 'dark',
          boardTheme: 'modern',
          soundEnabled: true,
          showLegalMoves: true,
        },
      },
    },
  });

  console.log(`👤 Seeded demo users: ${userWhite.username}, ${userBlack.username}`);

  // 2. Seed Ratings for Demo Users
  const categories: RatingCategory[] = [
    RatingCategory.BULLET,
    RatingCategory.BLITZ,
    RatingCategory.RAPID,
    RatingCategory.CLASSICAL,
  ];

  for (const cat of categories) {
    await prisma.rating.upsert({
      where: {
        userId_category: {
          userId: userWhite.id,
          category: cat,
        },
      },
      update: {},
      create: {
        userId: userWhite.id,
        category: cat,
        rating: 1550,
        gamesPlayed: 10,
        wins: 6,
        losses: 3,
        draws: 1,
      },
    });

    await prisma.rating.upsert({
      where: {
        userId_category: {
          userId: userBlack.id,
          category: cat,
        },
      },
      update: {},
      create: {
        userId: userBlack.id,
        category: cat,
        rating: 1480,
        gamesPlayed: 10,
        wins: 4,
        losses: 5,
        draws: 1,
      },
    });
  }

  console.log('⭐ Seeded demo user ratings across all categories');

  // 3. Seed a Sample Completed Game (Scholar\'s Mate)
  const demoPgn =
    '[Event "ChessNova Local Match"]\n[Site "ChessNova"]\n[Date "2026.10.01"]\n[White "demo_white"]\n[Black "demo_black"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0';

  const demoMoves = [
    { moveNumber: 1, ply: 1, color: 'w', from: 'e2', to: 'e4', san: 'e4', uci: 'e2e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
    { moveNumber: 1, ply: 2, color: 'b', from: 'e7', to: 'e5', san: 'e5', uci: 'e7e5', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2' },
    { moveNumber: 2, ply: 3, color: 'w', from: 'f1', to: 'c4', san: 'Bc4', uci: 'f1c4', fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2' },
    { moveNumber: 2, ply: 4, color: 'b', from: 'b8', to: 'c6', san: 'Nc6', uci: 'b8c6', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3' },
    { moveNumber: 3, ply: 5, color: 'w', from: 'd1', to: 'h5', san: 'Qh5', uci: 'd1h5', fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3' },
    { moveNumber: 3, ply: 6, color: 'b', from: 'g8', to: 'f6', san: 'Nf6', uci: 'g8f6', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4' },
    { moveNumber: 4, ply: 7, color: 'w', from: 'h5', to: 'f7', san: 'Qxf7#', uci: 'h5f7', fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4' },
  ];

  const demoGame = await prisma.game.create({
    data: {
      whitePlayerId: userWhite.id,
      blackPlayerId: userBlack.id,
      gameType: GameType.LOCAL,
      timeControl: '5+3',
      initialTime: 300,
      increment: 3,
      rated: false,
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      finalFen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
      result: GameResultStatus.WHITE_WIN,
      terminationReason: TerminationReason.CHECKMATE,
      pgn: demoPgn,
      endedAt: new Date(),
      moves: {
        create: demoMoves,
      },
    },
  });

  console.log(`♟️ Seeded sample completed game (${demoGame.id}) with ${demoMoves.length} moves`);
  console.log('✅ ChessNova Development Database Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
