import os

def refine_steps(steps, use_ai=True):
    """Refine steps using an LLM or a rule-based fallback."""
    if not use_ai:
        return [rule_based_fallback(step) for step in steps]

    refined_steps = []
    for step in steps:
        refined_step = step.copy()
        # In a real app, we would call an LLM API here.
        # We'll prepend "AI Refined: " to simulate the refinement.
        refined_step["description"] = f"AI Refined: {step['description']}"
        refined_steps.append(refined_step)
    return refined_steps

def rule_based_fallback(step):
    """Fallback logic when AI is unavailable."""
    refined_step = step.copy()
    # Simple rule: Ensure description starts with "Action:"
    if not refined_step["description"].startswith("Action:"):
        refined_step["description"] = f"Action: {step['description']}"
    return refined_step

def generate_summary(steps):
    """Generate an executive summary for the recording session."""
    return f"This session contains {len(steps)} steps across various applications."

if __name__ == "__main__":
    # Test local refinement
    test_steps = [{"title": "Action", "description": "The user clicked the Left button in Chrome.", "app_name": "Chrome"}]
    print(refine_steps(test_steps))
