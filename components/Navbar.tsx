'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Compass, 
  Flame, 
  HeartPulse, 
  Menu, 
  X, 
  CheckCircle2, 
  Watch, 
  Trophy, 
  User, 
  LogOut, 
  LayoutDashboard,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Award
} from 'lucide-react';
import { UserSessionPayload } from '@/lib/auth';

interface NavbarProps {
  activeTab: 'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities';
  onSelectTab: (tab: 'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities') => void;
  streakDays: number;
  todayCompleted: boolean;
  onOpenSync: (tab?: 'garmin' | 'coros' | 'igpsport' | 'strava') => void;
  currentUser?: UserSessionPayload | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenTutorial?: () => void;
  onOpenReport?: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  streakDays,
  todayCompleted,
  onOpenSync,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenTutorial,
  onOpenReport,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('system');

  // Inicializar y escuchar el tema
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_theme') as 'system' | 'dark' | 'light' | null;
      if (stored) {
        setTheme(stored);
        applyTheme(stored);
      } else {
        setTheme('system');
        applyTheme('system');
      }
    } catch {
      // Ignorar en SSR
    }

    // Escuchar cambios de preferencia del sistema si está en 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentStored = localStorage.getItem('pulse_theme');
      if (!currentStored || currentStored === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (targetTheme: 'system' | 'dark' | 'light') => {
    const root = document.documentElement;
    let isDark = false;

    if (targetTheme === 'dark') {
      isDark = true;
    } else if (targetTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const handleToggleTheme = () => {
    let nextTheme: 'system' | 'dark' | 'light' = 'dark';
    if (theme === 'system') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'light';
    else nextTheme = 'system';

    setTheme(nextTheme);
    try {
      localStorage.setItem('pulse_theme', nextTheme);
    } catch {
      // Ignorar
    }
    applyTheme(nextTheme);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'coach', label: 'Coach', icon: Flame },
    { id: 'biometrics', label: 'EvoLab', icon: HeartPulse },
    { id: 'routes', label: 'Rutas', icon: Compass },
    { id: 'events', label: 'Eventos', icon: Trophy },
    { id: 'activities', label: 'Historial', icon: Activity },
  ] as const;

  const handleSelect = (tab: 'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] pt-safe transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo & Marca */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button 
                onClick={() => handleSelect('dashboard')}
                className="flex items-center gap-2 text-left focus:outline-hidden"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center p-1 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0 overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Pulse Coach Logo" 
                    className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                      Pulse Coach
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded-md bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      EvoLab
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Inteligencia Deportiva & Rutas</p>
                </div>
              </button>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-150 touch-target ${
                      isActive
                        ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-cyan-400 dark:text-slate-950' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Acciones de la derecha: Racha + Tema + Auth */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Selector Rápido de Tema (Claro / Oscuro / Auto) */}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all touch-target"
                title={`Tema actual: ${theme === 'system' ? 'Automático (Sistema del móvil)' : theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}. Toca para cambiar.`}
                aria-label="Cambiar tema de color"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-cyan-400" />
                ) : theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Monitor className="w-4 h-4 text-indigo-400" />
                )}
              </button>

              {/* Racha Non-Zero */}
              <div 
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums ${
                  todayCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
                title={todayCompleted ? '¡Día completado! Racha activa' : 'Entreno de hoy pendiente'}
              >
                {todayCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
                ) : (
                  <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2]" />
                )}
                <span>{streakDays} <span className="hidden sm:inline">días</span></span>
              </div>

              {/* Botón Sincronizar Reloj / GPS (Desktop) */}
              <button
                onClick={() => onOpenSync('coros')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] touch-target"
                title="Vincular relojes COROS, Garmin, ciclocomputadores iGPSPORT y Strava"
              >
                <Watch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 stroke-[1.75]" />
                <span>Vincular Reloj / GPS</span>
              </button>

              {/* Botón Guía / Tutorial (Desktop) */}
              {onOpenTutorial && (
                <button
                  onClick={onOpenTutorial}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] touch-target"
                  title="Ver Tutorial Guiado"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Guía</span>
                </button>
              )}

              {/* Botón Informe Ejecutivo PDF (Desktop) */}
              {onOpenReport && (
                <button
                  onClick={onOpenReport}
                  className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-100 text-xs font-bold shadow-2xs transition-all active:scale-[0.98] touch-target"
                  title="Generar Certificado e Informe Ejecutivo PDF"
                >
                  <Award className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 stroke-[2]" />
                  <span>Informe PDF</span>
                </button>
              )}

              {/* Estado de Usuario / Auth */}
              {currentUser ? (
                <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold max-w-[85px] truncate">{currentUser.name}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">
                      {currentUser.primaryDevice}
                    </span>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all touch-target"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                onOpenAuth && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenAuth('login')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all touch-target"
                    >
                      <span>Entrar</span>
                    </button>
                    <button
                      onClick={() => onOpenAuth('register')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-xs transition-all touch-target"
                    >
                      <span>Registro</span>
                    </button>
                  </div>
                )
              )}

              {/* Botón Hamburguesa Móvil Accesible */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 active:scale-95 transition-all touch-target"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 stroke-[2]" /> : <Menu className="w-6 h-6 stroke-[2]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Móvil Off-Canvas Profesional con Safe Areas */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white h-full shadow-2xl flex flex-col p-5 z-10 pt-safe pb-safe border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-cyan-500 stroke-[2]" />
                <span className="font-bold text-slate-900 dark:text-white text-base">Menú Pulse Coach</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Tema en Móvil */}
            <div className="py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Tema de Visualización
              </span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => {
                    setTheme('system');
                    try { localStorage.setItem('pulse_theme', 'system'); } catch {}
                    applyTheme('system');
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
                    theme === 'system' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    try { localStorage.setItem('pulse_theme', 'dark'); } catch {}
                    applyTheme('dark');
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
                    theme === 'dark' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Oscuro</span>
                </button>
                <button
                  onClick={() => {
                    setTheme('light');
                    try { localStorage.setItem('pulse_theme', 'light'); } catch {}
                    applyTheme('light');
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
                    theme === 'light' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Claro</span>
                </button>
              </div>
            </div>

            {/* Enlaces de Pestañas */}
            <div className="py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors touch-target ${
                      isActive
                        ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 dark:text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Acciones Inferiores del Menú Móvil */}
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              {currentUser ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {currentUser.primaryDevice}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{currentUser.email}</span>
                  {onLogout && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              ) : (
                onOpenAuth && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold touch-target"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('register');
                      }}
                      className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black touch-target"
                    >
                      Registrarse
                    </button>
                  </div>
                )
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSync('coros');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 text-xs font-bold touch-target"
                >
                  <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>COROS / iGPS</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSync('garmin');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold touch-target"
                >
                  <Watch className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Garmin / Strava</span>
                </button>
              </div>

              {onOpenTutorial && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTutorial();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 text-xs font-semibold touch-target"
                >
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Ver Tutorial Guiado</span>
                </button>
              )}

              {onOpenReport && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReport();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold touch-target"
                >
                  <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Informe Ejecutivo PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
