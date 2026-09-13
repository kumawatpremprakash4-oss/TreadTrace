# TreadTrace Telemetry Data Dictionary

| Field Name | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `lap_number` | Integer | - | Global lap sequence within the active session. | `14` |
| `stint_id` | Integer | - | Stint identifier indexing pit in/out cycles. | `2` |
| `stint_lap` | Integer | - | Relative lap count within the current tyre stint. | `6` |
| `tyre_id` | String | - | Unique physical barcode / digital twin ID for tyre allocation. | `SET-M01-FP2` |
| `compound` | String | - | Rubber compound grade: `SOFT` (C4), `MEDIUM` (C3), `HARD` (C2). | `MEDIUM` |
| `tyre_age` | Integer | Laps | Cumulative active laps on tyre set across sessions. | `8` |
| `lap_time` | Float | Seconds | Official observed lap duration across timing transponders. | `88.420` |
| `sector_1` | Float | Seconds | Sector 1 split duration. | `27.852` |
| `sector_2` | Float | Seconds | Sector 2 split duration. | `34.925` |
| `sector_3` | Float | Seconds | Sector 3 split duration. | `25.643` |
| `fuel_load` | Float | kg | Estimated fuel mass remaining in fuel cell. | `52.4` |
| `track_temperature` | Float | °C | Tarmac surface temperature measured by infrared sensor. | `38.2` |
| `air_temperature` | Float | °C | Ambient atmospheric temperature. | `23.5` |
| `traffic_level` | Integer | [0..3] | Traffic wake intensity: 0=clean air, 1=mild, 2=dirty air, 3=heavy. | `0` |
| `clean_air` | Boolean | - | True if vehicle gap to car ahead exceeds 2.5 seconds. | `true` |
| `yellow_flag` | Boolean | - | Active caution flag neutralising mini-sectors. | `false` |
| `classification` | String | - | Automated data quality label: `VALID`, `TRAFFIC`, `PIT_IN`, `PIT_OUT`, `YELLOW_FLAG`, `OUTLIER`. | `VALID` |
| `used_in_model` | Boolean | - | Gate flag determining inclusion in degradation fitting. | `true` |
| `base_performance` | Float | Seconds | Vehicle baseline pace on clean track with zero fuel mass. | `87.850` |
| `estimated_tyre_deg` | Float | Seconds | Confounder-isolated mechanical & thermal tyre performance loss. | `+0.246` |
| `estimated_fuel_effect` | Float | Seconds | Mass penalty derived from fuel sensitivity ($\sim 0.033$ s/kg). | `+1.729` |
| `estimated_track_evo` | Float | Seconds | Grip gain derived from session tarmac rubber accumulation. | `-0.280` |
| `residual_noise` | Float | Seconds | Residual driver variance and stochastic micro-sector noise. | `+0.015` |
