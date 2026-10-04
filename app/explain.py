from typing import Any


def compute_highlights(tfidf: Any, lr: Any, content: str) -> dict[str, list[dict[str, Any]]]:
    """Computes top terms pushing toward questionable (fake) or reliable (real).

    Uses the Logistic Regression model coefficients multiplied by TF-IDF weights.
    Returns:
        {
            "questionable": [{"term": str, "weight": float}, ...],
            "reliable": [{"term": str, "weight": float}, ...]
        }
    """
    empty_result: dict[str, list[dict[str, Any]]] = {
        "questionable": [],
        "reliable": [],
    }

    if not content or not tfidf or not lr:
        return empty_result

    try:
        X = tfidf.transform([content])
        idx = X.nonzero()[1]
        if len(idx) == 0:
            return empty_result

        # vals > 0 pushes toward fake/questionable; vals < 0 pushes toward real/reliable
        vals = X[0, idx].toarray().ravel() * lr.coef_[0][idx]
        feature_names = tfidf.get_feature_names_out()
        terms = feature_names[idx]

        positive_items: list[tuple[str, float]] = []
        negative_items: list[tuple[str, float]] = []

        for term, val in zip(terms, vals):
            if val > 0:
                positive_items.append((str(term), float(val)))
            elif val < 0:
                negative_items.append((str(term), float(val)))

        # Sort by magnitude |val| descending, take top 6
        positive_items.sort(key=lambda x: abs(x[1]), reverse=True)
        negative_items.sort(key=lambda x: abs(x[1]), reverse=True)

        top_pos = positive_items[:6]
        top_neg = negative_items[:6]

        # Calculate max absolute value across candidate items for normalization
        all_top = top_pos + top_neg
        if not all_top:
            return empty_result

        max_val = max(abs(val) for _, val in all_top)
        if max_val == 0:
            return empty_result

        questionable = [
            {"term": term, "weight": round(abs(val) / max_val, 4)}
            for term, val in top_pos
        ]
        reliable = [
            {"term": term, "weight": round(abs(val) / max_val, 4)}
            for term, val in top_neg
        ]

        return {
            "questionable": questionable,
            "reliable": reliable,
        }
    except Exception:
        # Fallback without crashing
        return empty_result
