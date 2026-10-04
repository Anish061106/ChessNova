import React from 'react';
import { NavLink } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <span className="text-4xl font-extrabold text-brand-500 mb-2 block">
          404
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Square Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          The coordinate or route you were looking for doesn't exist on the ChessNova board.
        </p>
        <NavLink to="/">
          <Button variant="primary" size="md" className="gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Arena</span>
          </Button>
        </NavLink>
      </Card>
    </div>
  );
};
