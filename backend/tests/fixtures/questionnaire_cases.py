"""
Classroom turns derived from a standard 50-item clinical ADHD assessment
(DSM-5-TR / ASRS-style inattention and hyperactivity-impulsivity items).
Each turn is a small synthetic teacher prompt + student response + response
latency, written to embody one clinical construct from the questionnaire --
NOT a reproduction of the questionnaire itself, and not a validation study
against it (the pipeline classifies one classroom turn, not a 50-item
self-report). See docs/questionnaire_validation.md for what this is and
isn't evidence of.

Shared between:
  - tests/test_questionnaire_constructs.py  (regression assertions on the
    expected attention_state label for each case)
  - scripts/validate_against_assessment_questionnaire.py  (runs the same
    cases through a full multi-turn session and writes the human-readable
    report in docs/questionnaire_validation.md)
"""

# (item, clinical_construct, teacher_prompt, student_response,
#  response_latency_seconds, expected_attention_state)
CASES: list[tuple[str, str, str, str, float, str]] = [
    (
        "Baseline",
        "No symptoms (control turn)",
        "What is photosynthesis?",
        "Photosynthesis is the process by which plants convert sunlight, "
        "water, and carbon dioxide into glucose and oxygen, using "
        "chlorophyll in their leaves.",
        6.5,
        "Focused",
    ),
    (
        "Q1",
        "Careless mistakes on a routine task (DSM-5-TR inattention A1)",
        "Can you solve 24 plus 18?",
        "42... wait no, 32. I mean 42. Sorry, 42.",
        3.0,
        "Distracted",
    ),
    (
        "Q2 / Q3",
        "Can't hold attention; seems not to be listening (inattention A1)",
        "Can you summarize the chapter we just read about the water cycle?",
        "Uh, it was about... water? I don't really remember, can you "
        "repeat the question?",
        9.5,
        "Distracted",
    ),
    (
        "Q4",
        "Starts tasks, doesn't finish them (inattention A1)",
        "Please write two sentences describing your favorite animal.",
        "My favorite animal is",
        4.0,
        "Impulsive",
    ),
    (
        "Q6",
        "Avoids/resists sustained mental effort (inattention A1)",
        "Can you read this paragraph and explain what it means in your own words?",
        "Do we have to do this one? It's long, can we skip it?",
        2.0,
        "Distracted",
    ),
    (
        "Q8",
        "Pulled off-track by external stimuli (inattention A1)",
        "What were the main causes of World War I?",
        "Wait is that a bird outside? Sorry -- causes, um, there was an "
        "archduke I think, and also did you hear that noise?",
        14.0,
        "Distracted",
    ),
    (
        "Q16",
        "Answers before the question is finished (hyperactivity-impulsivity A2)",
        "Can you tell me what you think the answer to this long, "
        "multi-part question about the area of a circle, given radius "
        "five, might possibly be?",
        "Twenty-five pi!",
        0.6,
        "Impulsive",
    ),
    (
        "Q17 / Q10",
        "Can't wait turn; fidgety, rushed response (hyperactivity-impulsivity A2)",
        "Okay, when you're ready, tell me about your weekend.",
        "canwegonowcanwegonow okay fine can we go",
        0.8,
        "Impulsive",
    ),
    (
        "Q36",
        "Hyperfocus -- long, highly engaged, on-topic response (Barkley BDEFS)",
        "Tell me everything you know about how volcanoes form.",
        "Volcanoes form at tectonic plate boundaries where magma rises "
        "through the crust; there are shield volcanoes, stratovolcanoes, "
        "and cinder cones, each shaped by viscosity and eruption style.",
        11.0,
        "Focused",
    ),
    (
        "Q37",
        "Quick escalation to frustration (Barkley BDEFS emotional regulation)",
        "That answer isn't quite right, can you try again?",
        "I don't want to do this anymore, this is stupid, I already told "
        "you the answer.",
        1.5,
        "Distracted",
    ),
]
