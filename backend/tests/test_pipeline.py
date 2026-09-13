"""
TreadTrace Test Suite.
Verifies data generation, schema integrity, lap classification, confounder isolation,
degradation curve generation, digital twin memory, stint prediction, and post-race validation.
"""

import unittest
from app.synthetic.generator import generate_practice_session, generate_race_session, COMPOUND_SPECS
from app.preprocessing.classifier import classify_session_laps
from app.ml.confounder import ConfounderEngine
from app.ml.degradation import DegradationModel
from app.models.tyre_memory import TyreDigitalTwin, tyre_memory_registry
from app.ml.prediction import PredictionEngine
from app.validation.validator import PostRaceValidator


class TestTreadTracePipeline(unittest.TestCase):

    def setUp(self):
        self.practice_data = generate_practice_session(seed=42)
        self.race_data = generate_race_session(seed=101)
        self.confounder_engine = ConfounderEngine()
        self.degradation_model = DegradationModel()
        self.prediction_engine = PredictionEngine()
        self.validator = PostRaceValidator()

    def test_synthetic_data_schema(self):
        """Validates that practice and race datasets meet motorsport schema standards."""
        self.assertIn("laps", self.practice_data)
        self.assertGreater(len(self.practice_data["laps"]), 30)
        first_lap = self.practice_data["laps"][0]
        self.assertIn("lap_number", first_lap)
        self.assertIn("lap_time", first_lap)
        self.assertIn("fuel_load", first_lap)
        self.assertIn("track_temperature", first_lap)
        self.assertIn("compound", first_lap)
        self.assertIn("ground_truth_tyre_deg", first_lap)

    def test_lap_classification(self):
        """Verifies that out-laps and in-laps are appropriately classified and excluded."""
        classified = classify_session_laps(self.practice_data["laps"])
        self.assertEqual(len(classified), len(self.practice_data["laps"]))

        # First lap of Stint 1 should be PIT / OUT-LAP and excluded
        out_lap = classified[0]
        self.assertFalse(out_lap["used_in_model"])
        self.assertIn("OUT-LAP", out_lap["classification"])

        # Check that there are clean valid laps
        valid_laps = [l for l in classified if l["used_in_model"]]
        self.assertGreater(len(valid_laps), 20)

    def test_confounder_decomposition(self):
        """Verifies that the confounder engine isolates fuel burn and track evolution."""
        classified = classify_session_laps(self.practice_data["laps"])
        summary = self.confounder_engine.fit_and_decompose(classified)
        
        self.assertIn("learned_fuel_sensitivity_sec_per_kg", summary)
        self.assertGreater(summary["learned_fuel_sensitivity_sec_per_kg"], 0.015)
        self.assertLess(summary["learned_fuel_sensitivity_sec_per_kg"], 0.060)

        decomposed = summary["decomposed_laps"]
        # Lap 14 had traffic/dirty air in seed 42
        lap_14 = next(l for l in decomposed if l["lap_number"] == 14)
        self.assertIn("confounder_explanation", lap_14)
        self.assertIn("estimated_fuel_effect", lap_14)
        self.assertIn("estimated_tyre_deg", lap_14)

    def test_degradation_curves_and_ab_metrics(self):
        """Tests that clean degradation curves have lower error than naive raw models."""
        classified = classify_session_laps(self.practice_data["laps"])
        summary = self.confounder_engine.fit_and_decompose(classified)
        deg_results = self.degradation_model.fit_and_generate_curves(summary["decomposed_laps"])

        self.assertIn("overall_ab_comparison", deg_results)
        ab = deg_results["overall_ab_comparison"]
        self.assertLess(ab["treadtrace_isolated_mae"], ab["naive_baseline_mae"])
        self.assertGreater(ab["accuracy_improvement_pct"], 50.0)

        med_curve = deg_results["compounds"]["MEDIUM"]
        self.assertGreater(len(med_curve["curve"]), 15)
        # Verify 95% CI bounds exist
        pt = med_curve["curve"][5]
        self.assertLessEqual(pt["ci_lower"], pt["model_degradation"])
        self.assertGreaterEqual(pt["ci_upper"], pt["model_degradation"])

    def test_stint_prediction(self):
        """Tests forward prediction under custom starting parameters."""
        pred = self.prediction_engine.predict_stint(
            compound="MEDIUM",
            start_age_laps=0,
            target_stint_laps=22,
            start_fuel_kg=60.0,
            track_temp=38.0,
        )
        self.assertEqual(len(pred["forecast_laps"]), 22)
        # Lap 22 should exhibit higher tyre loss than Lap 2
        self.assertGreater(
            pred["forecast_laps"][-1]["expected_tyre_loss"],
            pred["forecast_laps"][1]["expected_tyre_loss"],
        )

    def test_compound_crossover_matrix(self):
        """Tests that compound crossover identifies when Medium surpasses Soft."""
        cross = self.prediction_engine.compare_compounds(stint_length=26, start_fuel=70.0)
        self.assertIn("soft_vs_medium_crossover_lap", cross)
        self.assertIsNotNone(cross["soft_vs_medium_crossover_lap"])
        self.assertGreater(cross["soft_vs_medium_crossover_lap"], 8)

    def test_post_race_validation_and_feedback(self):
        """Tests closed-loop validation and memory updating."""
        val = self.validator.run_validation()
        self.assertIn("overall_metrics", val)
        self.assertLess(val["overall_metrics"]["overall_mae_seconds"], 0.12)
        self.assertGreater(len(val["stints"]), 1)

        # Apply memory update
        update_res = self.validator.apply_feedback_to_memory(val)
        self.assertEqual(update_res["status"], "TYRE MEMORY UPDATED")
        self.assertGreater(len(update_res["updated_twins"]), 0)


if __name__ == "__main__":
    unittest.main()
