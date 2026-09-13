"""
Unit tests for TreadTrace 4-Wheel Vehicle Digital Twin and TyreRiskEngine.
Tests threshold boundaries, risk classification, corner load mapping,
and individual tyre analytical state retrieval.
"""

import unittest
from app.ml.risk_engine import TyreRiskEngine, TYRE_RISK_THRESHOLDS
from app.models.vehicle_twin import VehicleDigitalTwin, CORNER_CONFIG
from app.synthetic.generator import generate_practice_session
from app.preprocessing.classifier import classify_session_laps


class TestTyreRiskEngine(unittest.TestCase):
    def setUp(self):
        self.engine = TyreRiskEngine()

    def test_threshold_definitions(self):
        """Validates that centralized thresholds adhere to configuration."""
        self.assertEqual(TYRE_RISK_THRESHOLDS["NORMAL_MAX"], 49)
        self.assertEqual(TYRE_RISK_THRESHOLDS["WARNING_MAX"], 79)
        self.assertEqual(TYRE_RISK_THRESHOLDS["CRITICAL_MAX"], 94)
        self.assertEqual(TYRE_RISK_THRESHOLDS["FAILURE_RISK_MIN"], 95)

    def test_risk_boundary_classification(self):
        """Validates exact classification at 49, 50, 79, 80, 94, 95 score boundaries."""
        # Exact boundary 49 -> NORMAL
        state_49, lvl_49 = self.engine.classify_risk_score(49.0)
        self.assertEqual(state_49, "NORMAL")
        self.assertEqual(lvl_49, 0)

        # Exact boundary 50 -> WARNING
        state_50, lvl_50 = self.engine.classify_risk_score(50.0)
        self.assertEqual(state_50, "WARNING")
        self.assertEqual(lvl_50, 1)

        # Exact boundary 79 -> WARNING
        state_79, lvl_79 = self.engine.classify_risk_score(79.0)
        self.assertEqual(state_79, "WARNING")
        self.assertEqual(lvl_79, 1)

        # Exact boundary 80 -> CRITICAL
        state_80, lvl_80 = self.engine.classify_risk_score(80.0)
        self.assertEqual(state_80, "CRITICAL")
        self.assertEqual(lvl_80, 2)

        # Exact boundary 94 -> CRITICAL
        state_94, lvl_94 = self.engine.classify_risk_score(94.0)
        self.assertEqual(state_94, "CRITICAL")
        self.assertEqual(lvl_94, 2)

        # Exact boundary 95 -> FAILURE_RISK
        state_95, lvl_95 = self.engine.classify_risk_score(95.0)
        self.assertEqual(state_95, "FAILURE_RISK")
        self.assertEqual(lvl_95, 3)

        # High risk 99 -> FAILURE_RISK
        state_99, lvl_99 = self.engine.classify_risk_score(99.0)
        self.assertEqual(state_99, "FAILURE_RISK")
        self.assertEqual(lvl_99, 3)

    def test_thermal_states(self):
        """Verifies thermal status classifications: OPTIMAL, WARM, STRESSED, CRITICAL."""
        t_opt = self.engine.evaluate_tyre(90, 5, 26, 0.04, current_temp=39.0, opt_temp=38.0)
        self.assertEqual(t_opt["thermal_status"], "OPTIMAL")

        t_warm = self.engine.evaluate_tyre(80, 10, 26, 0.04, current_temp=44.0, opt_temp=38.0)
        self.assertEqual(t_warm["thermal_status"], "WARM")

        t_stressed = self.engine.evaluate_tyre(60, 18, 26, 0.04, current_temp=52.0, opt_temp=38.0)
        self.assertEqual(t_stressed["thermal_status"], "STRESSED")

        t_crit = self.engine.evaluate_tyre(40, 25, 26, 0.04, current_temp=60.0, opt_temp=38.0)
        self.assertEqual(t_crit["thermal_status"], "CRITICAL")


