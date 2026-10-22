'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Compass, 
  Flame, 
  HeartPulse, 
  Menu, 
  X, 
  RefreshCw, 
  ShieldCheck,
  CheckCircle2,
  Watch,
  Trophy,
  User,
  LogOut,
  Smartphone,
  Radio,
  LayoutDashboard
} from 'lucide-react';
import { UserSessionPayload } from '@/lib/auth';

interface NavbarProps {
  activeTab: 'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities';
  onSelectTab: (tab: 'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities') => void;
  streakDays: number;
  todayCompleted: boolean;
  onOpenSync: () => void;
  currentUser?: UserSessionPayload | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
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
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Marca */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleSelect('dashboard')}
                className="flex items-center gap-2.5 text-left focus:outline-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center p-1 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0 overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Pulse Coach Logo" 
                    className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg tracking-tight text-slate-900">
                      Pulse Coach
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                      EvoLab
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Inteligencia Deportiva & Rutas</p>
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 touch-target ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.98]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Acciones de la derecha: Racha + Sincronización */}
            <div className="flex items-center gap-2.5">
              {/* Racha Non-Zero */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums ${
                  todayCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                    : 'bg-amber-50 text-amber-800 border-amber-200/80'
                }`}
                title={todayCompleted ? '¡Día completado! Racha activa' : 'Entreno de hoy pendiente'}
              >
                {todayCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                ) : (
                  <Flame className="w-3.5 h-3.5 text-amber-600 stroke-[2]" />
                )}
                <span>{streakDays} días racha</span>
              </div>

              {/* Botón Sincronizar Cuentas */}
              <button
                onClick={onOpenSync}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] touch-target"
              >
                <Watch className="w-3.5 h-3.5 text-slate-500 stroke-[1.75]" />
                <span>Cuentas</span>
              </button>

              {/* Estado de Usuario / Auth */}
              {currentUser ? (
                <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-800">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold max-w-[90px] truncate">{currentUser.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1 rounded border border-slate-200">
                      {currentUser.primaryDevice}
                    </span>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all touch-target"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all touch-target"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Entrar / Registro</span>
                  </button>
                )
              )}

              {/* Botón Hamburguesa Móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 stroke-[1.75]" /> : <Menu className="w-6 h-6 stroke-[1.75]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Móvil Off-Canvas */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-indigo-600 stroke-[2]" />
                <span className="font-bold text-slate-900">Menú Pulse Coach</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors touch-target ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 space-y-3">
              {currentUser ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {currentUser.primaryDevice}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">{currentUser.email}</span>
                  {onLogout && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              ) : (
                onOpenAuth && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-bold shadow-xs touch-target"
                  >
                    <User className="w-4 h-4" />
                    <span>Iniciar Sesión / Registro</span>
                  </button>
                )
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSync();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold touch-target"
              >
                <Watch className="w-4 h-4 text-slate-600" />
                <span>Configurar Garmin & Strava</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
