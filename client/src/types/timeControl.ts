export interface TimeControlConfig {
  id: string;
  name: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical';
  initialTime: number; // seconds
  increment: number; // seconds
}

export const VALID_TIME_CONTROLS: Record<string, TimeControlConfig> = {
  '1+0': { id: '1+0', name: '1+0 Bullet', category: 'Bullet', initialTime: 60, increment: 0 },
  '2+1': { id: '2+1', name: '2+1 Bullet', category: 'Bullet', initialTime: 120, increment: 1 },
  '3+0': { id: '3+0', name: '3+0 Blitz', category: 'Blitz', initialTime: 180, increment: 0 },
  '3+2': { id: '3+2', name: '3+2 Blitz', category: 'Blitz', initialTime: 180, increment: 2 },
  '5+0': { id: '5+0', name: '5+0 Blitz', category: 'Blitz', initialTime: 300, increment: 0 },
  '5+3': { id: '5+3', name: '5+3 Blitz', category: 'Blitz', initialTime: 300, increment: 3 },
  '10+0': { id: '10+0', name: '10+0 Rapid', category: 'Rapid', initialTime: 600, increment: 0 },
  '10+5': { id: '10+5', name: '10+5 Rapid', category: 'Rapid', initialTime: 600, increment: 5 },
  '15+10': { id: '15+10', name: '15+10 Rapid', category: 'Rapid', initialTime: 900, increment: 10 },
  '30+0': { id: '30+0', name: '30+0 Classical', category: 'Classical', initialTime: 1800, increment: 0 },
  '30+20': { id: '30+20', name: '30+20 Classical', category: 'Classical', initialTime: 1800, increment: 20 },
};

export const TIME_CONTROL_LIST = Object.values(VALID_TIME_CONTROLS);
