# Urban Climate Resilience Indicators

## Overview
Indicators represent interpretable measures derived from multi-source urban data (images, sensors, and citizen reports).  
They are used to assess climate-related risks such as heat, flood, and noise.

---

## Data Flow
Raw Data → Features → Indicators → Risk Scores
---

## Core Indicators (MVP)

### 1. Green Coverage
- **Source**: Street images  
- **Feature**: vegetation_ratio  
- **Definition**: vegetation_pixels / total_pixels
- **Meaning**:
Higher = cooler, more resilient environment

---

### 2. Temperature
- **Source**: Sensors  
- **Feature**: temperature  
- **Definition**: average temperature over time
- **Meaning**:
Higher = higher heat risk

---

### 3. Impervious Surface
- **Source**: Street images  
- **Feature**: pavement_ratio  
- **Definition**: pavement_pixels / total_pixels
- **Meaning**:
Higher = higher flood risk

---

### 4. Noise Level
- **Source**: Sensors / user reports  
- **Feature**: decibel  
- **Definition**: average noise level

- **Meaning**:
Higher = more urban stress

---

## Notes
- Indicators can be computed at different levels (point, street, district)
- This list will be extended as the platform evolves
