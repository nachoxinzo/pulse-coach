/**
 * Algoritmos de Nutrición Deportiva Avanzada & Bioenergética
 * Basado en los consensos científicos:
 * - Asker Jeukendrup (2014): "A Step Towards Personalized Sports Nutrition: Carbohydrate Intake During Exercise"
 * - ACSM / Sawka et al. (2007): "Exercise and Fluid Replacement - Guidelines on Body Mass Scaling"
 * - Burke et al. (2011): "Carbohydrates for training and competition"
 * - Burd, Tipton et al. (UIUC): "Whole-food vs commercial gel carbohydrate oxidation kinetics in endurance cycling"
 */

import { SportType } from '@/types';

export type FoodStrategy = 'real_food' | 'hybrid' | 'supplements';
export type WeatherType = 'cool' | 'moderate' | 'hot' | 'very_hot';
export type GutTrainingLevel = 'beginner' | 'standard' | 'adapted';
export type WorkoutIntensity = 'endurance_z2' | 'tempo_z3' | 'threshold_z4' | 'race';

export interface SportsNutritionInput {
  weightKg: number; // Peso corporal del deportista (ej: 99 kg)
  durationMin: number; // Duración prevista en minutos
  sport: SportType; // ciclismo, mtb, running, trail...
  weather: WeatherType;
  foodStrategy: FoodStrategy;
  gutTrainingLevel: GutTrainingLevel;
  intensity?: WorkoutIntensity;
  useCaffeine?: boolean;
}

export interface FoodItemInfo {
  id: string;
  name: string;
  servingName: string;
  carbsGrams: number;
  sodiumMg: number;
  caloriesKcal: number;
  type: 'solid' | 'semi_solid' | 'liquid';
  description: string;
}

export const ENDURANCE_FOOD_DB: Record<string, FoodItemInfo> = {
  bocadillo_guayaba: {
    id: 'bocadillo_guayaba',
    name: 'Bocadito / Pasta de Guayaba',
    servingName: '1 pieza (30-35g)',
    carbsGrams: 26,
    sodiumMg: 15,
    caloriesKcal: 105,
    type: 'semi_solid',
    description: 'Carbohidrato natural con ratio balanceado glucosa/fructosa (~1:1). Fácil masticación, disolución rápida con saliva y cero acidez estomacal.',
  },
  sandwich_pavo_jamon: {
    id: 'sandwich_pavo_jamon',
    name: 'Medio Sándwich de Pavo / Jamón',
    servingName: '1/2 sándwich pan blanco',
    carbsGrams: 18,
    sodiumMg: 350,
    caloriesKcal: 135,
    type: 'solid',
    description: 'Pan blanco de rápida absorción con aporte natural de sodio y un punto salado que previene la fatiga del dulce y la hiponatremia en tiradas largas.',
  },
  sandwich_membrillo: {
    id: 'sandwich_membrillo',
    name: 'Medio Sándwich de Membrillo',
    servingName: '1/2 sándwich pan blanco',
    carbsGrams: 28,
    sodiumMg: 120,
    caloriesKcal: 150,
    type: 'solid',
    description: 'Carbohidratos dobles (almidón del pan + fructosa/glucosa del membrillo) que aprovechan los transportadores SGLT1 y GLUT5 sin saturar el estómago.',
  },
  platano_maduro: {
    id: 'platano_maduro',
    name: 'Plátano Maduro',
    servingName: '1 unidad mediana',
    carbsGrams: 25,
    sodiumMg: 2,
    caloriesKcal: 105,
    type: 'solid',
    description: 'Aporte de 420mg de potasio, magnesio y textura suave para consumir en tramos llanos o de rodaje suave.',
  },
  datiles_medjool: {
    id: 'datiles_medjool',
    name: 'Dátiles Medjool',
    servingName: '2 unidades deshuesadas',
    carbsGrams: 24,
    sodiumMg: 5,
    caloriesKcal: 95,
    type: 'semi_solid',
    description: 'Energía densa en volumen reducido. Muy ricos en polifenoles y azúcares simples naturales.',
  },
  isotonico_bidon: {
    id: 'isotonico_bidon',
    name: 'Bidón Bebida Isotónica / Sales',
    servingName: '1 bidón (750ml)',
    carbsGrams: 35,
    sodiumMg: 500,
    caloriesKcal: 140,
    type: 'liquid',
    description: 'Osmolaridad hipotónica/isotónica (6-7%) con electrolitos completos para atletas con alta tasa de sudoración.',
  },
  gel_comercial: {
    id: 'gel_comercial',
    name: 'Gel Energético Tradicional',
    servingName: '1 gel (40-50g)',
    carbsGrams: 30,
    sodiumMg: 150,
    caloriesKcal: 120,
    type: 'semi_solid',
    description: 'Concentrado hipertónico de maltodextrina/fructosa.',
  },
};

