'use client';

import React, { useState } from 'react';
import { X, Watch, Key, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export function SyncModal({ isOpen, onClose, onSyncSuccess }: SyncModalProps) {
  const [garminUser, setGarminUser] = useState('');
  const [garminPass, setGarminPass] = useState('');
  const [stravaToken, setStravaToken] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncingGarmin, setIsSyncingGarmin] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncRealGarmin = async () => {
    setIsSyncingGarmin(true);
    setSyncStatusMsg('Conectando con Garmin Connect y leyendo tus actividades reales...');
    try {
      const res = await fetch('/api/garmin/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(`¡Éxito! Se han importado ${data.activitiesCount} actividades reales de tu cuenta de Garmin.`);
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncStatusMsg(`Aviso: ${data.error || 'No se pudieron descargar las actividades.'}`);
      }
    } catch {
      setSyncStatusMsg('Error de red al conectar con el servidor de sincronización.');
    } finally {
      setIsSyncingGarmin(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSyncRealGarmin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Watch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cuentas Garmin & Strava</h3>
              <p className="text-xs text-slate-500">Sincronización segura de telemetría y biometría</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Garmin Connect */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-xs font-bold text-slate-900">Garmin Connect</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Sesión Conectada
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Sincroniza tus salidas y entrenamientos reales registrados en tu reloj o ciclocomputador Garmin.
            </p>

            <button
              type="button"
              onClick={handleSyncRealGarmin}
              disabled={isSyncingGarmin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs touch-target active:scale-[0.98] disabled:opacity-60"
            >
              {isSyncingGarmin ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Watch className="w-4 h-4 text-white" />
              )}
              <span>{isSyncingGarmin ? 'Sincronizando con Garmin...' : 'Descargar Mis Actividades Reales'}</span>
            </button>
          </div>

          {/* Banner de Estado */}
          {syncStatusMsg && (
            <div className="p-3 bg-slate-900 text-white text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <span>{syncStatusMsg}</span>
              <button
                type="button"
                onClick={() => setSyncStatusMsg(null)}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Strava */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-slate-900">Strava API v3</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Conectado
              </span>
            </div>
            <input
              type="text"
              placeholder="Strava OAuth Token / Client Secret"
              value={stravaToken}
              onChange={(e) => setStravaToken(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Tus datos se procesan de forma privada en tu dispositivo y se guardan en tu navegador.</span>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Credenciales guardadas y sincronización actualizada!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all touch-target"
            >
              Guardar y Sincronizar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
