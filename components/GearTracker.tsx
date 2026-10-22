'use client';

import React, { useState, useEffect } from 'react';
import { 
  Footprints, 
  Bike, 
  Plus, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  Sparkles, 
  Calendar, 
  Wrench, 
  Check, 
  X,
  ChevronRight,
  ShieldCheck,
  Disc,
  Link as LinkIcon
} from 'lucide-react';

export interface GearComponent {
  id: string;
  name: string;
  currentKm: number;
  maxKm: number;
  lastReplacedDate?: string;
  status: 'good' | 'warning' | 'replace';
}

export interface GearItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: 'shoes' | 'bike';
  sportType: 'running' | 'trail' | 'cycling' | 'mtb';
  currentKm: number;
  maxKm: number;
  purchaseDate: string;
  isDefault: boolean;
  status: 'good' | 'warning' | 'replace';
  components?: GearComponent[];
}

const INITIAL_GEAR: GearItem[] = [
  {
    id: 'gear-shoes-1',
    name: 'Asics Novablast 4',
    brand: 'Asics',
    model: 'Novablast 4',
    type: 'shoes',
    sportType: 'running',
    currentKm: 485,
    maxKm: 750,
    purchaseDate: '12 Ene 2026',
    isDefault: true,
    status: 'good'
  },
  {
    id: 'gear-shoes-2',
    name: 'Hoka Speedgoat 5 (Trail)',
    brand: 'Hoka',
    model: 'Speedgoat 5',
    type: 'shoes',
    sportType: 'trail',
    currentKm: 690,
    maxKm: 700,
    purchaseDate: '18 Nov 2025',
    isDefault: false,
    status: 'warning'
  },
  {
    id: 'gear-bike-1',
    name: 'Orbea Oiz Carbon 29"',
    brand: 'Orbea',
    model: 'Oiz M-Pro',
    type: 'bike',
    sportType: 'mtb',
    currentKm: 2840,
    maxKm: 15000,
    purchaseDate: '10 May 2025',
    isDefault: true,
    status: 'good',
    components: [
      {
        id: 'comp-chain',
        name: 'Cadena SRAM GX Eagle 12v',
        currentKm: 2320,
        maxKm: 2500,
        lastReplacedDate: '15 Sep 2025',
        status: 'warning'
      },
      {
        id: 'comp-tyres',
        name: 'Cubiertas Maxxis Rekon Race 2.35',
        currentKm: 1850,
        maxKm: 3200,
        lastReplacedDate: '20 Oct 2025',
        status: 'good'
      },
      {
        id: 'comp-brakes',
        name: 'Pastillas Freno Shimano XT Resina',
        currentKm: 1420,
        maxKm: 1500,
        lastReplacedDate: '05 Nov 2025',
        status: 'replace'
      },
      {
        id: 'comp-tubeless',
        name: 'Líquido Sellante Tubeless Stan\'s',
        currentKm: 650,
        maxKm: 1000,
        lastReplacedDate: '10 Feb 2026',
        status: 'good'
      }
    ]
  }
];

