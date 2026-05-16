-- CreateEnum
CREATE TYPE "Climate" AS ENUM ('HOT_ARID', 'MEDITERRANEAN', 'TROPICAL', 'TEMPERATE');

-- CreateEnum
CREATE TYPE "PlantCategory" AS ENUM ('FRUIT_TREE', 'VEGETABLE', 'HERB', 'ORNAMENTAL', 'INDOOR', 'SUCCULENT');

-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE');

-- CreateEnum
CREATE TYPE "PlantLocation" AS ENUM ('INDOOR', 'OUTDOOR', 'BALCONY', 'GREENHOUSE');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CLAY', 'SANDY', 'LOAMY', 'MIXED', 'PEAT', 'COCO_COIR');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'STRESSED', 'DISEASED', 'RECOVERING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PhotoPurpose" AS ENUM ('PROFILE', 'DIAGNOSIS', 'PROGRESS');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WATERING', 'FERTILIZING_NPK', 'FERTILIZING_MICRO', 'CALCIUM_TREATMENT', 'FUNGICIDE', 'INSECTICIDE', 'PRUNING', 'INSPECTION', 'REPOTTING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WATERING_DUE', 'WATERING_OVERDUE', 'FERTILIZING_DUE', 'TREATMENT_DUE', 'HEAT_WAVE_WARNING', 'FROST_WARNING', 'CALCIUM_REMINDER', 'HEALTH_CHECK_DUE', 'SCHEDULE_ADJUSTED', 'DIAGNOSIS_READY', 'DIAGNOSIS_NEEDS_CONFIRMATION');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DiagnosisCategory" AS ENUM ('FUNGAL_DISEASE', 'BACTERIAL_DISEASE', 'SPIDER_MITE', 'SCALE_INSECT', 'MEALYBUG', 'SALT_BURN', 'ROOT_ROT', 'NUTRIENT_DEF_NITROGEN', 'NUTRIENT_DEF_IRON', 'NUTRIENT_DEF_CALCIUM', 'HEAT_STRESS', 'OVERWATERING', 'UNDERWATERING', 'PRUNING_RECOVERY');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PauseReason" AS ENUM ('DISEASE_ACTIVE', 'HEAT_WAVE', 'POST_PRUNING', 'SALT_FLUSH', 'USER_MANUAL', 'DORMANCY');

-- CreateEnum
CREATE TYPE "FertilizerType" AS ENUM ('NPK_BALANCED', 'NPK_HIGH_N', 'NPK_HIGH_P', 'NPK_HIGH_K', 'CALCIUM_BORON', 'IRON_CHELATE', 'MAGNESIUM_SULFATE', 'HUMIC_ACID', 'FUNGICIDE_COPPER', 'FUNGICIDE_SULFUR', 'INSECTICIDE_BIO', 'INSECTICIDE_CHEM', 'SOIL_AMENDMENT', 'GROWTH_HORMONE');

-- CreateEnum
CREATE TYPE "ApplicationMethod" AS ENUM ('FOLIAR_SPRAY', 'SOIL_DRENCH', 'GRANULAR_TOPSOIL', 'INJECTION', 'DRIP');

-- CreateEnum
CREATE TYPE "Formulation" AS ENUM ('LIQUID', 'GRANULAR', 'POWDER', 'PASTE');

-- CreateEnum
CREATE TYPE "SaltIndex" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'PARTLY_CLOUDY', 'CLOUDY', 'RAIN', 'THUNDERSTORM', 'SANDSTORM', 'FOG', 'SNOW');

-- CreateEnum
CREATE TYPE "WeatherEvent" AS ENUM ('HEAT_WAVE', 'EXTREME_HEAT', 'FROST', 'RAIN_TODAY', 'RAIN_TOMORROW', 'HIGH_HUMIDITY', 'HIGH_WIND', 'SANDSTORM', 'TEMPERATURE_DROP');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OverrideAction" AS ENUM ('PAUSE', 'SKIP_NEXT', 'MODIFY_WATERING', 'TRIGGER_NOW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'ANALYZING', 'AWAITING_CONFIRMATION', 'NEEDS_BETTER_PHOTO', 'CONFIRMED', 'APPLIED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PhotoAngle" AS ENUM ('FULL_PLANT', 'AFFECTED_LEAF', 'LEAF_UNDERSIDE', 'STEM', 'ROOT', 'SOIL_SURFACE');