class TestVehicleDigitalTwin(unittest.TestCase):
    def setUp(self):
        self.twin = VehicleDigitalTwin()
        self.practice_session = generate_practice_session(seed=42)
        self.practice_session["laps"] = classify_session_laps(self.practice_session["laps"])

    def test_four_corners_exist(self):
        """Ensures all 4 positions (FL, FR, RL, RR) are populated in vehicle state."""
        state = self.twin.build_vehicle_state(self.practice_session, lap_number=17)
        self.assertIn("tyres", state)
        self.assertSetEqual(set(state["tyres"].keys()), {"FL", "FR", "RL", "RR"})

    def test_corner_asymmetry_silverstone(self):
        """Validates that Rear-Left (RL) exhibits highest lateral/thermal wear at Silverstone."""
        state = self.twin.build_vehicle_state(self.practice_session, lap_number=17)
        fl = state["tyres"]["FL"]
        fr = state["tyres"]["FR"]
        rl = state["tyres"]["RL"]
        rr = state["tyres"]["RR"]

        # RL should have the highest degradation rate due to clockwise circuit lateral traction load
        self.assertGreater(rl["estimated_degradation_rate"], fl["estimated_degradation_rate"])
        self.assertGreater(rl["estimated_degradation_rate"], rr["estimated_degradation_rate"])
        self.assertGreater(rl["current_temperature"], fl["current_temperature"])

        # At lap 17: RL should be in high stress/critical, while others have more health
        self.assertLess(rl["current_health_pct"], fl["current_health_pct"])
        self.assertLess(rl["current_health_pct"], rr["current_health_pct"])

    def test_individual_corner_generation(self):
        """Tests generate_corner_tyre_state for each position."""
        for pos in ["FL", "FR", "RL", "RR"]:
            corner = self.twin.generate_corner_tyre_state(
                position=pos,
                base_tyre_twin=None,
                compound="MEDIUM",
                tyre_age=15,
                track_temp=38.0,
                fitted_deg_rate=0.041,
            )
            self.assertEqual(corner["position"], pos)
            self.assertIn("degradation_breakdown", corner)
            self.assertIn("risk_evaluation", corner)
            self.assertIn("model_evidence_notes", corner)
            self.assertFalse(corner["provenance_metadata"]["is_measured"])
            self.assertTrue(corner["provenance_metadata"]["is_modeled"])

    def test_flexible_position_naming(self):
        """Ensures flexible position formats like 'front-left' and 'RL' resolve to proper corner states."""
        corner_fl = self.twin.generate_corner_tyre_state(position="front-left", base_tyre_twin=None)
        self.assertEqual(corner_fl["position"], "FL")

        corner_rl = self.twin.generate_corner_tyre_state(position="rear_left", base_tyre_twin=None)
        self.assertEqual(corner_rl["position"], "RL")

        corner_fr = self.twin.generate_corner_tyre_state(position="fr", base_tyre_twin=None)
        self.assertEqual(corner_fr["position"], "FR")

    def test_api_vehicle_endpoints(self):
        """Tests that the route handler functions get_vehicle_tyres and get_tyre_corner_detail return valid data."""
        from app.main import get_vehicle_tyres, get_tyre_corner_detail

        v_data = get_vehicle_tyres(lap=17)
        self.assertIn("tyres", v_data)
        self.assertIn("FL", v_data["tyres"])
        self.assertIn("RL", v_data["tyres"])
        self.assertEqual(v_data["lap"], 17)

        # RL should be CRITICAL at lap 17
        self.assertEqual(v_data["tyres"]["RL"]["risk_state"], "CRITICAL")
        self.assertEqual(v_data["tyres"]["FR"]["risk_state"], "WARNING")
        self.assertEqual(v_data["tyres"]["FL"]["risk_state"], "NORMAL")
        self.assertEqual(v_data["tyres"]["RR"]["risk_state"], "NORMAL")

        # Test single corner endpoint
        c_data = get_tyre_corner_detail("rear-left", lap=17)
        self.assertEqual(c_data["position"], "RL")
        self.assertIn("curve", c_data)
        self.assertGreater(len(c_data["curve"]), 10)


if __name__ == "__main__":
    unittest.main()
