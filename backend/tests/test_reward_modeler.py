"""
Regression tests for confidence-weighted reward (see docs/model_limitations.md):
a 51%-confidence classification and a 100%-confidence classification of the
same transition used to produce identical reward -- compute_reward now scales
by confidence.
"""
from agents.reward_modeler import compute_reward, rl_reward_modeler
from models.state import WorkflowState


class TestComputeRewardConfidenceScaling:
    def test_default_confidence_matches_full_base_reward(self):
        # No confidence passed -> full weight, same as the original flat table.
        assert compute_reward("Focused", "Focused") == 10.0
        assert compute_reward("Focused", "Impulsive") == -8.0

    def test_full_confidence_matches_base_reward(self):
        assert compute_reward("Focused", "Focused", confidence=1.0) == 10.0

    def test_lower_confidence_shrinks_reward_magnitude(self):
        high_conf = compute_reward("Focused", "Distracted", confidence=1.0)
        low_conf = compute_reward("Focused", "Distracted", confidence=0.5)
        assert abs(low_conf) < abs(high_conf)

    def test_lower_confidence_shrinks_negative_reward_too(self):
        # Sign must be preserved -- only magnitude should shrink.
        high_conf = compute_reward("Focused", "Impulsive", confidence=1.0)
        low_conf = compute_reward("Focused", "Impulsive", confidence=0.5)
        assert high_conf < 0 and low_conf < 0
        assert low_conf > high_conf  # less negative

    def test_confidence_at_classifier_floor_is_half_of_full_reward(self):
        # attention_state_classifier's own minimum confidence is 0.5.
        full = compute_reward("Distracted", "Focused", confidence=1.0)
        floor = compute_reward("Distracted", "Focused", confidence=0.5)
        assert floor == full * 0.5

    def test_confidence_below_classifier_floor_is_clamped(self):
        # Shouldn't be possible from the real classifier, but a caller
        # passing a bad value shouldn't produce a larger swing than the floor.
        floor = compute_reward("Focused", "Focused", confidence=0.5)
        below_floor = compute_reward("Focused", "Focused", confidence=0.1)
        assert below_floor == floor

    def test_confidence_above_one_is_clamped(self):
        full = compute_reward("Focused", "Focused", confidence=1.0)
        above = compute_reward("Focused", "Focused", confidence=1.5)
        assert above == full


class TestRewardModelerNode:
    def test_node_uses_state_confidence(self):
        state = WorkflowState(
            attention_state="Distracted",
            previous_attention_state="Focused",
            confidence=0.5,
        )
        result = rl_reward_modeler(state)
        expected = compute_reward("Focused", "Distracted", confidence=0.5)
        assert result["reward"] == expected

    def test_node_errors_without_attention_state(self):
        state = WorkflowState()
        result = rl_reward_modeler(state)
        assert "error" in result
