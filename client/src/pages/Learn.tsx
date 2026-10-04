import React from 'react';
import { GraduationCap } from 'lucide-react';
import { PageShell } from '../components/common/PageShell';

export const Learn: React.FC = () => {
  return (
    <PageShell
      title="Chess Academy"
      description="Interactive lessons covering fundamentals, opening theory, and master endgames."
      icon={GraduationCap}
      previewCards={[
        { title: 'Opening Repertoire', description: 'Deep exploration of standard openings and variations.', tag: 'Openings' },
        { title: 'Positional Strategy', description: 'Pawn structures, outposts, and king safety concepts.', tag: 'Middlegame' },
        { title: 'Endgame Mastery', description: 'Essential theoretical rook, pawn, and minor piece endings.', tag: 'Endgames' },
      ]}
    />
  );
};
