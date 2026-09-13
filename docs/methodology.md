# TreadTrace Methodology: Decoupling Tyre Wear from Practice Confounders

## The Core Motorsport Challenge

A common mistake in race engineering is assuming:
$$\text{Observed Lap Slower} \implies \text{Tyre Degraded}$$

In reality, lap times are confounded by simultaneous, countervailing variables:
1. **Fuel Burn-off**: Cars consume ~1.62 kg/lap, making the car ~0.053 s/lap faster. This artificially masks tyre degradation in raw lap telemetry.
2. **Track Evolution (Rubbering-in)**: As hundreds of racing laps are completed, rubber is embedded into the tarmac micro-texture, generating up to -0.65s of free grip gain.
3. **Dirty Air & Traffic**: Running within 2.0s of another car produces aerodynamic downforce loss, adding +0.3s to +1.8s in turbulent wake penalties.
4. **Thermal Windows**: Tyres have narrow peak friction windows (e.g. 35°C for Soft, 38°C for Medium, 42°C for Hard). Deviation triggers surface graining or thermal blistering.
5. **Session Flags & Outliers**: In-laps (cooling pace), out-laps (speed limiter), and yellow flags distort regression models if unclassified.

## TreadTrace Mathematical Formulation

TreadTrace decomposes observed lap time $t_{\text{obs}}(i)$ on lap $i$:

$$t_{\text{obs}}(i) = T_0(\text{compound}) + \Delta t_{\text{tyre}}(i) + \Delta t_{\text{fuel}}(i) + \Delta t_{\text{evo}}(i) + \Delta t_{\text{traffic}}(i) + \Delta t_{\text{temp}}(i) + \epsilon(i)$$

Where:
- $\Delta t_{\text{fuel}}(i) = \beta_{\text{fuel}} \cdot (M_{\text{fuel}}(i) - M_{\text{ref}})$
- $\Delta t_{\text{evo}}(i) = -\Delta t_{\text{max\_evo}} \cdot (1 - e^{-\gamma \cdot i})$
- $\Delta t_{\text{tyre}}(i) = \alpha_{\text{linear}} \cdot \text{age} + \alpha_{\text{quad}} \cdot \max(0, \text{age} - \text{cliff})^2$

Normalised lap time is computed by subtracting the non-tyre confounders:
$$t_{\text{norm}}(i) = t_{\text{obs}}(i) - \left[\Delta t_{\text{fuel}}(i) + \Delta t_{\text{evo}}(i) + \Delta t_{\text{traffic}}(i) + \Delta t_{\text{temp}}(i)\right]$$

The true tyre degradation curve is then fitted exclusively on $t_{\text{norm}}(i)$ with Huber robust loss, revealing the genuine degradation rate and 95% confidence intervals.
