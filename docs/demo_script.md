# TreadTrace 2-Minute Competition Demo Script

### Audience: Hackathon Judges & Motorsport Reviewers
**Goal**: Explain the problem, show the mathematical innovation, and prove the closed-loop learning in under 2 minutes.

---

### Step 1: The Core Thesis (0:00 - 0:25)
- Open the **Command Center**.
- State the problem:
  > *"In motorsport, race engineers often look at practice lap times and assume: if the lap is slower, the tyre is worn. But that's a dangerous mistake. Fuel burns off (-0.033s/kg), making the car faster. The track rubbers in (-0.55s). Traffic slows the car down (+0.8s). A naive graph shows lap times looking flat, misleading the team into thinking tyres don't degrade."*
- Click **"Launch 2-Min Judge Tour"** in the hero banner.

---

### Step 2: Data Quality & Confounder Detection (0:25 - 0:50)
- Navigate to **Session Analyzer**:
  > *"TreadTrace automatically classifies every lap. Notice in-laps, out-laps, and traffic dirty air are flagged and isolated before any model fitting."*
- Navigate to **Confounder Engine**:
  > *"Here is the decomposition in action. On Lap 14, the car was 0.31s slower on tyre wear, but fuel burn-off deducted 0.18s. TreadTrace exposes the real physical components."*

---

### Step 3: Flagship Degradation Lab & Tyre Memory (0:50 - 1:20)
- Navigate to **Degradation Lab**:
  > *"Click 'Raw Lap Times' vs 'Clean Signal Only'. Watch the noisy, misleading scatter plot transform into a clean, smooth degradation curve with 95% confidence intervals and an accurate cliff onset at Lap 26."*
  > *"TreadTrace achieves a 91% error reduction compared to naive regression."*
- Navigate to **Tyre Memory (Digital Twin)**:
  > *"Each tyre allocation has a persistent digital twin storing heat cycles, accumulated age, and remaining useful life."*

---

### Step 4: Stint Simulation & Post-Race Validation (1:20 - 2:00)
- Navigate to **Prediction Engine**:
  > *"Before Sunday's race, we simulate a 24-lap stint. Notice the compound crossover matrix showing the exact lap where Medium tyres become faster than degrading Soft tyres."*
- Navigate to **Race Validation**:
  > *"Sunday GP arrives. We compare our practice prediction against actual race pace. The model is within 0.05s MAE. More importantly, TreadTrace explains WHY pace diverged: race day track temp was +4.3°C hotter."*
- Click **"Apply Race Calibration to Tyre Twin"**:
  > *"The closed loop is complete. The race day truth recalibrates the tyre memory for the next race."*
