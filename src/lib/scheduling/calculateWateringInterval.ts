import type { PlantLocation, PotSize } from "@prisma/client";

export type PlantAgeCategory = "seedling" | "young" | "mature" | "established";
export type Season = "summer" | "winter" | "spring_fall";

interface WateringInput {
  baseCycleDays:  number;
  plantedAt:      Date;
  currentTempC:   number;
  potSize:        PotSize | null;
  location:       PlantLocation;
  season:         Season;
}

export interface WateringResult {
  adjustedDays:     number;
  nextDueAt:        Date;
  ageCategory:      PlantAgeCategory;
  appliedModifiers: {
    base:        number;
    age:         number;
    temperature: number;
    pot:         number;
    location:    number;
    final:       number;
  };
}

function getAgeModifier(plantedAt: Date): { modifier: number; category: PlantAgeCategory } {
  const days = Math.floor((Date.now() - plantedAt.getTime()) / 86_400_000);
  if (days < 90)   return { modifier: 0.60, category: "seedling" };
  if (days < 365)  return { modifier: 0.80, category: "young" };
  if (days < 1095) return { modifier: 1.00, category: "mature" };
  return              { modifier: 1.20, category: "established" };
}

function getTempModifier(tempC: number): number {
  if (tempC >= 45) return 0.50;
  if (tempC >= 40) return 0.60;
  if (tempC >= 35) return 0.75;
  if (tempC >= 25) return 1.00;
  if (tempC >= 15) return 1.30;
  return 1.60;
}

function getPotModifier(potSize: PotSize | null): number {
  if (potSize === null)     return 1.20;
  if (potSize === "SMALL")  return 0.70;
  if (potSize === "MEDIUM") return 0.90;
  if (potSize === "LARGE")  return 1.00;
  return 1.10; // XLARGE
}

function getLocationModifier(location: PlantLocation): number {
  if (location === "INDOOR")     return 1.50;
  if (location === "GREENHOUSE") return 1.20;
  if (location === "BALCONY")    return 0.90;
  return 1.00; // OUTDOOR
}

export function calculateWateringInterval(input: WateringInput): WateringResult {
  const { modifier: ageMod, category } = getAgeModifier(input.plantedAt);
  const tempMod     = getTempModifier(input.currentTempC);
  const potMod      = getPotModifier(input.potSize);
  const locationMod = getLocationModifier(input.location);

  const raw          = input.baseCycleDays * ageMod * tempMod * potMod * locationMod;
  const adjustedDays = Math.max(1, Math.round(raw * 2) / 2);
  const nextDueAt    = new Date(Date.now() + adjustedDays * 86_400_000);

  return {
    adjustedDays,
    nextDueAt,
    ageCategory: category,
    appliedModifiers: {
      base:        input.baseCycleDays,
      age:         ageMod,
      temperature: tempMod,
      pot:         potMod,
      location:    locationMod,
      final:       adjustedDays,
    },
  };
}
