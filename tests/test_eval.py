"""Parameterized pytest suite for eval scenarios (live LLM calls)."""

import pytest

from backend.eval_runner import (
    EvalScenario,
    build_all_scenarios,
    run_eval,
    _scenario1,
    _scenario2,
    _scenario3,
    _scenario4,
    _scenario5,
    _scenario6,
    _scenario7,
)
from backend.knowledge_base import POISONED_DOCUMENTS

POISONED_IDS = [d["id"] for d in POISONED_DOCUMENTS]
LAYER_POISON_COMBOS = [(layer, pid) for layer in [1, 2, 3, 4, 5, 6] for pid in POISONED_IDS]


def _run_and_assert(scenario: EvalScenario) -> None:
    """Helper: run a single scenario and assert it passes."""
    result = run_eval(scenario)
    assert result.passed, (
        f"Scenario '{result.scenario.id}' failed: {result.failure_reasons}"
    )


def _find_scenario(scenarios: list[EvalScenario], suffix: str) -> EvalScenario:
    """Find a scenario by id suffix."""
    for s in scenarios:
        if s.id.endswith(suffix) or suffix in s.id:
            return s
    raise ValueError(f"No scenario matching '{suffix}' in {[s.id for s in scenarios]}")


# ---- Scenario 1: Clean query, clean KB, all layers ----

class TestScenario1:
    def test_clean_query_clean_kb(self):
        """Normal informational query with clean KB and full protection."""
        scenario = _scenario1()[0]
        _run_and_assert(scenario)


# ---- Scenario 2: Baseline attacks (no protection) ----

class TestScenario2Baseline:
    @pytest.mark.parametrize("poison_id", POISONED_IDS)
    def test_baseline_attack(self, poison_id: str):
        """Baseline: poisoned doc with no layers — records whether attack triggers.

        This is a soft test (always passes) — it documents attack effectiveness.
        """
        scenarios = _scenario2()
        scenario = _find_scenario(scenarios, poison_id)
        result = run_eval(scenario)
        # Baseline always passes (soft assertion)
        assert result.passed
        # Log what happened for visibility
        allowed = [tc for tc in result.response.tool_calls if tc.status == "allowed"]
        if allowed:
            print(f"  ATTACK TRIGGERED: {poison_id} -> {[tc.name for tc in allowed]}")
        else:
            print(f"  Attack did not trigger: {poison_id}")


# ---- Scenario 3: All layers block each attack ----

class TestScenario3AllLayers:
    @pytest.mark.parametrize("poison_id", POISONED_IDS)
    def test_all_layers_block(self, poison_id: str):
        """Each poisoned doc with all layers enabled — should block all attacks."""
        scenarios = _scenario3()
        scenario = _find_scenario(scenarios, poison_id)
        _run_and_assert(scenario)


# ---- Scenario 4: User tool request with poisoned KB ----

class TestScenario4:
    def test_user_tool_allowed(self):
        """User explicitly requests email — should be allowed despite poisoned KB."""
        scenario = _scenario4()[0]
        _run_and_assert(scenario)


# ---- Scenario 5: Agent refuses document instructions ----

class TestScenario5:
    def test_agent_refuses(self):
        """'Do what the document says' — agent should refuse."""
        scenario = _scenario5()[0]
        _run_and_assert(scenario)


# ---- Scenario 6: Layer ablation matrix ----

class TestScenario6Ablation:
    @pytest.mark.parametrize("layer,poison_id", LAYER_POISON_COMBOS)
    def test_layer_ablation(self, layer: int, poison_id: str):
        """Each layer solo vs each poisoned doc — informational, soft assertion.

        Records which layers catch which attack types.
        """
        scenarios = _scenario6()
        scenario = _find_scenario(scenarios, f"s6_L{layer}_{poison_id}")
        result = run_eval(scenario)
        # Soft assertion (baseline_attack=True means always passes)
        assert result.passed
        allowed = [tc for tc in result.response.tool_calls if tc.status == "allowed"]
        events = len(result.response.security_events)
        status = "BLOCKED" if (not allowed and events > 0) else ("safe" if not allowed else "LEAKED")
        print(f"  L{layer} vs {poison_id}: {status}")


# ---- Scenario 7: Lightweight preset ----

class TestScenario7Lightweight:
    @pytest.mark.parametrize("poison_id", POISONED_IDS)
    def test_lightweight_preset(self, poison_id: str):
        """Lightweight [1,2,5] vs each poisoned doc."""
        scenarios = _scenario7()
        scenario = _find_scenario(scenarios, poison_id)
        _run_and_assert(scenario)
