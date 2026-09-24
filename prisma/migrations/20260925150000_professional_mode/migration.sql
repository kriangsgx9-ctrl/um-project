-- V2 §9 Professional Mode toggle — a personal display preference.
ALTER TABLE "User" ADD COLUMN "professionalMode" BOOLEAN NOT NULL DEFAULT false;
