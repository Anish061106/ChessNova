import React from 'react';
import { Tv } from 'lucide-react';
import { PageShell } from '../components/common/PageShell';

export const Watch: React.FC = () => {
  return (
    <PageShell
      title="Watch & Broadcast"
      description="Spectate high-rated live games, tournament broadcasts, and grandmaster battles."
      icon={Tv}
      previewCards={[
        { title: 'Top Live Game', description: 'Highest rated ongoing match broadcasted with live evaluation.', tag: 'Live' },
        { title: 'Arena Tournaments', description: 'Real-time multi-player swiss and arena tournament brackets.', tag: 'Events' },
        { title: 'Community Streams', description: 'Curated chess streaming broadcasts and commentary.', tag: 'Media' },
      ]}
    />
  );
};
