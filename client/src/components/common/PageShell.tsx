import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Sparkles } from 'lucide-react';

interface PageShellProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  phase?: string;
  previewCards?: {
    title: string;
    description: string;
    tag?: string;
  }[];
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  icon: Icon,
  phase = 'Phase 2+ Roadmap',
  previewCards = [],
}) => {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <Badge variant="brand" size="sm" className="gap-1.5 self-start sm:self-center">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>{phase}</span>
        </Badge>
      </div>

      {/* Overview Card */}
      <Card className="p-6 sm:p-8 border-dashed border-2">
        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {title} Module
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            This module's interface shell and route architecture are prepared for Phase 1. Complete feature functionality will be linked during planned development phases.
          </p>
          <Badge variant="default" size="md">
            Route Loaded Successfully
          </Badge>
        </div>
      </Card>

      {/* Feature Preview Grid if provided */}
      {previewCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewCards.map((card, idx) => (
            <Card key={idx} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                  {card.tag && (
                    <Badge variant="outline" size="sm">
                      {card.tag}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
