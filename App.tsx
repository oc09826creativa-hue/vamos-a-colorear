/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Sparkles, Smile, ArrowLeft, RotateCcw, Download } from 'lucide-react';

import { ColoringSheet, PaintTool } from './types';
import { audioSynth } from './utils/audio';
import { WelcomeScreen } from './components/WelcomeScreen';
import { BackgroundFloatingShapes } from './components/BackgroundFloatingShapes';
import { ColoringCanvas } from './components/ColoringCanvas';
import { ColorPalette } from './components/ColorPalette';
import { GalleryShelf } from './components/GalleryShelf';

// 10 Adorable default children's templates
const DEFAULT_TEMPLATES: ColoringSheet[] = [
  { id: 'sun', name: 'Sol Alegre', drawingType: 'sun', isCustom: false },
  { id: 'butterfly', name: 'Mariposa', drawingType: 'butterfly', isCustom: false },
  { id: 'flower', name: 'Flor Feliz', drawingType: 'flower', isCustom: false },
  { id: 'cat', name: 'Gatito Lindo', drawingType: 'cat', isCustom: false },
  { id: 'dog', name: 'Perrito Feliz', drawingType: 'dog', isCustom: false },
  { id: 'rocket', name: 'Cohete', drawingType: 'rocket', isCustom: false },
  { id: 'castle', name: 'Castillo', drawingType: 'castle', isCustom: false },
  { id: 'dino', name: 'Dinosaurio', drawingType: 'dino', isCustom: false },
  { id: 'fish', name: 'Pez de Burbujas', drawingType: 'fish', isCustom: false },
  { id: 'elephant', name: 'Elefantito', drawingType: 'elephant', isCustom: false },
];

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'coloring'>('welcome');
  const [sheets, setSheets] = useState<ColoringSheet[]>(DEFAULT_TEMPLATES);
  const [currentSheetIdx, setCurrentSheetIdx] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('#ff4444');
  const [activeTool, setActiveTool] = useState<PaintTool>('fill');
  
  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBGMStarted, setIsBGMStarted] = useState<boolean>(false);

  // Gamification stats
  const [clickCount, setClickCount] = useState<number>(0);
  const [showIntermediateCelebration, setShowIntermediateCelebration] = useState<boolean>(false);
  const [showFinalCelebration, setShowFinalCelebration] = useState<boolean>(false);
  const [historyLength, setHistoryLength] = useState<number>(0);

  // Sync canvas history length change
  useEffect(() => {
    const handleHistoryChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setHistoryLength(customEvent.detail || 0);
    };
    window.addEventListener('coloring-history-change', handleHistoryChange);
    return () => {
      window.removeEventListener('coloring-history-change', handleHistoryChange);
    };
  }, []);

  const triggerUndo = () => {
    window.dispatchEvent(new CustomEvent('coloring-canvas-undo'));
  };

  const triggerReset = () => {
    window.dispatchEvent(new CustomEvent('coloring-canvas-reset'));
  };

  // Initialize and handle sound on first interact
  useEffect(() => {
    // If we are in coloring screen, automatically try to start BGM
    if (screen === 'coloring' && !isMuted) {
      audioSynth.startBGM();
      setIsBGMStarted(true);
    } else {
      audioSynth.stopBGM();
      setIsBGMStarted(false);
    }
    return () => {
      audioSynth.stopBGM();
    };
  }, [screen]);

  // Audio Toggle Mute
  const handleToggleMute = () => {
    const newMuteState = audioSynth.toggleMute();
    setIsMuted(newMuteState);
    if (!newMuteState && screen === 'coloring') {
      audioSynth.startBGM();
      setIsBGMStarted(true);
    }
  };

  // Upload custom sheets sequential replacement
  const handleUploadSheets = (fileList: FileList) => {
    const updatedSheets = [...sheets];
    
    // Process up to 10 files
    const countToLoad = Math.min(fileList.length, 10);
    for (let i = 0; i < countToLoad; i++) {
      const file = fileList[i];
      const url = URL.createObjectURL(file);
      
      // Overwrite templates sequentially starting from slot 0
      updatedSheets[i] = {
        id: `custom_${Date.now()}_${i}`,
        name: `Dibujo Mío ${i + 1}`,
        isCustom: true,
        thumbnailUrl: url,
        fileData: file,
        drawingType: 'custom',
      };
    }
    setSheets(updatedSheets);
    audioSynth.playCelebrationSFX();
  };

  // Clear uploaded sheets and restore defaults
  const handleClearCustomSheets = () => {
    setSheets(DEFAULT_TEMPLATES);
    setCurrentSheetIdx(0);
    audioSynth.playPopSFX();
  };

  // Trigger start
  const handleStartColoring = () => {
    setScreen('coloring');
    setClickCount(0);
    // Trigger tiny celebratory sound
    audioSynth.playCelebrationSFX();
  };

  // Track clicks within the active canvas
  const handlePaintClick = () => {
    setClickCount((prev) => {
      const nextCount = prev + 1;
      // Trigger intermediate celebration every 15 successful fills
      if (nextCount >= 15) {
        triggerIntermediateCelebration();
        return 0; // Reset counter
      }
      return nextCount;
    });
  };

  // Intermediate Celebration trigger (15 clicks)
  const triggerIntermediateCelebration = () => {
    audioSynth.playCelebrationSFX();
    setShowIntermediateCelebration(true);
    
    // Light celebratory burst
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#ffc0cb', '#87ceeb', '#ffeb3b', '#4caf50', '#da70d6'],
    });

    // Auto dismiss after 5.5 seconds (making celebration feel more significant)
    setTimeout(() => {
      setShowIntermediateCelebration(false);
    }, 5500);
  };

  // Final Celebration trigger
  const triggerFinalCelebration = () => {
    audioSynth.playCelebrationSFX();
    setShowFinalCelebration(true);

    // Dynamic looping burst for extreme fun!
    const end = Date.now() + 2000;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random() * 0.4 + 0.3,
          y: Math.random() * 0.4 + 0.3,
        },
      });
    }, 200);
  };

  // Reset current coloring sheet entirely
  const handleClearCanvas = () => {
    triggerReset();
  };

  // Download colored drawing as PNG
  const handleDownloadPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = sheets[currentSheetIdx].name.toLowerCase().replace(/\s+/g, '_');
      link.download = `mi_coloreado_${safeName}.png`;
      link.href = dataUrl;
      link.click();
      audioSynth.playCelebrationSFX();
    } catch (err) {
      console.error("Could not download canvas PNG:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFFBEB] overflow-x-hidden font-sans flex flex-col items-center">
      
      {/* Background Floating Stars, Hearts & Bubbles */}
      <BackgroundFloatingShapes />

      {/* Main Content Layout based on state */}
      <AnimatePresence mode="wait">
        {screen === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
            className="w-full flex justify-center"
          >
            <WelcomeScreen
              sheets={sheets}
              onUploadSheets={handleUploadSheets}
              onClearCustomSheets={handleClearCustomSheets}
              onStartColoring={handleStartColoring}
            />
          </motion.div>
        ) : (
          <motion.div
            key="coloring"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full min-h-screen flex flex-col justify-between"
          >
            {/* Top Back Header / Nav Bar exactly matching the design template */}
            <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-8 py-3 sm:py-4 bg-white border-b-4 border-[#FDE68A] shadow-sm select-none w-full">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 via-yellow-400 via-green-400 via-cyan-400 via-blue-500 via-purple-500 via-fuchsia-500 whitespace-nowrap drop-shadow-sm">¡VAMOS A COLOREAR!</h1>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                <div className="bg-amber-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-amber-300 flex items-center gap-1.5 sm:gap-2 shadow-sm">
                  <span className="text-[10px] sm:text-xs font-black uppercase text-amber-700">Clics:</span>
                  <span className="text-base sm:text-xl font-black text-amber-900">{clickCount.toString().padStart(2, '0')}</span>
                </div>

                <button
                  onClick={handleToggleMute}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-200/50 hover:scale-105 active:scale-95 transition-all"
                  title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={triggerFinalCelebration}
                  className="px-4 sm:px-8 py-2 sm:py-3 bg-green-500 text-white font-black text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer hover:brightness-105"
                >
                  Terminar
                </button>
              </div>
            </nav>

            {/* Main container with sidebars and central canvas */}
            <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-y-auto md:overflow-hidden relative items-center md:items-start justify-center max-w-7xl mx-auto w-full">
              {/* Left Sidebar */}
              <aside className="w-full md:w-24 flex flex-row md:flex-col items-center justify-center gap-4 py-3 md:py-6 px-6 md:px-0 bg-white rounded-2xl md:rounded-[40px] border-2 border-amber-100 shadow-md md:shadow-xl z-10 shrink-0 select-none">
                {/* Active Paint/Fill Tool */}
                <button
                  onClick={() => {
                    setActiveTool('fill');
                    audioSynth.playPopSFX();
                  }}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-white shadow-lg border-b-4 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    activeTool === 'fill'
                      ? 'bg-blue-500 border-blue-700'
                      : 'bg-slate-100 text-slate-400 border-slate-300 border-b-2'
                  }`}
                  title="Modo Pintar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-wider mt-0.5">Pintar</span>
                </button>

                {/* Reset Action */}
                <button
                  onClick={triggerReset}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 transition-all cursor-pointer hover:bg-slate-100 hover:scale-105 active:scale-95"
                  title="Reiniciar Dibujo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-wider mt-0.5 text-slate-400">Limpiar</span>
                </button>

                <div className="w-[2px] md:w-12 h-6 md:h-[2px] bg-slate-100 my-0 md:my-2"></div>

                {/* Undo Action */}
                <button
                  onClick={triggerUndo}
                  disabled={historyLength <= 1}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border-2 shadow-sm flex flex-col items-center justify-center transition-all ${
                    historyLength <= 1
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                  title="Deshacer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-wider mt-0.5 ${historyLength <= 1 ? 'text-slate-300' : 'text-slate-700'}`}>Deshacer</span>
                </button>
              </aside>

              {/* Drawing Sketchpad Canvas */}
              <div className="w-full max-w-[680px] flex justify-center">
                <ColoringCanvas
                  sheet={sheets[currentSheetIdx]}
                  selectedColor={selectedColor}
                  activeTool={activeTool}
                  onPaintClick={handlePaintClick}
                />
              </div>

              {/* Selection Color Palette */}
              <ColorPalette
                selectedColor={selectedColor}
                activeTool={activeTool}
                onSelectColor={setSelectedColor}
                onSelectTool={setActiveTool}
              />
            </main>

            {/* Bottom Shelf Carousel */}
            <GalleryShelf
              sheets={sheets}
              currentSheetIndex={currentSheetIdx}
              onSelectSheet={setCurrentSheetIdx}
              onClearCanvas={handleClearCanvas}
              onDownloadPNG={handleDownloadPNG}
              onBackToWelcome={() => setScreen('welcome')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Overlays for Celebrations */}
      <AnimatePresence>
        {/* 1. Intermediate Celebration Banner ("¡GRAN TRABAJO!") */}
        {showIntermediateCelebration && (
          <motion.div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-[40px] p-12 border-8 border-yellow-400 shadow-3xl flex flex-col items-center gap-4 text-center max-w-xl"
              initial={{ scale: 0.6, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 120 }}
            >
              <div className="text-8xl animate-bounce">✨🎉🎨🏆🎨🎉✨</div>
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 via-yellow-400 via-green-500 via-blue-500 via-purple-500 select-none drop-shadow-md tracking-wider leading-none">
                ¡GRAN TRABAJO!
              </h2>
              <p className="text-slate-700 font-black text-xl sm:text-2xl mt-2">
                ¡Estás creando una obra maestra mágica! 🌟💖
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* 2. Final Celebration Big Overlay Panel */}
        {showFinalCelebration && (
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-4xl p-10 border-6 border-emerald-400 shadow-3xl flex flex-col items-center gap-6 text-center max-w-md w-full relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <div className="text-8xl animate-bounce">🏆</div>
              
              <div className="flex flex-col gap-2">
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-sky-500 to-pink-500 leading-tight">
                  ¡BUEN TRABAJO!
                </h2>
                <p className="text-slate-600 font-black text-lg">
                  ¡Has completado una obra de arte maravillosa! 🎨✨
                </p>
              </div>

              {/* Action options */}
              <div className="flex flex-col gap-3 w-full">
                <motion.button
                  onClick={handleDownloadPNG}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-lg border border-emerald-300 cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download className="w-5 h-5" />
                  <span>Guardar en mi Computadora</span>
                </motion.button>

                <button
                  onClick={() => {
                    setShowFinalCelebration(false);
                    // Reset click count
                    setClickCount(0);
                  }}
                  className="w-full py-3 px-6 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Seguir coloreando esta hoja
                </button>

                <button
                  onClick={() => {
                    setShowFinalCelebration(false);
                    setScreen('welcome');
                  }}
                  className="w-full py-3 px-6 rounded-2xl font-black text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors cursor-pointer"
                >
                  Elegir otra hoja para colorear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