export function GearTracker() {
  const [gearList, setGearList] = useState<GearItem[]>(INITIAL_GEAR);
  const [activeTab, setActiveTab] = useState<'all' | 'shoes' | 'bikes'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGearType, setNewGearType] = useState<'shoes' | 'bike'>('shoes');
  const [newGearName, setNewGearName] = useState('');
  const [newGearBrand, setNewGearBrand] = useState('');
  const [newGearModel, setNewGearModel] = useState('');
  const [newGearMaxKm, setNewGearMaxKm] = useState('750');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_gear_items');
      if (stored) {
        setGearList(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveGear = (updated: GearItem[]) => {
    setGearList(updated);
    try {
      localStorage.setItem('pulse_gear_items', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  const handleResetComponent = (bikeId: string, compId: string) => {
    const todayStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const updated = gearList.map(bike => {
      if (bike.id === bikeId && bike.components) {
        return {
          ...bike,
          components: bike.components.map(c => {
            if (c.id === compId) {
              return {
                ...c,
                currentKm: 0,
                lastReplacedDate: todayStr,
                status: 'good' as const
              };
            }
            return c;
          })
        };
      }
      return bike;
    });
    saveGear(updated);
  };

  const handleSetDefault = (id: string, type: 'shoes' | 'bike') => {
    const updated = gearList.map(g => {
      if (g.type === type) {
        return { ...g, isDefault: g.id === id };
      }
      return g;
    });
    saveGear(updated);
  };

  const handleCreateGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearName.trim()) return;

    const maxKmNum = parseInt(newGearMaxKm) || (newGearType === 'shoes' ? 750 : 15000);
    const todayStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    const newEntry: GearItem = {
      id: `gear-${Date.now()}`,
      name: newGearName.trim(),
      brand: newGearBrand.trim() || 'Genérico',
      model: newGearModel.trim() || newGearName.trim(),
      type: newGearType,
      sportType: newGearType === 'shoes' ? 'running' : 'mtb',
      currentKm: 0,
      maxKm: maxKmNum,
      purchaseDate: todayStr,
      isDefault: gearList.filter(g => g.type === newGearType).length === 0,
      status: 'good',
      components: newGearType === 'bike' ? [
        { id: `c-chain-${Date.now()}`, name: 'Cadena de transmisión', currentKm: 0, maxKm: 2500, status: 'good' },
        { id: `c-tyre-${Date.now()}`, name: 'Cubiertas / Neumáticos', currentKm: 0, maxKm: 3500, status: 'good' },
        { id: `c-brake-${Date.now()}`, name: 'Pastillas de freno', currentKm: 0, maxKm: 1500, status: 'good' }
      ] : undefined
    };

    saveGear([...gearList, newEntry]);
    setIsAddModalOpen(false);
    setNewGearName('');
    setNewGearBrand('');
    setNewGearModel('');
  };

  const filteredGear = gearList.filter(g => {
    if (activeTab === 'shoes') return g.type === 'shoes';
    if (activeTab === 'bikes') return g.type === 'bike';
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Garmin & Strava Gear Tracker
            </span>
            <span className="text-xs text-slate-400">Desgaste y Mantenimiento</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Gestor de Zapatillas y Componentes de Bici</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoriza los kilómetros acumulados para prevenir lesiones articulares y roturas mecánicas inesperadas.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Selector de pestañas */}
          <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setActiveTab('shoes')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'shoes' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 text-cyan-500" />
              <span>Zapatillas</span>
            </button>
            <button
              onClick={() => setActiveTab('bikes')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'bikes' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bicis</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all active:scale-[0.98] shadow-xs touch-target"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Añadir Material</span>
          </button>
        </div>
      </div>

      {/* Lista de Material */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGear.map(item => {
          const pct = Math.min(100, Math.round((item.currentKm / item.maxKm) * 100));
          const remainingKm = Math.max(0, item.maxKm - item.currentKm);
          const isWarning = pct >= 85 && pct < 100;
          const isExpired = pct >= 100;

          return (
            <div 
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${
                isExpired 
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20' 
                  : isWarning 
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20' 
                  : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60'
              }`}
            >
              {/* Encabezado del elemento */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'shoes'
                      ? 'bg-cyan-100/80 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                      : 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {item.type === 'shoes' ? (
                      <Footprints className="w-5 h-5 stroke-[2]" />
                    ) : (
                      <Bike className="w-5 h-5 stroke-[2]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.brand}</span>
                      {item.isDefault && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          Predeterminado
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.name}</h3>
                  </div>
                </div>

                {/* Badge de estado */}
                <div>
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                      Reemplazar
                    </span>
                  ) : isWarning ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                      Vida Límite ({remainingKm} km)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      Óptimo
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progreso de kilómetros */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.currentKm} <span className="font-normal text-slate-400">/ {item.maxKm} km</span>
                  </span>
                  <span className={`font-black ${
                    isExpired ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {pct}% vida útil
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isExpired 
                        ? 'bg-rose-500' 
                        : isWarning 
                        ? 'bg-amber-500' 
                        : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Adquirido: {item.purchaseDate}</span>
                  <span>{remainingKm > 0 ? `${remainingKm} km restantes` : 'Amortizado al 100%'}</span>
                </div>
              </div>

              {/* Componentes individuales para bicis */}
              {item.type === 'bike' && item.components && item.components.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-cyan-500" />
                      Desgaste de Transmisión & Frenos
                    </span>
                  </div>

                  <div className="space-y-2">
                    {item.components.map(comp => {
                      const compPct = Math.min(100, Math.round((comp.currentKm / comp.maxKm) * 100));
                      const compAlert = compPct >= 90;
                      return (
                        <div key={comp.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{comp.name}</span>
                              {compAlert && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  ¡Cambiar!
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              {comp.currentKm} km / {comp.maxKm} km ({compPct}%)
                            </span>
                          </div>

                          <button
                            onClick={() => handleResetComponent(item.id, comp.id)}
                            className="self-end sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-[11px] font-semibold transition-all active:scale-[0.98] shadow-2xs"
                            title="Registrar componente nuevo y reiniciar contador a 0 km"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Poner nuevo</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón hacer predeterminado si no lo es */}
              {!item.isDefault && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleSetDefault(item.id, item.type)}
                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 flex items-center gap-1"
                  >
                    <span>Asignar por defecto a sesiones de {item.type === 'shoes' ? 'running' : 'ciclismo'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para añadir nuevo material */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Añadir Nuevo Material</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGear} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Material</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewGearType('shoes'); setNewGearMaxKm('750'); }}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                      newGearType === 'shoes'
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span>Zapatillas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewGearType('bike'); setNewGearMaxKm('15000'); }}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                      newGearType === 'bike'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Bicicleta</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre o Apodo</label>
                <input
                  type="text"
                  required
                  placeholder={newGearType === 'shoes' ? 'Ej. Nike Pegasus 40 Rodajes' : 'Ej. Orbea Alma H30 MTB'}
                  value={newGearName}
                  onChange={e => setNewGearName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ej. Nike, Asics, Trek"
                    value={newGearBrand}
                    onChange={e => setNewGearBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Límite Km Recomendado</label>
                  <input
                    type="number"
                    value={newGearMaxKm}
                    onChange={e => setNewGearMaxKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-xs"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
