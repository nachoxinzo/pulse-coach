'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BiometricOverview } from '@/components/BiometricOverview';
import { DailyCoachSection } from '@/components/DailyCoachSection';
import { NonZeroTracker } from '@/components/NonZeroTracker';
import { RouteExplorer } from '@/components/RouteExplorer';
import { EventsExplorer } from '@/components/EventsExplorer';
import { ActivityFeed } from '@/components/ActivityFeed';
import { SyncModal } from '@/components/SyncModal';
import { AuthModal } from '@/components/AuthModal';
import { CorosDashboard } from '@/components/CorosDashboard';
import { WelcomeHero } from '@/components/WelcomeHero';
import { GuidedTutorial } from '@/components/GuidedTutorial';
import { PerformanceReportModal } from '@/components/PerformanceReportModal';
import { UserSessionPayload } from '@/lib/auth';
import { INITIAL_BIOMETRICS, INITIAL_NON_ZERO_HABIT, RECENT_ACTIVITIES } from '@/lib/mock-data';
import { SportType, NonZeroHabit, BiometricMetrics, ActivitySession, PopularEvent } from '@/types';
import { Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'biometrics' | 'routes' | 'events' | 'activities'>('dashboard');
  const [metrics, setMetrics] = useState<BiometricMetrics>(INITIAL_BIOMETRICS);
  const [habit, setHabit] = useState<NonZeroHabit>(INITIAL_NON_ZERO_HABIT);
  const [activities, setActivities] = useState<ActivitySession[]>(RECENT_ACTIVITIES);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<'garmin' | 'coros' | 'igpsport' | 'strava'>('coros');
  const [activeTargetEvent, setActiveTargetEvent] = useState<PopularEvent | null>(null);

  const handleOpenSync = (tab: 'garmin' | 'coros' | 'igpsport' | 'strava' = 'coros') => {
    setSyncModalTab(tab);
    setIsSyncModalOpen(true);
  };

  // Estados de Autenticación, Demo y Tutorial Guiado
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Cargar datos del usuario autenticado desde el servidor
  const loadUserData = async () => {
    try {
      const res = await fetch('/api/user/data');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.metrics) setMetrics(data.metrics);
          if (data.activities) setActivities(data.activities);
          if (data.habit) setHabit(data.habit);
        } else if (data.activities && data.activities.length > 0) {
          setActivities(data.activities);
          if (data.metrics) setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn('Error cargando datos de usuario:', err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setIsDemoMode(false);
      setMetrics(INITIAL_BIOMETRICS);
      setActivities(RECENT_ACTIVITIES);
      setHabit(INITIAL_NON_ZERO_HABIT);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserSessionPayload, isNewUser?: boolean) => {
    setCurrentUser(user);
    setIsDemoMode(false);
    loadUserData();

    // Si es registro nuevo o primer acceso, activar el tutorial guiado
    if (isNewUser) {
      setIsTutorialOpen(true);
      try {
        localStorage.setItem(`pulse_tutorial_seen_${user.userId}`, 'true');
      } catch {
        // Ignorar
      }
    }
  };

  // Estados de ruta seleccionada desde el Coach o Heatmap
  const [routeSport, setRouteSport] = useState<SportType>('running');
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(8);
  const [routeMode, setRouteMode] = useState<'loop' | 'database' | 'heatmap'>('loop');

  // Persistir en localStorage si está disponible
  useEffect(() => {
    try {
      const savedHabit = localStorage.getItem('pulse_coach_habit');
      if (savedHabit) {
        setHabit(JSON.parse(savedHabit));
      }
    } catch {
      // Ignorar si falla lectura
    }
  }, []);

  const saveHabitState = (newHabit: NonZeroHabit) => {
    setHabit(newHabit);
    try {
      localStorage.setItem('pulse_coach_habit', JSON.stringify(newHabit));
    } catch {
      // Ignorar
    }
  };

  // Completar entrenamiento propuesto
  const handleCompleteWorkout = (workoutTitle: string) => {
    const updated: NonZeroHabit = {
      ...habit,
      todayCompleted: true,
      todayCompletedWorkoutTitle: workoutTitle,
      currentStreakDays: habit.todayCompleted ? habit.currentStreakDays : habit.currentStreakDays + 1,
    };
    saveHabitState(updated);
  };

  // Registrar Micro-dosis de rescate (Non-Zero)
  const handleLogQuickRescue = () => {
    handleCompleteWorkout('Micro-Dosis Non-Zero: 12 min Movilidad & Core');
  };

  // Actualizar recordatorio
  const handleUpdateReminder = (enabled: boolean, time: string) => {
    const updated: NonZeroHabit = {
      ...habit,
      reminderEnabled: enabled,
      reminderTime: time,
    };
    saveHabitState(updated);
  };

  // Salto directo desde el Coach a las Rutas
  const handleSelectRouteForWorkout = (sport: SportType, distanceKm: number) => {
    setRouteSport(sport);
    setRouteDistanceKm(distanceKm);
    setActiveTab('routes');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
      
      {/* Barra de Navegación Superior y Móvil Drawer */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        streakDays={habit.currentStreakDays}
        todayCompleted={habit.todayCompleted}
        onOpenSync={handleOpenSync}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Banner de Aviso en Modo Demo */}
      {!currentUser && isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 border-b border-amber-500/20 dark:border-amber-500/30 py-2 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-center sm:text-left">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>
                <strong>Modo Demo Activo:</strong> Estás explorando con telemetría de muestra.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAuth('register')}
                className="font-bold text-indigo-700 dark:text-cyan-400 hover:underline"
              >
                Crear Cuenta Gratuita
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => setIsDemoMode(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Volver a Portada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* CASO 1: VISITANTE NO AUTENTICADO Y NO EN DEMO -> PORTADA HERO BIENVENIDA */}
        {!currentUser && !isDemoMode ? (
          <WelcomeHero
            onOpenRegister={() => handleOpenAuth('register')}
            onOpenLogin={() => handleOpenAuth('login')}
            onExploreDemo={() => setIsDemoMode(true)}
          />
        ) : (
          /* CASO 2: USUARIO REGISTRADO / AUTENTICADO O EN MODO DEMO */
          <>
            {/* PESTAÑA PRINCIPAL: DASHBOARD RESUMEN ESTILO COROS EVOLAB */}
            {activeTab === 'dashboard' && (
              <CorosDashboard
                metrics={metrics}
                activities={activities}
                habit={habit}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenSync={handleOpenSync}
                onRefreshData={loadUserData}
                currentUser={currentUser}
              />
            )}

            {/* PESTAÑA 2: COACH DIARIO */}
            {activeTab === 'coach' && (
              <div className="space-y-8">
                <DailyCoachSection
                  metrics={metrics}
                  onSelectRouteForWorkout={handleSelectRouteForWorkout}
                  onCompleteWorkout={handleCompleteWorkout}
                  todayCompleted={habit.todayCompleted}
                  completedWorkoutTitle={habit.todayCompletedWorkoutTitle}
                />

                {/* Tarjeta de Hábitos y Recordatorio Integrada */}
                <NonZeroTracker
                  habit={habit}
                  onUpdateReminder={handleUpdateReminder}
                  onLogQuickRescue={handleLogQuickRescue}
                />
              </div>
            )}

            {/* PESTAÑA 3: BIOMETRÍA & FATIGA */}
            {activeTab === 'biometrics' && (
              <div className="space-y-8">
                <BiometricOverview metrics={metrics} />
              </div>
            )}

            {/* PESTAÑA 4: RUTAS CERCA DE MÍ */}
            {activeTab === 'routes' && (
              <div className="space-y-8">
                <RouteExplorer
                  initialSport={routeSport}
                  initialDistanceKm={routeDistanceKm}
                  initialMode={routeMode}
                />
              </div>
            )}

            {/* PESTAÑA 5: EVENTOS POPULARES & RETOS */}
            {activeTab === 'events' && (
              <div className="space-y-8">
                <EventsExplorer
                  metrics={metrics}
                  onSetTargetEvent={(ev) => setActiveTargetEvent(ev)}
                />
              </div>
            )}

            {/* PESTAÑA 6: HISTORIAL ACTIVIDADES */}
            {activeTab === 'activities' && (
              <div className="space-y-8">
                <ActivityFeed activities={activities} />
              </div>
            )}
          </>
        )}

      </main>

      {/* Modal de Conexión de Cuentas */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        initialTab={syncModalTab}
        onSyncSuccess={() => loadUserData()}
      />

      {/* Modal de Autenticación y Registro Multi-usuario */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Tutorial Guiado de Bienvenida y Onboarding */}
      <GuidedTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        userName={currentUser?.name}
      />

      {/* Informe Ejecutivo de Rendimiento Imprimible / PDF */}
      <PerformanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        metrics={metrics}
        activities={activities}
        habit={habit}
        currentUser={currentUser}
      />

      {/* Footer Discreto */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-6 text-center text-xs text-slate-500 dark:text-slate-400 pb-safe">
        <p className="max-w-7xl mx-auto px-4">
          <strong>Pulse Coach</strong> — Plataforma de Entrenamiento Adaptativo. Fusión biométrica de Garmin Connect™ y telemetría de Strava™.
        </p>
      </footer>

    </div>
  );
}
