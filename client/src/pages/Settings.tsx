import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Volume2,
  Sliders,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Eye,
  Zap,
  Sparkles,
  Check,
  VolumeX,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, UserPreferences } from '../store/settingsStore';
import { BOARD_THEMES } from '../utils/boardThemes';
import { soundService } from '../utils/soundService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BoardThemeName, Color, PieceSymbol } from '../types/chess';
import { ChessPiece } from '../components/chess/ChessPiece';

export const Settings: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const settings = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'appearance' | 'board' | 'gameplay' | 'audio' | 'accessibility'>('appearance');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleUpdate = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    await settings.updateSetting(key, value);
    setSaveStatus('Preference updated');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleTestSound = () => {
    soundService.play('move');
    setTimeout(() => soundService.play('capture'), 250);
  };

  const currentBoardColors = BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-brand-500" />
            <span>Settings & Customization</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize your board aesthetics, piece styles, audio, animations, and gameplay helpers.
          </p>
        </div>

        {saveStatus && (
          <div
            role="status"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Mobile horizontal scrollable) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'board', label: 'Board & Pieces', icon: Sparkles },
          { id: 'gameplay', label: 'Gameplay', icon: Sliders },
          { id: 'audio', label: 'Audio & Sound', icon: Volume2 },
          { id: 'accessibility', label: 'Accessibility', icon: Eye },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 touch-manipulation ${
              activeTab === id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Control Panel (Left 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-500" />
                <span>Application Theme</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Choose the look and feel for ChessNova across all pages.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Sleek dark aesthetics' },
                  { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean bright layout' },
                  { id: 'system', label: 'System', icon: Laptop, desc: 'Sync with OS' },
                ].map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleUpdate('theme', id as any)}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                      settings.theme === id
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 2: BOARD & PIECES */}
          {activeTab === 'board' && (
            <div className="space-y-6">
              {/* Board Themes */}
              <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  <span>Chessboard Color Theme</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'classic', name: 'Classic Tournament', light: '#eeeed2', dark: '#769656' },
                    { id: 'modern', name: 'Modern Slate', light: '#e2e8f0', dark: '#475569' },
                    { id: 'midnight', name: 'Midnight Nova', light: '#1e293b', dark: '#0f172a' },
                    { id: 'highContrast', name: 'High Contrast', light: '#ffffff', dark: '#000000' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleUpdate('boardTheme', t.id as BoardThemeName)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        settings.boardTheme === t.id
                          ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Mini 2x2 board swatch */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/20 shrink-0 shadow-sm">
                          <div style={{ backgroundColor: t.light }} />
                          <div style={{ backgroundColor: t.dark }} />
                          <div style={{ backgroundColor: t.dark }} />
                          <div style={{ backgroundColor: t.light }} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {t.name}
                        </span>
                      </div>
                      {settings.boardTheme === t.id && (
                        <Check className="w-4 h-4 text-brand-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Piece Sets */}
              <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-brand-500" />
                  <span>Piece Set Styles</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'classic', name: 'Classic Tournament SVGs', desc: 'Standard FIDE tournament styling' },
                    { id: 'modern', name: 'Modern Minimalist Vector', desc: 'Geometric neo-minimalist styling' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUpdate('pieceSet', p.id as 'classic' | 'modern')}
                      className={`p-4 rounded-2xl border flex flex-col gap-2.5 text-left transition-all ${
                        settings.pieceSet === p.id
                          ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </span>
                        {settings.pieceSet === p.id && (
                          <Check className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <ChessPiece color="w" type="k" pieceSet={p.id as any} isDraggable={false} />
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                          <ChessPiece color="w" type="q" pieceSet={p.id as any} isDraggable={false} />
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                          <ChessPiece color="w" type="n" pieceSet={p.id as any} isDraggable={false} />
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                          <ChessPiece color="b" type="k" pieceSet={p.id as any} isDraggable={false} />
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                          <ChessPiece color="b" type="n" pieceSet={p.id as any} isDraggable={false} />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: GAMEPLAY */}
          {activeTab === 'gameplay' && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-500" />
                <span>Gameplay Options & Helpers</span>
              </h2>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {/* Show Legal Moves */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      Show Legal Move Indicators
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Display destination dots and capture rings when selecting a piece.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showLegalMoves}
                    onChange={(e) => handleUpdate('showLegalMoves', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {/* Show Coordinates */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      Show Board Coordinates
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Display rank numbers (1-8) and file letters (a-h) along the board edge.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showCoordinates}
                    onChange={(e) => handleUpdate('showCoordinates', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {/* Highlight Last Move */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      Highlight Last Move
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Highlight the origin and destination squares of the previous move.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.highlightLastMove}
                    onChange={(e) => handleUpdate('highlightLastMove', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {/* Confirm Moves */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      Confirm Moves
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Require a tap on [Confirm ✓] before submitting your move to prevent misclicks.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.confirmMoves}
                    onChange={(e) => handleUpdate('confirmMoves', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {/* Auto Queen */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      Auto-Queen on Promotion
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Automatically promote pawns to Queen without showing the selection dialog.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoQueen}
                    onChange={(e) => handleUpdate('autoQueen', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: AUDIO & SOUND */}
          {activeTab === 'audio' && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-brand-500" />
                <span>Audio Effects</span>
              </h2>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-6 h-6 text-brand-500" />
                  ) : (
                    <VolumeX className="w-6 h-6 text-slate-400" />
                  )}
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      Sound Effects
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Play acoustic cues for moves, captures, checks, castling, and game ends.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdate('soundEnabled', !settings.soundEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    settings.soundEnabled
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {settings.soundEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {settings.soundEnabled && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Test your browser audio output:
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleTestSound} className="gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span>Play Test Sound</span>
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* TAB 5: ACCESSIBILITY & ANIMATIONS */}
          {activeTab === 'accessibility' && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-500" />
                <span>Motion & Visual Accessibility</span>
              </h2>

              <div className="space-y-4">
                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      Piece Animations
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Smooth movement animations when pieces are played.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animationEnabled}
                    onChange={(e) => handleUpdate('animationEnabled', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {/* Animation Speed Selector */}
                {settings.animationEnabled && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      Animation Speed
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['slow', 'normal', 'fast'] as const).map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleUpdate('animationSpeed', speed)}
                          className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                            settings.animationSpeed === speed
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reduce Motion */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      Reduced Motion Mode
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Minimize unnecessary transitions and flashy motion effects.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => handleUpdate('reduceMotion', e.target.checked)}
                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Live Board Preview (Right column on lg) */}
        <div className="space-y-4">
          <Card className="p-5 border border-slate-200 dark:border-slate-800 space-y-3 sticky top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Preview
              </span>
              <span className="text-[11px] font-semibold text-brand-500 capitalize">
                {settings.boardTheme} • {settings.pieceSet}
              </span>
            </div>

            {/* Mini 4x4 interactive-looking preview board */}
            <div
              className="w-full aspect-square rounded-2xl border-4 overflow-hidden shadow-lg relative grid grid-cols-4 grid-rows-4"
              style={{
                backgroundColor: currentBoardColors.lightSquare,
                borderColor: currentBoardColors.darkSquare,
              }}
            >
              {[
                { r: 4, f: 'a', piece: { c: 'b' as Color, t: 'r' as PieceSymbol }, dark: false },
                { r: 4, f: 'b', piece: { c: 'b' as Color, t: 'n' as PieceSymbol }, dark: true },
                { r: 4, f: 'c', piece: { c: 'b' as Color, t: 'b' as PieceSymbol }, dark: false },
                { r: 4, f: 'd', piece: { c: 'b' as Color, t: 'q' as PieceSymbol }, dark: true },

                { r: 3, f: 'a', piece: null, dark: true },
                { r: 3, f: 'b', piece: { c: 'b' as Color, t: 'p' as PieceSymbol }, dark: false },
                { r: 3, f: 'c', piece: null, dark: true },
                { r: 3, f: 'd', piece: null, dark: false },

                { r: 2, f: 'a', piece: { c: 'w' as Color, t: 'p' as PieceSymbol }, dark: false },
                { r: 2, f: 'b', piece: null, dark: true },
                { r: 2, f: 'c', piece: { c: 'w' as Color, t: 'p' as PieceSymbol }, dark: false },
                { r: 2, f: 'd', piece: null, dark: true, dot: settings.showLegalMoves },

                { r: 1, f: 'a', piece: { c: 'w' as Color, t: 'r' as PieceSymbol }, dark: true },
                { r: 1, f: 'b', piece: { c: 'w' as Color, t: 'n' as PieceSymbol }, dark: false, lastMove: settings.highlightLastMove },
                { r: 1, f: 'c', piece: { c: 'w' as Color, t: 'b' as PieceSymbol }, dark: true },
                { r: 1, f: 'd', piece: { c: 'w' as Color, t: 'k' as PieceSymbol }, dark: false },
              ].map((cell, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center justify-center aspect-square"
                  style={{
                    backgroundColor: cell.dark ? currentBoardColors.darkSquare : currentBoardColors.lightSquare,
                  }}
                >
                  {cell.lastMove && (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: currentBoardColors.lastMoveSquare }}
                    />
                  )}
                  {cell.dot && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentBoardColors.legalMoveDot }}
                    />
                  )}
                  {cell.piece && (
                    <div className="w-[85%] h-[85%] relative z-10 flex items-center justify-center">
                      <ChessPiece color={cell.piece.c} type={cell.piece.t} isDraggable={false} />
                    </div>
                  )}
                </div>
              ))}

              {settings.showCoordinates && (
                <div className="absolute bottom-1 right-1 text-[9px] font-mono font-bold text-slate-500 pointer-events-none">
                  d1
                </div>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              {isAuthenticated
                ? 'Preferences automatically synchronize to your account in the cloud.'
                : 'Preferences are saved locally in your browser.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
