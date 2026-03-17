from backend.knowledge_base import (
    ALL_DOCUMENTS,
    CLEAN_DOCUMENTS,
    POISONED_DOCUMENTS,
    get_all_documents,
    get_documents_by_ids,
    retrieve_all,
    retrieve_topk,
)


# --- Clean document tests ---


def test_clean_doc_count():
    assert len(CLEAN_DOCUMENTS) == 17


def test_clean_docs_have_required_fields():
    for doc in CLEAN_DOCUMENTS:
        assert "id" in doc
        assert "title" in doc
        assert "content" in doc
        assert "category" in doc
        assert "attack_type" in doc
        assert doc["category"] == "clean"
        assert doc["attack_type"] is None


def test_clean_docs_content_nontrivial():
    for doc in CLEAN_DOCUMENTS:
        assert len(doc["content"]) > 200, f"Doc {doc['id']} content too short"


# --- Poisoned document tests ---


def test_poisoned_doc_count():
    assert len(POISONED_DOCUMENTS) == 16


def test_all_doc_count():
    assert len(ALL_DOCUMENTS) == 33


EXPECTED_ATTACK_TYPES = [
    "naive_injection",
    "unicode_smuggling",
    "delimiter_escape",
    "many_shot",
    "bad_likert_judge",
    "semantic_synonym",
    "procedural_checklist",
    "multilingual",
    "role_confusion",
    "tool_redefinition",
    "false_history",
    "ethical_blackmail",
    "board_resolution",
    "conditional_business_rule",
    "case_study_narrative",
    "payload_splitting",
]


def test_poisoned_docs_have_correct_attack_types():
    actual_types = [doc["attack_type"] for doc in POISONED_DOCUMENTS]
    assert actual_types == EXPECTED_ATTACK_TYPES


def test_poisoned_docs_have_required_fields():
    for doc in POISONED_DOCUMENTS:
        assert "id" in doc
        assert "title" in doc
        assert "content" in doc
        assert "category" in doc
        assert doc["category"] == "poisoned"
        assert doc["attack_type"] is not None


def test_poisoned_docs_content_nontrivial():
    for doc in POISONED_DOCUMENTS:
        assert len(doc["content"]) > 200, f"Doc {doc['id']} content too short"


def test_unicode_poisoned_doc_contains_invisible_chars():
    """The unicode smuggling doc should contain invisible tag characters."""
    unicode_doc = next(d for d in POISONED_DOCUMENTS if d["attack_type"] == "unicode_smuggling")
    content = unicode_doc["content"]
    # Check for Unicode tag characters in range U+E0000–U+E007F
    tag_chars = [c for c in content if 0xE0000 <= ord(c) <= 0xE007F]
    assert len(tag_chars) > 0, "Unicode smuggling doc should contain invisible tag characters"


# --- Metadata tests ---


def test_get_all_documents_returns_metadata():
    metadata = get_all_documents()
    assert len(metadata) == 33
    for meta in metadata:
        assert "id" in meta
        assert "title" in meta
        assert "category" in meta
        assert "attack_type" in meta
        assert "content" not in meta


def test_get_documents_by_ids():
    ids = ["clean_1_employment", "clean_3_nda"]
    docs = get_documents_by_ids(ids)
    assert len(docs) == 2
    returned_ids = {d["id"] for d in docs}
    assert returned_ids == set(ids)
    for doc in docs:
        assert "content" in doc


def test_get_documents_by_ids_empty():
    docs = get_documents_by_ids([])
    assert docs == []


def test_get_documents_by_ids_nonexistent():
    docs = get_documents_by_ids(["nonexistent_id"])
    assert docs == []


# --- Retrieval tests ---


def test_retrieve_all_returns_active_docs():
    ids = ["clean_1_employment", "poisoned_1_naive", "clean_3_nda"]
    docs = retrieve_all(ids)
    assert len(docs) == 3
    returned_ids = {d["id"] for d in docs}
    assert returned_ids == set(ids)


def test_retrieve_all_empty():
    docs = retrieve_all([])
    assert docs == []


def test_retrieve_topk_returns_relevant_docs():
    all_ids = [d["id"] for d in ALL_DOCUMENTS]
    results = retrieve_topk("termination policy", all_ids, k=3)
    assert len(results) > 0
    assert len(results) <= 3
    # The termination policy doc should be among the top results
    result_ids = {d["id"] for d in results}
    assert "clean_2_termination" in result_ids


def test_retrieve_topk_respects_active_ids():
    # Only search within clean docs
    clean_ids = [d["id"] for d in CLEAN_DOCUMENTS]
    results = retrieve_topk("escalation procedures", clean_ids, k=3)
    for doc in results:
        assert doc["category"] == "clean"


def test_retrieve_topk_empty_active():
    results = retrieve_topk("anything", [], k=3)
    assert results == []
