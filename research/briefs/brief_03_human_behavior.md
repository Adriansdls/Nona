---
title: Untitled
tags:
- lost-dog-behavioral
- dog-movement-algarve
- lost-dog
- search-strategy
- lost-dog-search-ops
created: '2026-05-28T09:28:53.260578Z'
updated: '2026-05-28T09:28:54.360445Z'
status: review
type: note
deprecated: false
summary: 'Project: Nona / Red Cão Algarve — Lost dog rescue operating system'
---

# Research Brief 03 — Human Behavior Modeling

**For:** Researcher  
**Project:** Nona / Red Cão Algarve — Lost dog rescue operating system  
**Topic:** How humans interact with lost dogs — pickup, reporting, silence, and social dynamics  
**Priority:** High — most undermodeled factor, potentially biggest impact on recovery

---

## Context

We are building a rescue platform for lost dogs in the Algarve, Portugal. Our system currently models **the dog**: where it might go, how it behaves. But a significant fraction of lost dog cases are not resolved by finding the dog through animal behavior — they are resolved (or permanently failed) by **human behavior**.

The Algarve has an unusual human landscape: large British/northern European expat community, heavy summer tourism, local Portuguese rural population, agricultural workers (many from eastern Europe), hunters, and quintas (private estates). These populations behave very differently when they encounter a stray dog.

A dog can be sitting in someone's quinta 3km away, totally safe and well-fed, while its owner is posting on Facebook. If the quinta owner doesn't see the post, doesn't use Facebook, or doesn't know there's a reporting system — the dog is invisible. This is a **reporting probability problem**, not a search problem.

---

## What we need researched

### 1. Who picks up lost dogs, and what do they do with them?

**Find:**
- Any studies or surveys on the behavior of people who encounter a stray dog: what percentage take it in? Take it to a vet? Take it to a shelter? Leave it? Call a number?
- How does the dog's appearance (size, breed, condition, collar/no collar) affect pickup behavior?
- How does the person's profile affect pickup behavior? (tourist, local, animal lover, rural farmer)
- What is the typical time delay between finding a dog and taking action (reporting, vet visit)?
- Do people who pick up dogs typically search for owners online? What channels do they use?
- In southern Europe/Portugal specifically: any cultural data on attitudes toward stray animals vs owned pets

### 2. Reporting behavior by population type — the Algarve context

This is very specific to our geography. We need to understand which zones are "reporting deserts" where dogs disappear into silence.

**Find:**
- How does digital literacy and social media usage differ by age, nationality, and urbanization in the Algarve?
- Which specific channels do different populations use to report or search for lost pets?
  - Local Portuguese: Facebook groups (which ones?), Olx, neighborhood apps
  - British expats: Facebook expat groups (Algarve Lost & Found, etc.), NextDoor-style apps
  - Tourists: Google, local Facebook groups they probably aren't in
  - Rural agricultural workers (often from eastern Europe): likely very different channels
  - Hunters/rural landowners: almost certainly offline
- Are there known "information black holes" — zones or population types where a found dog would simply not be reported through any digital channel?
- Is there any data on response rates to lost pet posters (physical) vs social posts?

### 3. Vet and shelter reporting pipeline — reliability and latency

Vets and municipal shelters (canils) are the main institutional nodes. How reliable are they as reporting channels?

**Find:**
- What fraction of found dogs (with chip or obvious ownership) are brought to vets in Portugal?
- How quickly do vets typically scan chips? Is chip scanning universal practice in Portuguese vet clinics?
- How reliable are canils at cross-referencing incoming dogs with reported lost pets? (specifically: Canil Municipal de Lagos, Portimão, Loulé, Faro — the main Algarve canils)
- Do private vet clinics actively post found dogs to social channels, or only if contacted?
- Lord 2007 (JAVMA) found that physical visits to shelters had 2.1× higher recovery than phone calls — is this replicated in Portuguese context? Any data on PT shelter processes?

### 4. Social diffusion — how far does a lost dog post actually travel?

When we post to a Facebook group or WhatsApp chain, how many real pairs of eyes see it and in what geographic area?

**Find:**
- What are the main Facebook groups used for lost pets in the Algarve, and what are their membership sizes and geographic coverage?
  - Specifically: groups covering Lagos, Portimão, Lagoa, Albufeira, Loulé, Tavira, Vila Real
- What is the typical reach of a lost pet post (shares, views) in these groups?
- How quickly does engagement decay after posting (half-life of a Facebook post in these groups)?
- Are there WhatsApp chains or Telegram groups used by local animal rescuers? Who administers them?
- Is there a meaningful network of volunteer rescuers in the Algarve who act as signal amplifiers?
- Do posts in expat groups reach local Portuguese population and vice versa? Or are these parallel, non-overlapping networks?

### 5. Human transport patterns specific to Algarve

This is about modeling how far a dog could realistically travel via vehicle, given the human geography.

**Find:**
- Major human movement corridors in the Algarve (N125 is the main artery — where does traffic flow from/to?)
- Typical tourist movement patterns: arriving at Faro airport, moving to specific resort towns, day trips
- Agricultural worker commute patterns (many live in inland towns, work coastal quintas)
- Where do people stop with a found dog? (vet, shelter, home?) — and where are those destinations from the main road corridors?
- Is there a meaningful pattern of dogs being transported from Algarve to Lisbon or Spain?

---

## Output format requested

For each sub-topic:

1. **Key behavioral patterns** — what the evidence shows about how humans behave
2. **Algarve-specific factors** — local demographics, cultural patterns, known community groups
3. **Probability implications** — how to translate this into probability adjustments for our model ("dogs lost near tourist zones on N125 in July → add 'found by tourist, not reported' scenario at X%")
4. **Intervention design** — what specific outreach strategies this implies (which channels, in which language, targeted to which population)

Key sources to check: Any Portuguese lost pet community research, Algarve demographic data (INE), Lord 2007 JAVMA, general social diffusion literature on Facebook groups, local Algarve Facebook groups (observable directly — membership counts, activity), academic literature on human-animal interaction and stray animal reporting behavior.

---

## What we will do with this

We will use this to:
- Build a "reporting probability surface" overlay — a map that shows which zones have low probability of a found dog being reported (even if the dog is alive and physically present)
- Tune our outreach strategy by case location (tourist zone → post in English-language expat groups; rural inland → contact agricultural associations; near N125 → vet alert radius 50km not 20km)
- Add an "invisible zone" scenario to our probability engine: "X% probability dog was picked up but finder won't report via known channels → specific actions to reach them"
- Build our channel registry (which Facebook groups, Telegram chains, WhatsApp groups to target for each municipality)
