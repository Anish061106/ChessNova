import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Swords,
  Puzzle,
  LineChart,
  Trophy,
  UserPlus,
  Compass,
  ArrowRight,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ChessNovaLogo } from '../components/brand/ChessNovaLogo';
import { ChessNovaIcon } from '../components/brand/ChessNovaIcon';

export const Home: React.FC = () => {
  const features = [
    {
      title: 'Online Chess',
      description: 'Engage in lightning-fast multiplayer matches or casual games with refined chess timing controls.',
      icon: Swords,
      badge: 'Real-time',
    },
    {
      title: 'Chess Puzzles',
      description: 'Sharp tactics training curated from tens of thousands of master-level classical games.',
      icon: Puzzle,
      badge: 'Tactics',
    },
    {
      title: 'Game Analysis',
      description: 'Deep computer evaluation to pinpoint critical turning points, blunders, and brilliant moves.',
      icon: LineChart,
      badge: 'AI Engine',
    },
    {
      title: 'Global Leaderboards',
      description: 'Climb division ladders across Blitz, Bullet, and Rapid competitive chess categories.',
      icon: Trophy,
      badge: 'Competitive',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create an Account',
      description: 'Join the ChessNova universe in seconds and customize your play identity.',
      icon: UserPlus,
    },
    {
      number: '02',
      title: 'Find an Opponent',
      description: 'Instantly pair with players around the globe matching your skill level.',
      icon: Compass,
    },
    {
      number: '03',
      title: 'Play & Execute',
      description: 'Experience minimal latency, clean aesthetic boards, and crisp move responses.',
      icon: Zap,
    },
    {
      number: '04',
      title: 'Analyze & Improve',
      description: 'Review game dynamics, analyze inaccuracies, and elevate your ELO rating.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="w-[400px] h-[400px] bg-nova-cyan/10 rounded-full blur-2xl pointer-events-none -translate-y-24 translate-x-32" />
        </div>

        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <Badge variant="brand" size="md" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Next-Generation Chess Experience</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl leading-[1.1] mb-6">
            Play. Think.{' '}
            <span className="bg-gradient-to-r from-brand-500 via-nova-violet to-nova-cyan bg-clip-text text-transparent">
              Conquer.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-10">
            ChessNova is a modern digital chess universe designed for players who demand precision, elegance, and deep analytical power.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <NavLink to="/play" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Swords className="w-5 h-5" />
                <span>Play Chess</span>
              </Button>
            </NavLink>
            <NavLink to="/learn" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                <span>Explore ChessNova</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </NavLink>
          </div>

          {/* Hero Board Mockup Preview */}
          <div className="mt-14 w-full max-w-4xl p-2 rounded-2xl bg-gradient-to-b from-brand-500/20 via-slate-800/10 to-transparent border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col items-center">
              <div className="flex items-center justify-between w-full max-w-md pb-4 border-b border-slate-800 mb-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-300">Grandmaster Arena</span>
                </div>
                <span className="font-mono">Rapid 10 + 0</span>
              </div>
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl bg-slate-950 border border-indigo-500/20 flex flex-col items-center justify-center p-4 relative shadow-inner">
                <ChessNovaIcon className="w-20 h-20 sm:w-24 sm:h-24 opacity-80" />
                <span className="text-xs font-semibold text-slate-400 mt-3 tracking-widest uppercase">
                  Arena Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-5 text-center">
                Engine analysis &bull; Low latency &bull; Zero clutter
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="brand" size="sm" className="mb-3">
            Core Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Crafted for Serious Chess Enthusiasts
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Every screen, transition, and tool is built to let you focus on what truly matters: pure strategic mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                hover
                className="p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="brand" size="sm">
                      {f.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 dark:bg-dark-surface/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="brand" size="sm" className="mb-3">
              Progression
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              How ChessNova Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              From your first opening move to deep endgame mastery in four streamlined stages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.number}
                  className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-brand-500/30">
                      {s.number}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white border border-brand-500/30 shadow-2xl text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Ready to elevate your chess game?
            </h2>
            <p className="text-slate-300 max-w-xl text-sm sm:text-base mb-8">
              Join players refining their tactics, analyzing matches, and competing in the modern digital arena.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <NavLink to="/play">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Playing Now
                </Button>
              </NavLink>
              <NavLink to="/register">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Create Free Account
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <ChessNovaLogo size="sm" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              A modern digital chess universe where players compete, learn, analyze, and improve.
            </p>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">About</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Contact</span>
          </div>
          <div className="text-[11px]">
            &copy; {new Date().getFullYear()} ChessNova. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
