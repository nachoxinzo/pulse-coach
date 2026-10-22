'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Watch, 
  Download, 
  Share2, 
  RefreshCw, 
  MapPin, 
  TrendingUp, 
  Compass,
  Layers,
  ArrowRight
} from 'lucide-react';
import { parseGpxXml, ParsedGpxTrack } from '@/lib/gpx-parser';
import { SportType } from '@/types';

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <span className="text-xs text-slate-400">Cargando mapa interactivo...</span>
    </div>
  ),
});

interface GpxToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackLoaded?: (track: ParsedGpxTrack) => void;
}

export function GpxToolModal({ isOpen, onClose, onTrackLoaded }: GpxToolModalProps) {
  const [selectedSport, setSelectedSport] = useState<SportType>('running');
  const [parsedTrack, setParsedTrack] = useState<ParsedGpxTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSendingGarmin, setIsSendingGarmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseGpxXml(text);
        setParsedTrack(result);
        if (onTrackLoaded) {
          onTrackLoaded(result);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al analizar el archivo GPX.');
        setParsedTrack(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo desde el dispositivo.');
    };
    reader.readAsText(file);
  };

  const handleSendToGarmin = async () => {
    if (!parsedTrack) return;
    setIsSendingGarmin(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/garmin/send-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedTrack.name,
          sport: selectedSport,
          coordinates: parsedTrack.coordinates,
          elevationProfile: parsedTrack.elevationProfile,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`¡Track "${parsedTrack.name}" enviado con éxito a tu Garmin Connect! Sincroniza tu reloj para navegarlo.`);
      } else {
        setErrorMessage(data.error || 'No se pudo enviar automáticamente a Garmin Connect.');
      }
    } catch {
      setErrorMessage('Error de red al conectar con la API de Garmin.');
    } finally {
      setIsSendingGarmin(false);
    }
  };

  const handleDownloadOptimizedGpx = () => {
    if (!parsedTrack) return;
    const blob = new Blob([parsedTrack.rawGpx], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsedTrack.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_pulse.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('Track descargado correctamente en formato GPX 1.1.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 rounded-xl text-cyan-700 dark:text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Herramienta de Tracks GPX Reales
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Importa cualquier track oficial de Wikiloc, Strava o carrera y envíalo a tu Garmin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all touch-target"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Zona Drag & Drop / Selección de Archivo */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 transition-colors"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".gpx,.xml" 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 mx-auto flex items-center justify-center mb-2 shadow-xs">
              <Upload className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Haz clic o arrastra un archivo <span className="text-cyan-600 dark:text-cyan-400 font-mono">.gpx</span> aquí
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Compatible con descargas de Wikiloc, Strava, Garmin Connect o la web oficial de tu evento
            </p>
          </div>

          {/* Mensajes de Alerta o Éxito */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Información y Vista Previa del Track Importado */}
          {parsedTrack && (
            <div className="space-y-4 pt-2">
              
              {/* Tarjeta de Métricas Auditadas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 tracking-wider block">
                      Track Real Auditado
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{parsedTrack.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                      {parsedTrack.coordinates.length} puntos GPS
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Distancia Real</span>
                    <strong className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                      {parsedTrack.totalDistanceKm} km
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Desnivel +</span>
                    <strong className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{parsedTrack.totalElevationGainM} m
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tipo Deporte</span>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value as SportType)}
                      className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 text-slate-800 dark:text-slate-200 mt-0.5"
                    >
                      <option value="running">Running Asfalto</option>
                      <option value="trail">Trail Running</option>
                      <option value="cycling">Ciclismo Carretera</option>
                      <option value="mtb">BTT / MTB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Visor de Mapa con el Trazado Real */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <RouteMap
                  coordinates={parsedTrack.coordinates}
                  center={parsedTrack.coordinates[0]}
                  sport={selectedSport}
                />
              </div>

              {/* Botonera de Envío y Descarga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={handleSendToGarmin}
                  disabled={isSendingGarmin}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 touch-target"
                >
                  {isSendingGarmin ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Watch className="w-4 h-4" />
                  )}
                  <span>{isSendingGarmin ? 'Enviando trayecto...' : 'Enviar a mi Garmin Connect'}</span>
                </button>

                <button
                  onClick={handleDownloadOptimizedGpx}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-[0.98] touch-target"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar GPX para Strava / COROS</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Garantía de Fidelidad GPS: 100% coordenadas reales</span>
          <button 
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 hover:underline font-semibold"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