export interface PlannedTimelineItem {
  min: number;
  label: string;
  foodName: string;
  portion: string;
  carbsGrams: number;
  waterMl: number;
  notes: string;
  hasCaffeine?: boolean;
  category: 'pre' | 'intra' | 'post';
}

export interface PocketPackItem {
  foodName: string;
  quantity: number;
  unit: string;
  totalCarbsGrams: number;
  tip: string;
}

export interface SportsNutritionPlan {
  weightKg: number;
  durationMin: number;
  sport: SportType;
  carbsPerHour: number;
  totalCarbsGrams: number;
  waterMlPerHour: number;
  totalWaterLiters: number;
  sodiumMgPerHour: number;
  totalSodiumMg: number;
  sweatRateEstimateLitersPerHour: number;
  pocketPackList: PocketPackItem[];
  timeline: PlannedTimelineItem[];
  recoveryProtocol: {
    carbsGrams: number;
    proteinGrams: number;
    fluidsLiters: number;
    recommendedFoods: string[];
  };
  scienceInsights: string[];
}

/**
 * Motor de Cálculo de Nutrición e Hidratación Personalizado
 */
export function calculateSportsNutrition(input: SportsNutritionInput): SportsNutritionPlan {
  const {
    weightKg,
    durationMin,
    sport,
    weather,
    foodStrategy,
    gutTrainingLevel,
    intensity = 'endurance_z2',
    useCaffeine = false,
  } = input;

  const hours = durationMin / 60;
  const isCycling = sport === 'cycling' || sport === 'mtb';

  // 1. CARBOHIDRATOS / HORA (Modelo Jeukendrup 2014 ajustado por intensidad y gut training)
  let carbsPerHour = 0;
  if (durationMin < 45) {
    carbsPerHour = 0; // No se requiere aporte exógeno para < 45 min
  } else if (durationMin <= 75) {
    carbsPerHour = intensity === 'race' ? 30 : 20;
  } else if (durationMin <= 135) {
    carbsPerHour = gutTrainingLevel === 'adapted' ? 65 : gutTrainingLevel === 'standard' ? 50 : 40;
  } else if (durationMin <= 210) {
    // 2h15 a 3h30
    carbsPerHour = gutTrainingLevel === 'adapted' ? 80 : gutTrainingLevel === 'standard' ? 65 : 55;
  } else {
    // > 3h30 Ultra / Gran Fondo
    carbsPerHour = gutTrainingLevel === 'adapted' ? 90 : gutTrainingLevel === 'standard' ? 75 : 60;
  }

  // 2. TASA DE SUDORACIÓN E HIDRATACIÓN (Modelo ACSM Sawka et al. escalado por masa corporal)
  // Un atleta de 99 kg disipa mucha más energía metabólica y transpira más volumen que uno de 65 kg
  const weatherCoeff = weather === 'very_hot' ? 1.45 : weather === 'hot' ? 1.25 : weather === 'cool' ? 0.75 : 1.0;
  const sportCoeff = isCycling ? 1.0 : 1.15; // En carrera a pie el coste calórico por kg/km es mayor y no hay refrigeración por viento relativo constante
  
  // Base en ml/kg/hora: ~8.5 ml/kg/h en condiciones moderadas
  const rawWaterPerHour = weightKg * 8.5 * weatherCoeff * sportCoeff;
  // Limitar a la capacidad de vaciamiento gástrico humano seguro (máximo ~1000 - 1100 ml/h para evitar plenitud gástrica)
  const waterMlPerHour = Math.min(1150, Math.max(450, Math.round(rawWaterPerHour / 25) * 25));

  // Tasa de sudoración estimada real (la pérdida total de fluidos puede ser mayor que lo tolerado para beber)
  const sweatRateEstimateLitersPerHour = Number(((weightKg * 0.012) * weatherCoeff * sportCoeff).toFixed(2));

  // 3. SODIO Y ELECTROLITOS (mg/hora)
  // Atletas con mayor masa corporal y sudoración abundante necesitan mayor reposición para evitar calambres e hiponatremia
  let sodiumMgPerHour = weather === 'very_hot' || weather === 'hot' ? 750 : weather === 'cool' ? 450 : 550;
  if (weightKg >= 90) {
    sodiumMgPerHour += 100; // Refuerzo para atletas de complexión potente
  }

  const totalCarbsGrams = Math.round(carbsPerHour * hours);
  const totalWaterMl = Math.round(waterMlPerHour * hours);
  const totalWaterLiters = Number((totalWaterMl / 1000).toFixed(1));
  const totalSodiumMg = Math.round(sodiumMgPerHour * hours);

  // 4. PLAN DE COMIDA & PACKLIST (QUÉ LLEVAR EN EL MAILLOT O MOCHILA)
  const pocketPackList: PocketPackItem[] = [];
  const timeline: PlannedTimelineItem[] = [];

  if (foodStrategy === 'real_food') {
    // Cálculo exclusivo con comida real: bocaditos de guayaba, sándwiches y fruta
    if (durationMin >= 60) {
      // Reparto: 50% bocaditos de guayaba (26g c/u), 50% sándwiches (18-28g c/u)
      const carbsFromGuayaba = Math.round(totalCarbsGrams * (isCycling ? 0.55 : 0.75));
      const carbsFromSandwich = totalCarbsGrams - carbsFromGuayaba;

      const guayabaCount = Math.max(1, Math.round(carbsFromGuayaba / ENDURANCE_FOOD_DB.bocadillo_guayaba.carbsGrams));
      const sandwichCount = Math.max(isCycling ? 1 : 0, Math.round(carbsFromSandwich / ENDURANCE_FOOD_DB.sandwich_pavo_jamon.carbsGrams));

      pocketPackList.push({
        foodName: 'Bocaditos de Guayaba (Pasta natural)',
        quantity: guayabaCount,
        unit: 'piezas (30-35g c/u)',
        totalCarbsGrams: guayabaCount * ENDURANCE_FOOD_DB.bocadillo_guayaba.carbsGrams,
        tip: 'Llevar desenvueltos a la mitad o en bolsita fácil de abrir con una mano en marcha.',
      });

      if (sandwichCount > 0) {
        pocketPackList.push({
          foodName: isCycling ? 'Medios Sándwiches de Pavo / Jamón (o Membrillo)' : 'Medio Sándwich de pan blanco suave',
          quantity: sandwichCount,
          unit: 'mitades cortadas',
          totalCarbsGrams: sandwichCount * ENDURANCE_FOOD_DB.sandwich_pavo_jamon.carbsGrams,
          tip: 'Aporta el sodio natural necesario (350mg/ud) y saciedad sin pesadez estomacal.',
        });
      }

      // Bidones de hidratación
      const bidonesCount = Math.ceil(totalWaterMl / 750);
      pocketPackList.push({
        foodName: 'Bidones de Agua / Bebida con Electrolitos',
        quantity: bidonesCount,
        unit: 'bidones de 750ml',
        totalCarbsGrams: 0,
        tip: 'Asegurar beber pequeños sorbos de 120-150ml cada 12-15 minutos.',
      });
    }
  } else if (foodStrategy === 'hybrid') {
    // Mixto: Bocaditos de guayaba + Bidón isotónico + 1 Sándwich
    const bidonesIsotonico = Math.max(1, Math.min(3, Math.floor(hours)));
    const carbsFromDrink = bidonesIsotonico * 35;
    const remainingCarbs = Math.max(0, totalCarbsGrams - carbsFromDrink);

    const guayabaCount = Math.max(1, Math.round((remainingCarbs * 0.6) / 26));
    const sandwichCount = Math.max(0, Math.round((remainingCarbs * 0.4) / 20));

    pocketPackList.push({
      foodName: 'Bocaditos de Guayaba',
      quantity: guayabaCount,
      unit: 'piezas',
      totalCarbsGrams: guayabaCount * 26,
      tip: 'Carbohidrato rápido de fácil masticación.',
    });

    if (sandwichCount > 0) {
      pocketPackList.push({
        foodName: 'Medio Sándwich salado',
        quantity: sandwichCount,
        unit: 'mitades',
        totalCarbsGrams: sandwichCount * 20,
        tip: 'Tomar hacia la mitad de la salida para asentar estómago.',
      });
    }

    pocketPackList.push({
      foodName: 'Bidón con Isotónico / Sales',
      quantity: bidonesIsotonico,
      unit: 'bidones 750ml',
      totalCarbsGrams: carbsFromDrink,
      tip: 'Aporta carbohidratos disueltos + reposición activa de sales.',
    });
  } else {
    // Suplementación clásica con geles
    const gelsCount = carbsPerHour > 0 ? Math.ceil(totalCarbsGrams / 30) : 0;
    pocketPackList.push({
      foodName: 'Geles Energéticos (30g HC)',
      quantity: gelsCount,
      unit: 'unidades',
      totalCarbsGrams: gelsCount * 30,
      tip: 'Acompañar siempre de 150ml de agua.',
    });
    pocketPackList.push({
      foodName: 'Cápsulas de Sales / Electrolitos',
      quantity: Math.ceil(totalSodiumMg / 300),
      unit: 'cápsulas',
      totalCarbsGrams: 0,
      tip: '1 cápsula cada 60-75 min.',
    });
  }

  // 5. TIMELINE / CRONOGRAMA MINUTO A MINUTO
  // Activación previa (15 min antes)
  timeline.push({
    min: -15,
    label: '15 min antes',
    foodName: foodStrategy === 'real_food' || foodStrategy === 'hybrid' ? '1/2 Bocadito de Guayaba o 1/2 Plátano' : '1/2 Gel o sorbo de isotónico',
    portion: '15g Carbohidratos',
    carbsGrams: 15,
    waterMl: 200,
    notes: 'Asegura glucemia estable antes del esfuerzo y arranca el vaciamiento gástrico sin generar pico de insulina reactivo.',
    category: 'pre',
  });

  if (durationMin >= 50) {
    const intervalMin = Math.round(60 / (carbsPerHour / (foodStrategy === 'real_food' ? 25 : 30)));
    let currentMin = Math.min(35, intervalMin);
    let stepCount = 1;

    while (currentMin < durationMin - 15) {
      let itemName = '';
      let portion = '';
      let itemCarbs = 25;
      let notes = '';

      if (foodStrategy === 'real_food') {
        // Alternar bocaditos de guayaba con medio sándwich
        if (stepCount % 2 === 0 && isCycling && durationMin >= 90) {
          itemName = '1/2 Sándwich de Jamón/Pavo o Membrillo';
          portion = '1 porción sólida';
          itemCarbs = 20;
          notes = 'Masticar despacio en tramo llano o descenso suave. Su aporte salado previene la hiponatremia y la pesadez.';
        } else {
          itemName = '1 Bocadito de Guayaba';
          portion = '1 pieza (30-35g)';
          itemCarbs = 26;
          notes = 'Rico en fructosa natural y glucosa (GLUT5 + SGLT1). Se traga fácil con 150-200ml de agua.';
        }
      } else if (foodStrategy === 'hybrid') {
        if (stepCount === 2 && isCycling) {
          itemName = '1/2 Sándwich salado + Sorbos de bidón';
          portion = '1 porción';
          itemCarbs = 30;
          notes = 'Aporte de carbohidrato masticable y sodio.';
        } else {
          itemName = '1 Bocadito de Guayaba + 3 sorbos de isotónico';
          portion = '1 pieza + 150ml';
          itemCarbs = 28;
          notes = 'Excelente vaciamiento gástrico.';
        }
      } else {
        const isCaffeine = useCaffeine && (stepCount === 2 || currentMin >= 80);
        itemName = `Gel Energético #${stepCount} ${isCaffeine ? '(con Cafeína)' : ''}`;
        portion = '1 gel (30g HC)';
        itemCarbs = 30;
        notes = 'Tomar con al menos 150ml de agua para diluir osmolaridad intestinal.';
      }

      timeline.push({
        min: currentMin,
        label: `Minuto ${currentMin}`,
        foodName: itemName,
        portion,
        carbsGrams: itemCarbs,
        waterMl: Math.round(waterMlPerHour * (intervalMin / 60)),
        notes,
        hasCaffeine: useCaffeine && itemName.includes('Cafeína'),
        category: 'intra',
      });

      currentMin += intervalMin;
      stepCount++;
    }
  }

  // 6. VENTANA METABÓLICA Y RECUPERACIÓN POST-ENTRENO (4:1 escalado para 99 kg)
  // Para 99 kg: 99g HC + ~30g Proteína
  const recoveryCarbs = Math.round(weightKg * 1.0);
  const recoveryProtein = Math.round(weightKg * 0.3);
  const recoveryFluids = Number((weightKg * 0.015).toFixed(1)); // ~1.5L para reponer balance hídrico

  timeline.push({
    min: durationMin,
    label: 'Llegada / Meta',
    foodName: 'Ventana de Recuperación Metabólica 4:1',
    portion: `${recoveryCarbs}g HC + ${recoveryProtein}g Proteína`,
    carbsGrams: recoveryCarbs,
    waterMl: 600,
    notes: `Crucial para un atleta de ${weightKg} kg: reponer reservas de glucógeno y detener el catabolismo muscular en los primeros 45 minutos.`,
    category: 'post',
  });

  // 7. INSIGHTS CIENTÍFICOS EXPLICATIVOS
  const scienceInsights: string[] = [
    `Atleta de ${weightKg} kg: Tu gasto calórico y tasa de sudoración (~${sweatRateEstimateLitersPerHour} L/h) son significativamente mayores que el promedio. Tu requerimiento hídrico objetivo es de ${waterMlPerHour} ml/h (${totalWaterLiters} L totales).`,
    `Bocaditos de Guayaba vs Geles: La guayaba contiene de forma natural una proporción 1:1 de glucosa y fructosa. Esto utiliza de forma simultánea los dos transportadores intestinales (SGLT1 y GLUT5), logrando una velocidad de absorción idéntica a los geles comerciales de última generación pero con pH menos agresivo y sin náuseas.`,
    isCycling 
      ? `Digestión en bicicleta: Al no existir impacto vertical biomecánico, el ciclismo permite tolerar comida real sólida (sándwich de pavo/membrillo) entre los km 25 y 75 con alta asimilación y mayor saciedad.`
      : `Digestión en carrera a pie: El rebote del running aconseja alimentos semiblandos como el bocadito de guayaba o fruta disuelta en boca, evitando migas secas de pan.`,
    `Reposición de Sodio: Con ${totalSodiumMg} mg de sodio objetivo, consumir un sándwich de jamón o pavo te ahorra tener que depender de pastillas de sales artificiales.`,
  ];

  return {
    weightKg,
    durationMin,
    sport,
    carbsPerHour,
    totalCarbsGrams,
    waterMlPerHour,
    totalWaterLiters,
    sodiumMgPerHour,
    totalSodiumMg,
    sweatRateEstimateLitersPerHour,
    pocketPackList,
    timeline,
    recoveryProtocol: {
      carbsGrams: recoveryCarbs,
      proteinGrams: recoveryProtein,
      fluidsLiters: recoveryFluids,
      recommendedFoods: [
        'Batido de leche / yogur con plátano y miel o cacao',
        'Tostada de pan con jamón serrano / pavo y aceite de oliva',
        'Arroz blanco con huevos o atún + 500ml de agua fresca',
      ],
    },
    scienceInsights,
  };
}