-- CreateEnum
CREATE TYPE "ImageQualityIssue" AS ENUM ('BLURRY', 'TOO_DARK', 'TOO_BRIGHT', 'TOO_FAR', 'PARTIAL_VIEW');

-- CreateEnum
CREATE TYPE "PlantPart" AS ENUM ('LEAVES', 'LEAF_UNDERSIDE', 'STEM', 'ROOTS', 'FLOWERS', 'FRUIT', 'SOIL', 'BARK');

-- CreateEnum
CREATE TYPE "ConfirmationDecision" AS ENUM ('ACCEPTED', 'ACCEPTED_MODIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Sensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garden" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "climate" "Climate" NOT NULL DEFAULT 'HOT_ARID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantCatalog" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameLatin" TEXT,
    "category" "PlantCategory" NOT NULL,
    "lightMin" INTEGER NOT NULL,
    "lightMax" INTEGER NOT NULL,
    "lightDescription" TEXT,
    "soilPH_min" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "soilPH_max" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
    "drainageRequired" BOOLEAN NOT NULL DEFAULT true,
    "saltSensitivity" "Sensitivity" NOT NULL DEFAULT 'MEDIUM',
    "wateringCycleSummer" INTEGER NOT NULL,
    "wateringCycleWinter" INTEGER NOT NULL,

    CONSTRAINT "PlantCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "nickname" TEXT,
    "plantedAt" TIMESTAMP(3) NOT NULL,
    "potSize" "PotSize",
    "location" "PlantLocation" NOT NULL,
    "soilType" "SoilType" NOT NULL DEFAULT 'MIXED',
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "lastInspection" TIMESTAMP(3),
    "notes" TEXT,
    "gardenId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "purpose" "PhotoPurpose" NOT NULL,
    "aiAnalysis" TEXT,
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "baseIntervalDays" INTEGER NOT NULL,
    "adjustedIntervalDays" INTEGER NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTempUsed" DOUBLE PRECISION,
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEntry" (
    "id" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "skipReason" TEXT,
    "notes" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "scheduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "readAt" TIMESTAMP(3),
    "actionTakenAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "scheduleId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthLog" (
    "id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "diagnosisCategory" "DiagnosisCategory",
    "treatment" TEXT,
    "severity" "Severity" NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "scheduleRulesApplied" BOOLEAN NOT NULL DEFAULT false,
    "plantId" TEXT NOT NULL,
    "diagnosisSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePause" (
    "id" TEXT NOT NULL,
    "reason" "PauseReason" NOT NULL,
    "reasonDetail" TEXT NOT NULL,
    "pausedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumeAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "resumeDosageMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scheduleId" TEXT NOT NULL,
    "healthLogId" TEXT NOT NULL,

    CONSTRAINT "SchedulePause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerCatalog" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "brand" TEXT,
    "type" "FertilizerType" NOT NULL,
    "formulation" "Formulation" NOT NULL,
    "nitrogenN" DOUBLE PRECISION,
    "phosphorusP" DOUBLE PRECISION,
    "potassiumK" DOUBLE PRECISION,
    "microNutrients" JSONB,
    "applicationMethod" "ApplicationMethod" NOT NULL,
    "heatMaxC" DOUBLE PRECISION,
    "minIntervalDays" INTEGER NOT NULL,
    "saltIndex" "SaltIndex" NOT NULL,
    "dilutionMlPerLiter" DOUBLE PRECISION,
    "gramsPerSqMeter" DOUBLE PRECISION,
    "incompatibleTypes" "FertilizerType"[],
    "contraindicatedFor" "DiagnosisCategory"[],

    CONSTRAINT "FertilizerCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerAssignment" (
    "id" TEXT NOT NULL,
    "dosageMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "notes" TEXT,
    "scheduleId" TEXT NOT NULL,
    "fertilizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenWeatherConfig" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "cityName" TEXT,
    "heatWaveThresholdC" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "frostThresholdC" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "heavyRainThresholdMm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "highHumidityThreshold" INTEGER NOT NULL DEFAULT 80,
    "highWindThresholdKmh" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "lastFetchedAt" TIMESTAMP(3),
    "gardenId" TEXT NOT NULL,

    CONSTRAINT "GardenWeatherConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "maxTempC" DOUBLE PRECISION NOT NULL,
    "minTempC" DOUBLE PRECISION NOT NULL,
    "avgHumidity" INTEGER NOT NULL,
    "precipitationMm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "windSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condition" "WeatherCondition" NOT NULL,
    "detectedEvents" "WeatherEvent"[],
    "weatherConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherAlert" (
    "id" TEXT NOT NULL,
    "event" "WeatherEvent" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "weatherConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherScheduleOverride" (
    "id" TEXT NOT NULL,
    "action" "OverrideAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL,
    "activeUntil" TIMESTAMP(3) NOT NULL,
    "wateringFrequencyMultiplier" DOUBLE PRECISION,
    "scheduleId" TEXT NOT NULL,
    "weatherAlertId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisSession" (
    "id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "contextSnapshot" JSONB NOT NULL,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "additionalPhotoRequested" BOOLEAN NOT NULL DEFAULT false,
    "additionalPhotoGuidance" TEXT,
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "angle" "PhotoAngle" NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "qualityIssues" "ImageQualityIssue"[],
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysisResult" (
    "id" TEXT NOT NULL,
    "primaryCategory" "DiagnosisCategory" NOT NULL,
    "primaryNameAr" TEXT NOT NULL,
    "primaryNameEn" TEXT NOT NULL,
    "primaryConfidence" DOUBLE PRECISION NOT NULL,
    "primarySeverity" "Severity" NOT NULL,
    "alternativeDiagnoses" JSONB NOT NULL DEFAULT '[]',
    "affectedParts" "PlantPart"[],
    "recommendedActions" TEXT[],
    "fertilizersToAvoid" "FertilizerType"[],
    "fertilizersToUse" "FertilizerType"[],
    "followUpDays" INTEGER,
    "followUpReason" TEXT,
    "rawApiResponse" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "processingMs" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisConfirmation" (
    "id" TEXT NOT NULL,
    "decision" "ConfirmationDecision" NOT NULL,
    "userNote" TEXT,
    "overrideCategory" "DiagnosisCategory",
    "overrideNote" TEXT,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HealthLog_diagnosisSessionId_key" ON "HealthLog"("diagnosisSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizerAssignment_scheduleId_key" ON "FertilizerAssignment"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenWeatherConfig_gardenId_key" ON "GardenWeatherConfig"("gardenId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherSnapshot_weatherConfigId_forecastDate_key" ON "WeatherSnapshot"("weatherConfigId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysisResult_sessionId_key" ON "AIAnalysisResult"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisConfirmation_sessionId_key" ON "DiagnosisConfirmation"("sessionId");

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "PlantCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantPhoto" ADD CONSTRAINT "PlantPhoto_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLog" ADD CONSTRAINT "HealthLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthLog" ADD CONSTRAINT "HealthLog_diagnosisSessionId_fkey" FOREIGN KEY ("diagnosisSessionId") REFERENCES "DiagnosisSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePause" ADD CONSTRAINT "SchedulePause_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePause" ADD CONSTRAINT "SchedulePause_healthLogId_fkey" FOREIGN KEY ("healthLogId") REFERENCES "HealthLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerAssignment" ADD CONSTRAINT "FertilizerAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerAssignment" ADD CONSTRAINT "FertilizerAssignment_fertilizerId_fkey" FOREIGN KEY ("fertilizerId") REFERENCES "FertilizerCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenWeatherConfig" ADD CONSTRAINT "GardenWeatherConfig_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_weatherConfigId_fkey" FOREIGN KEY ("weatherConfigId") REFERENCES "GardenWeatherConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherAlert" ADD CONSTRAINT "WeatherAlert_weatherConfigId_fkey" FOREIGN KEY ("weatherConfigId") REFERENCES "GardenWeatherConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherScheduleOverride" ADD CONSTRAINT "WeatherScheduleOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherScheduleOverride" ADD CONSTRAINT "WeatherScheduleOverride_weatherAlertId_fkey" FOREIGN KEY ("weatherAlertId") REFERENCES "WeatherAlert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSession" ADD CONSTRAINT "DiagnosisSession_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisImage" ADD CONSTRAINT "DiagnosisImage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisResult" ADD CONSTRAINT "AIAnalysisResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisConfirmation" ADD CONSTRAINT "DiagnosisConfirmation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
