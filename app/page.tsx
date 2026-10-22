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
import { UserSessionPayload } from '@/lib/auth';
import { INITIAL_BIOMETRICS, INITIAL_NON_ZERO_HABIT, RECENT_ACTIVITIES } from '@/lib/mock-data';
import { SportType, NonZeroHabit, BiometricMetrics, ActivitySession, PopularEvent } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'coach' | 'biometrics' | 'routes' | 'events' | 'activities'>('coach');
  const [metrics, setMetrics] = useState<BiometricMetrics>(INITIAL_BIOMETRICS);
  const [habit, setHabit] = useState<NonZeroHabit>(INITIAL_NON_ZERO_HABIT);
  const [activities, setActivities] = useState<ActivitySession[]>(RECENT_ACTIVITIES);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeTargetEvent, setActiveTargetEvent] = useState<PopularEvent | null>(null);

  // Estados de Autenticación y Multi-usuario
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
      setMetrics(INITIAL_BIOMETRICS);
      setActivities(RECENT_ACTIVITIES);
      setHabit(INITIAL_NON_ZERO_HABIT);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleAuthSuccess = (user: UserSessionPayload) => {
    setCurrentUser(user);
    loadUserData();
  };

  // Estados de ruta seleccionada desde el Coach
  const [routeSport, setRouteSport] = useState<SportType>('running');
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(8);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Barra de Navegación Superior y Móvil Drawer */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        streakDays={habit.currentStreakDays}
        todayCompleted={habit.todayCompleted}
        onOpenSync={() => setIsSyncModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* PESTAÑA 1: COACH DIARIO */}
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

        {/* PESTAÑA 2: BIOMETRÍA & FATIGA */}
        {activeTab === 'biometrics' && (
          <div className="space-y-8">
            <BiometricOverview metrics={metrics} />
          </div>
        )}

        {/* PESTAÑA 3: RUTAS CERCA DE MÍ */}
        {activeTab === 'routes' && (
          <div className="space-y-8">
            <RouteExplorer
              initialSport={routeSport}
              initialDistanceKm={routeDistanceKm}
            />
          </div>
        )}

        {/* PESTAÑA 4: EVENTOS POPULARES & RETOS */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            <EventsExplorer
              metrics={metrics}
              onSetTargetEvent={(ev) => setActiveTargetEvent(ev)}
            />
          </div>
        )}

        {/* PESTAÑA 5: HISTORIAL ACTIVIDADES */}
        {activeTab === 'activities' && (
          <div className="space-y-8">
            <ActivityFeed activities={activities} />
          </div>
        )}

      </main>

      {/* Modal de Conexión de Cuentas */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncSuccess={() => loadUserData()}
      />

      {/* Modal de Autenticación y Registro Multi-usuario */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer Discreto */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <p className="max-w-7xl mx-auto px-4">
          <strong>Pulse Coach</strong> — Plataforma de Entrenamiento Adaptativo. Fusión biométrica de Garmin Connect™ y telemetría de Strava™.
        </p>
      </footer>

    </div>
  );
}
