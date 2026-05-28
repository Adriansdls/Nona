---
title: Untitled
tags:
- lost-dog-behavioral
- lost-dog
- terrain
- dog-movement-algarve
- lost-dog-search-ops
created: '2026-05-28T09:28:53.380912Z'
updated: '2026-05-28T09:28:54.458782Z'
status: review
type: note
deprecated: false
summary: Nona requires a four-axis behavioral engine with decoupled spatial belief
  update and action gate; the core finding is...
---

# Synthesis outline — lost-dog-behavioral

## Executive summary
Nona requires a four-axis behavioral engine with decoupled spatial belief update and action gate; the core finding is that breed governs the action gate at full weight even as it contributes ≤10% to the probability score, because the error asymmetry (false-gregarious causes fatal displacement; false-xenophobic only wastes effort) demands a safety-conservative default. Phase boundaries are practitioner-validated (0-72h/72h-7d/7d+) with physiological support but no peer-reviewed dog study; galgo and podenco require breed-specific phase collapse and independent spatial priors.

## 1. Temporal Behavioral Phases — Empirical Data
Establishes the three-phase model (panic/survival/recovery) anchored to Hennessy cortisol arc and Kremer's 5-day urgency cliff, with the critical caveat that Phase 1 duration is breed/trigger-modulated rather than universal; provides encodable phase boundaries with confidence ranges and names the knowledge gap (no peer-reviewed dog phase-transition study exists).

## 2. Breed-Specific Behavioral Priors
Delivers the dual-prior architecture for galgo (greyhound chase OR=8.34 for spatial; galgo-specific for capture-avoidance) and the triple-sensory expanding-ellipse model for podenco; resolves the Morrill 2022 vs. Normando 2024 tension by encoding breed as ≤10% probability-score weight + 100% action-gate weight; includes per-category calibration table (6 breed types × movement radius × approach tendency × terrain × capture method).

## 3. Bayesian Updating from Sightings
Formalizes the Lin & Goodrich 2010 WiSAR posterior update framework for Nona's context; provides the λ reliability scale (0.95 camera / 0.70 clear-eyewitness / 0.35 uncertain / 0.20 crowd-degraded); argues for mandatory architectural separation of belief update (always-on) from action gate (temperament-conditional); names the crowd-displacement prohibition for fearful dogs as the most empirically robust finding in the entire corpus (convergent from two frameworks + two fatal case studies + adversarial search for counterexamples returned zero).

## 4. Fear Escalation Dynamics
Maps the monotonic fear escalation state machine (three triggers: xenophobic-baseline / loud-noise-flight / prior-conditioning); resolves the Lord-2007-vs-MAR tension via temperament-gating; provides the 3×2 decision matrix (temperament × phase → search_intensity + sighting_broadcast_permission); closes with the product-level reframe: Nona's primary output is preventing the escalation that converts recoverable dogs into permanently lost dogs.
