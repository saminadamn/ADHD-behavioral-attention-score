"""
Large-scale synthetic ADHD classroom interaction dataset generator.
Target: 30,000 samples (10,000 per class: Focused / Distracted / Impulsive)

Symptom coverage drawn from:
- DSM-5 ADHD criteria (NBK441838)
- IIV and mind-wandering research (PMC3724232)
- Educational intervention literature (WPS journal 2023)
- Conversational diversity inspired by Reddit dialogue patterns and casual conversation corpora

Run:
    python scripts/generate_large_dataset.py
    python scripts/generate_large_dataset.py --samples 50000 --out data/synthetic_adhd_large.csv
"""
from __future__ import annotations
import csv
import random
import argparse
import os
from itertools import product

random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# 1.  CURRICULUM DOMAINS  ×  CONCEPTS
# ─────────────────────────────────────────────────────────────────────────────
DOMAINS: dict[str, list[str]] = {
    "mathematics": [
        "fractions", "algebra", "geometry", "prime numbers", "percentages",
        "ratios", "the Pythagorean theorem", "quadratic equations", "probability",
        "statistics", "calculus derivatives", "number lines", "integers",
        "exponents", "square roots", "coordinate planes", "matrices",
        "the order of operations", "decimal place value", "long division",
    ],
    "science_biology": [
        "photosynthesis", "mitosis", "DNA replication", "natural selection",
        "the food chain", "cell membranes", "osmosis", "respiration",
        "the digestive system", "the nervous system", "ecosystems", "taxonomy",
        "genetics and heredity", "antibodies", "enzyme function",
        "the water cycle", "plant reproduction", "animal adaptations",
        "the carbon cycle", "homeostasis",
    ],
    "science_physics": [
        "Newton's laws of motion", "gravity", "electrical circuits", "magnetism",
        "wave properties", "thermodynamics", "momentum", "velocity and acceleration",
        "kinetic and potential energy", "nuclear fusion", "refraction of light",
        "sound waves", "Ohm's law", "pressure in fluids", "the electromagnetic spectrum",
        "simple machines", "friction", "projectile motion", "static electricity",
        "Archimedes' principle",
    ],
    "science_chemistry": [
        "the periodic table", "chemical bonding", "acids and bases", "oxidation",
        "balancing chemical equations", "the mole concept", "electrochemistry",
        "polymers", "reaction rates", "states of matter",
        "atomic structure", "isotopes", "organic chemistry basics",
        "Le Chatelier's principle", "titration", "entropy", "covalent bonds",
        "ionic compounds", "hydrocarbons", "catalysts",
    ],
    "history": [
        "the French Revolution", "World War I causes", "World War II",
        "the Industrial Revolution", "the Cold War", "colonialism",
        "the Renaissance", "ancient Rome", "ancient Egypt",
        "the Civil Rights Movement", "the Mughal Empire", "the Silk Road",
        "the Great Depression", "the Moon landing", "the partition of India",
        "the Berlin Wall", "the Ottoman Empire", "the Enlightenment",
        "ancient Greece democracy", "the Boston Tea Party",
    ],
    "english_literature": [
        "metaphors and similes", "narrative point of view", "character development",
        "the themes of 'To Kill a Mockingbird'", "Shakespearean tragedy",
        "plot structure", "symbolism", "foreshadowing", "irony",
        "the hero's journey", "alliteration", "tone and mood in poetry",
        "stream of consciousness writing", "the unreliable narrator",
        "imagery in Romantic poetry", "satire as a literary device",
        "the sonnet form", "dystopian fiction conventions",
        "dialogue and characterisation", "the difference between theme and plot",
    ],
    "geography": [
        "plate tectonics", "climate zones", "river systems", "map projections",
        "demographic transition", "the water cycle", "urbanisation",
        "trade winds", "monsoons", "deforestation and its effects",
        "the greenhouse effect", "ocean currents", "mountain formation",
        "desertification", "population density", "economic development indicators",
        "the Amazon rainforest", "glaciers and ice sheets",
        "the Ring of Fire", "time zones",
    ],
    "computer_science": [
        "binary numbers", "sorting algorithms", "object-oriented programming",
        "recursion", "data structures like stacks and queues",
        "how the internet works", "encryption basics", "machine learning concepts",
        "database normalisation", "version control with Git",
        "boolean logic", "API design", "operating systems",
        "memory management", "network protocols", "the Turing test",
        "cybersecurity principles", "cloud computing", "regular expressions",
        "the difference between compiled and interpreted languages",
    ],
    "economics": [
        "supply and demand", "inflation", "GDP", "market structures",
        "opportunity cost", "the stock market", "monetary policy",
        "fiscal policy", "comparative advantage", "unemployment types",
        "the business cycle", "externalities", "public goods",
        "consumer surplus", "elasticity of demand", "globalisation effects",
        "taxation systems", "central banking", "price ceilings and floors",
        "microeconomics vs macroeconomics",
    ],
    "health_and_biology": [
        "the immune system", "nutrition and macronutrients", "mental health basics",
        "how vaccines work", "the cardiovascular system", "sleep and brain function",
        "stress and cortisol", "the endocrine system", "puberty and development",
        "substance abuse effects on the brain", "first aid procedures",
        "hygiene and disease prevention", "the skeletal system",
        "muscle types", "respiratory diseases", "diabetes",
        "how antibiotics work", "the lymphatic system",
        "eye anatomy and vision", "the role of exercise in health",
    ],
    "social_studies": [
        "democracy vs autocracy", "human rights", "the United Nations",
        "climate change policy", "immigration and its economic effects",
        "media literacy", "the justice system", "citizenship and civic duties",
        "cultural diversity", "poverty and inequality",
        "the role of NGOs", "propaganda in history",
        "social contract theory", "gender equality movements",
        "environmental ethics", "digital privacy rights",
        "the role of trade agreements", "refugee crises",
        "nationalism and its effects", "sustainable development goals",
    ],
    "arts_and_music": [
        "the elements of art", "colour theory", "Renaissance painters",
        "jazz history", "classical music periods", "the role of rhythm in music",
        "impressionism in painting", "street art as social commentary",
        "music theory basics", "film editing techniques",
        "how perspective works in drawing", "the Bauhaus movement",
        "African drumming traditions", "opera history", "photography composition",
        "the blues genre origins", "abstract expressionism",
        "music and emotion research", "the golden ratio in art", "digital art tools",
    ],
    "philosophy_and_ethics": [
        "utilitarianism", "Kant's categorical imperative", "free will vs determinism",
        "the trolley problem", "Plato's theory of forms", "Aristotle's virtue ethics",
        "the mind-body problem", "existentialism", "social contract theory",
        "the ethics of artificial intelligence", "what is consciousness",
        "the nature of knowledge", "moral relativism", "the philosophy of science",
        "rights-based ethics", "environmental ethics",
        "the problem of evil", "epistemic humility", "Socratic method",
        "the difference between ethics and morality",
    ],
    "language_and_grammar": [
        "subject-verb agreement", "passive and active voice",
        "punctuation rules for commas", "the difference between affect and effect",
        "conjunctions", "dependent clauses", "reported speech",
        "apostrophe usage", "parallel structure", "dangling modifiers",
        "prepositions of place and time", "countable vs uncountable nouns",
        "modal verbs", "conditionals", "relative clauses",
        "the difference between since and for", "phrasal verbs",
        "comparative and superlative adjectives", "articles in English",
        "the perfect tenses",
    ],
    "environmental_science": [
        "renewable energy sources", "fossil fuel dependency", "carbon footprints",
        "biodiversity loss", "ocean acidification", "the ozone layer",
        "sustainable agriculture", "plastic pollution", "water scarcity",
        "nuclear energy pros and cons", "wetland ecosystems",
        "urban heat islands", "environmental impact assessments",
        "the Paris Agreement", "coral reef bleaching",
        "soil erosion", "e-waste", "nitrogen cycle disruption",
        "rewilding projects", "climate refugees",
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# 2.  TEACHER PROMPT TEMPLATES  (filled with {concept})
# ─────────────────────────────────────────────────────────────────────────────
PROMPT_TEMPLATES: list[str] = [
    "Can you explain {concept} in your own words?",
    "What do you know about {concept}?",
    "Describe {concept} and give me an example.",
    "How would you define {concept}?",
    "What's the most important thing to understand about {concept}?",
    "Can you walk me through {concept} step by step?",
    "Why is {concept} important?",
    "How does {concept} work?",
    "What have we learned about {concept} so far?",
    "Can anyone summarise {concept} for the class?",
    "What questions do you have about {concept}?",
    "Let's revisit {concept} — who can tell me the main idea?",
    "I want you to think critically: what are the limitations of {concept}?",
    "How does {concept} connect to what we covered last week?",
    "If you had to teach {concept} to a younger student, how would you explain it?",
    "Can you give me a real-world application of {concept}?",
    "What surprised you most when you learned about {concept}?",
    "Is there anything about {concept} you found confusing?",
    "Compare {concept} with something else we've studied.",
    "What would happen if {concept} didn't exist or work the way it does?",
    "Imagine you had to write one sentence about {concept} for an exam. What would it say?",
    "Tell me one fact you remember about {concept}.",
    "Does anyone disagree with the way {concept} is commonly explained? Why?",
    "How do scientists or experts use {concept} in the real world?",
    "On a scale of one to ten, how confident are you about {concept}? And why?",
]

# ─────────────────────────────────────────────────────────────────────────────
# 3.  FOCUSED RESPONSE BUILDING BLOCKS
# ─────────────────────────────────────────────────────────────────────────────
FOCUSED_INTROS: list[str] = [
    "",
    "Sure, so ",
    "Right, so ",
    "Okay so basically ",
    "From what I understand, ",
    "Based on what we've learned, ",
    "I think ",
    "Well, ",
    "So ",
    "As far as I know, ",
]

FOCUSED_BODIES: list[str] = [
    "{concept} is a core idea in this subject that involves understanding how {aspect} relates to {outcome}.",
    "{concept} essentially means that {aspect}, which leads to {outcome}.",
    "The main point of {concept} is that {aspect}. This is important because {outcome}.",
    "{concept} can be understood by breaking it into parts: first there is {aspect}, and from that we get {outcome}.",
    "{concept} is the process by which {aspect} results in {outcome}.",
    "If I had to explain {concept}, I'd say it's all about {aspect}, and the key takeaway is {outcome}.",
    "We can think of {concept} as a system where {aspect} drives {outcome}.",
    "{concept} shows that {aspect}. An example of this would be when {outcome}.",
    "The reason {concept} matters is that {aspect}, which in turn affects {outcome}.",
    "{concept} is defined by the relationship between {aspect} and {outcome}.",
]

FOCUSED_ASPECTS: list[str] = [
    "certain factors interact with one another",
    "underlying principles govern observed behaviour",
    "the inputs determine the outputs in a predictable way",
    "the component parts work together as a system",
    "historical context shapes how we interpret the evidence",
    "formal rules describe natural patterns",
    "cause and effect relationships are central",
    "the structure determines the function",
    "multiple variables must be considered simultaneously",
    "the model simplifies a complex reality",
    "quantitative measurement helps us understand change",
    "comparison between cases reveals the underlying mechanism",
    "the definition distinguishes it from related ideas",
    "scale and magnitude affect the outcomes significantly",
    "feedback loops reinforce or counteract initial conditions",
]

FOCUSED_OUTCOMES: list[str] = [
    "we can make accurate predictions",
    "we gain tools to solve real problems",
    "better decisions can be made with this knowledge",
    "we understand the why, not just the what",
    "it applies to many situations beyond the classroom",
    "the implications are significant for everyday life",
    "it forms the foundation for more advanced study",
    "the pattern repeats across different examples",
    "professionals rely on it constantly in their work",
    "ignoring it would lead to errors and misunderstandings",
    "testing and evidence support the conclusion",
    "the exceptions to the rule actually reinforce it",
    "the historical development of the idea is fascinating",
    "it changes how we see the world around us",
    "connecting it to prior knowledge makes it easier to remember",
]

FOCUSED_CLOSINGS: list[str] = [
    " Does that make sense?",
    " I hope that answers the question.",
    " I think that's the main idea.",
    " At least, that's my understanding.",
    " I could elaborate if needed.",
    " I learned that from the reading we did last week.",
    "",
    " It's actually really interesting once you get into it.",
    " I wrote notes on this, so I'm fairly confident.",
    " Am I on the right track?",
]

# ─────────────────────────────────────────────────────────────────────────────
# 4.  DISTRACTED RESPONSE BUILDING BLOCKS
#     Inspired by: Reddit casual tangents, casual conversation corpora,
#     DSM-5 inattention criteria (mind-wandering, default-mode intrusions)
# ─────────────────────────────────────────────────────────────────────────────

# 4a. Pure off-topic patterns (mind wandering, default mode network intrusions)
DISTRACTED_PURE: list[str] = [
    "Oh wait, I totally forgot — did you hear about what happened at lunch yesterday? The drama was unreal.",
    "Sorry, I was just thinking about that video I watched last night. It was about {random_topic} and I couldn't stop watching.",
    "Hmm, I actually don't remember. I was trying to figure out if my phone was on silent the whole time.",
    "Wait, can I ask something unrelated? Why do we have to wear uniforms? It's been bothering me all morning.",
    "I keep thinking about the weekend. My cousin is visiting and we're going to {random_activity}. I can't focus.",
    "Oh! I just remembered — I left my water bottle in the science room. Can I go get it?",
    "Sorry, what was the question again? I was looking out the window and got distracted by the birds.",
    "That actually makes me think of something I saw on social media — there was this video where someone tried to {random_activity} and it went completely wrong.",
    "I keep confusing this with {random_topic}. We talked about that last year and I never got it either.",
    "Wait, is the cafeteria serving pizza today? I heard it was pizza day and I've been thinking about it since first period.",
    "Honestly I zoned out during that part of the lesson. I was thinking about whether I passed the maths test.",
    "My mum texted me this morning and I've been distracted all day. She said something about moving to a new house.",
    "I thought we already finished this topic? I remember something about it but I might be mixing it up with something else.",
    "I keep thinking about the game last night. We lost in the last two minutes, it was so unfair.",
    "Can I just say — the air conditioning in this room is really loud. It's been distracting me all lesson.",
    "Umm... {random_topic} is what comes to mind, but I'm not sure if that's related. My mind keeps wandering today.",
    "I was going to say something but I completely forgot what it was. That keeps happening to me lately.",
    "Wait, are we getting homework today? Because I have football practice and I don't know how I'll fit it in.",
    "Oh sorry, I was just thinking — do teachers have to do exams? Like do you have tests too?",
    "I wrote something down in my notebook but I can't find the page. Hold on... no, that's from last month.",
    "I honestly thought today was Wednesday. I've been confused about the days all week.",
    "I'm kind of hungry. I didn't eat much at breakfast and it's making it hard to concentrate.",
    "My friend keeps passing me notes and it's really hard to ignore them.",
    "I looked it up on my phone last night but I can't remember what it said now.",
    "That's a bit like {random_topic} right? I'm not totally sure though, I might be thinking of something completely different.",
    "My brain feels really foggy today, I didn't sleep well. Something about my neighbours playing music late.",
    "Oh — I just thought of something funny that happened at break. Is it okay if I share it?",
    "Hmm I feel like I know this but every time I try to think about it, something else pops into my head.",
    "Do we have to memorise this for the exam? Because if not I kind of let it slide.",
    "I was daydreaming about what I'm going to do after school. We're thinking of going to the mall.",
]

# 4b. Starts on-topic then drifts (DSM-5 inattention: fails to sustain attention)
DISTRACTED_DRIFT: list[str] = [
    "So {concept} is something about... I think it involves some kind of process... actually, have you ever noticed how this classroom smells like paint? It's been like that all week.",
    "{concept} is related to — wait, what time is it? I have a dentist appointment after school and I keep forgetting.",
    "I think {concept} has to do with... hmm, I'm losing my train of thought. Did someone just walk into the wrong room?",
    "Right so {concept}... I remember reading something about it but then I started reading about {random_topic} instead and went down a rabbit hole.",
    "I was just thinking about {concept} and then my brain jumped to something totally different. It does that a lot.",
    "Okay so {concept} is... I had this whole explanation in my head and now it's completely gone. Like soap bubbles.",
    "So the main thing about {concept} is that it... sorry, someone's phone is vibrating in this room and it's pulling my attention.",
    "I can kind of explain {concept}. It's like... you know when... actually no, I was going to use an analogy but I forgot it.",
    "{concept}? Yeah I know this! It's... hold on, this reminds me of something from primary school. We did this thing with {random_topic}.",
    "The thing about {concept} is that it connects to a lot of things. Like, I was thinking about it and then I thought about {random_topic} and then I thought about dinner.",
]

RANDOM_TOPICS: list[str] = [
    "dinosaurs", "TikTok trends", "conspiracy theories about the moon",
    "anime", "Minecraft", "football transfers", "a cooking show",
    "a documentary about sharks", "ancient aliens", "chess tournaments",
    "fashion trends", "a podcast about true crime", "a video about optical illusions",
    "basketball statistics", "a weird dream", "celebrity gossip",
    "someone's YouTube channel", "a meme that was going around",
    "a book about space travel", "urban legends", "a video game strategy",
    "baking sourdough bread", "a debate about pineapple on pizza",
]

RANDOM_ACTIVITIES: list[str] = [
    "go to the cinema", "play video games all night",
    "visit my grandparents", "try a new restaurant",
    "go skateboarding", "watch a marathon of films",
    "play basketball", "go to a concert",
    "try to cook a new recipe", "just hang out at the park",
]

# ─────────────────────────────────────────────────────────────────────────────
# 5.  IMPULSIVE RESPONSE BUILDING BLOCKS
#     DSM-5: blurts answers, can't wait to formulate, guesses without thinking
#     High IIV research: very short latency, minimal elaboration
# ─────────────────────────────────────────────────────────────────────────────
IMPULSIVE_RESPONSES: list[str] = [
    # Single-word / very short
    "No idea.", "I don't know.", "Maybe?", "Yes.", "No.", "Umm.",
    "Pass.", "Dunno.", "Not sure.", "Wrong?", "True.", "False.",
    "I forgot.", "Can't remember.", "Nope.", "Yeah.", "What?",
    "Obviously.", "Easy.", "Hard.", "Important?",

    # Blurted guesses
    "Is it {concept}? No wait that doesn't make sense.",
    "Fifty?", "A hundred?", "Zero?", "Always?", "Never?",
    "Because of evolution?", "Something to do with maths?",
    "Is it to do with atoms?", "I think it's like gravity?",
    "The answer is yes, definitely yes.",
    "It's the opposite of what we said before.",
    "Same as last time, isn't it?",
    "Four. Final answer. Four.",
    "That's the thing from chapter three, right?",
    "It's in the notes, I just can't find them.",

    # Interrupting / can't wait
    "Oh! I know, I know! Pick me! It's—wait, I lost it.",
    "The answer is—no, hold on—ugh, it just left my brain.",
    "Can I just say something? Never mind. Actually—no.",
    "I was going to say something really smart and it's gone.",
    "Oh yeah, I know this! It's just, um. Yeah.",
    "Wait wait wait. Is it—no. Actually—hmm.",

    # Minimal effort responses
    "It's just a thing that happens.", "It works somehow.",
    "It's important I guess.", "Science stuff.", "Maths.", "Big topic.",
    "We covered this.", "From the textbook.", "I read it.",
    "Teacher said it in class.", "It was in the slides.",
    "My notes say something about it.", "Something about energy?",
    "Chemistry thing.", "Biology I think.", "History related.",

    # Emotional/frustrated impulsive responses (emotional dysregulation)
    "This is too hard.", "I hate this topic.", "I never get this.",
    "Why do we even need to know this?", "I give up.",
    "This doesn't make sense to me at all.",
    "I've read it three times and still nothing.",
    "Can we just move on?", "I'm bad at this.",
    "My brain doesn't work today.",

    # Confident but wrong/incomplete
    "It's when something gets bigger.", "It's the opposite process.",
    "It happens in cells.", "Something to do with temperature.",
    "It's related to the brain.", "It's a law of physics.",
    "It's like supply and demand but different.",
    "It's about patterns in nature.",
    "Something historical happened and then it changed.",
    "It's a formula. I can't remember which one.",
]

# ─────────────────────────────────────────────────────────────────────────────
# 6.  LATENCY DISTRIBUTIONS  (seconds)
#     Grounded in IIV literature — Focused: 3-15s, Distracted: 12-30s, Impulsive: 0.5-3s
# ─────────────────────────────────────────────────────────────────────────────
def sample_latency(label: str) -> float:
    if label == "Focused":
        # Normal distribution centred on 7s, clipped to [3, 20]
        v = random.gauss(7.0, 2.5)
        return round(max(3.0, min(20.0, v)), 2)
    elif label == "Distracted":
        # Higher mean, higher variance — sometimes very long pauses
        v = random.gauss(18.0, 5.0)
        return round(max(10.0, min(35.0, v)), 2)
    else:  # Impulsive
        # Very fast, sub-3 seconds
        v = random.gauss(1.4, 0.6)
        return round(max(0.3, min(4.0, v)), 2)

# ─────────────────────────────────────────────────────────────────────────────
# 7.  RESPONSE GENERATORS
# ─────────────────────────────────────────────────────────────────────────────
def make_focused_response(concept: str) -> str:
    intro  = random.choice(FOCUSED_INTROS)
    body_t = random.choice(FOCUSED_BODIES)
    aspect = random.choice(FOCUSED_ASPECTS)
    outcome= random.choice(FOCUSED_OUTCOMES)
    close  = random.choice(FOCUSED_CLOSINGS)
    body   = body_t.format(concept=concept, aspect=aspect, outcome=outcome)
    text   = (intro + body + close).strip()

    # Occasionally add a follow-up sentence for variety
    if random.random() < 0.35:
        extras = [
            f" We discussed something similar when studying related topics.",
            f" I remember this from the homework last week.",
            f" There's actually a neat real-world example involving everyday life.",
            f" I think it also connects to what we discussed earlier this term.",
            f" It becomes clearer when you look at concrete examples.",
            f" The textbook explains it slightly differently but the core idea is the same.",
            f" I wrote a whole paragraph on this in my notes.",
        ]
        text += random.choice(extras)
    return text


def make_distracted_response(concept: str) -> str:
    rand_topic    = random.choice(RANDOM_TOPICS)
    rand_activity = random.choice(RANDOM_ACTIVITIES)

    mode = random.choices(["pure", "drift"], weights=[0.65, 0.35])[0]
    if mode == "pure":
        template = random.choice(DISTRACTED_PURE)
        return template.format(
            concept=concept,
            random_topic=rand_topic,
            random_activity=rand_activity,
        ).strip()
    else:
        template = random.choice(DISTRACTED_DRIFT)
        return template.format(
            concept=concept,
            random_topic=rand_topic,
        ).strip()


def make_impulsive_response(concept: str) -> str:
    template = random.choice(IMPULSIVE_RESPONSES)
    return template.format(concept=concept).strip()

# ─────────────────────────────────────────────────────────────────────────────
# 8.  MAIN GENERATION LOOP
# ─────────────────────────────────────────────────────────────────────────────
def generate_dataset(n_per_class: int = 10_000) -> list[dict]:
    labels  = ["Focused", "Distracted", "Impulsive"]
    rows: list[dict] = []
    uid = 1

    domain_names   = list(DOMAINS.keys())
    concept_pool: list[str] = []
    for concepts in DOMAINS.values():
        concept_pool.extend(concepts)

    # Pre-build all (domain, concept, prompt_template) combinations for cycling
    combos: list[tuple[str, str]] = []
    for domain, concepts in DOMAINS.items():
        for concept in concepts:
            for pt in PROMPT_TEMPLATES:
                combos.append((concept, pt))

    random.shuffle(combos)

    for label in labels:
        count = 0
        combo_idx = 0
        while count < n_per_class:
            concept, prompt_tpl = combos[combo_idx % len(combos)]
            combo_idx += 1

            teacher_prompt = prompt_tpl.format(concept=concept)

            if label == "Focused":
                student_response = make_focused_response(concept)
            elif label == "Distracted":
                student_response = make_distracted_response(concept)
            else:
                student_response = make_impulsive_response(concept)

            latency = sample_latency(label)

            rows.append({
                "id":                       uid,
                "teacher_prompt":           teacher_prompt,
                "student_response":         student_response,
                "response_latency_seconds": latency,
                "attention_label":          label,
            })
            uid   += 1
            count += 1

    # Shuffle so classes aren't in blocks
    random.shuffle(rows)
    # Re-assign sequential IDs after shuffle
    for i, row in enumerate(rows, 1):
        row["id"] = i

    return rows


def main():
    parser = argparse.ArgumentParser(description="Generate large synthetic ADHD dataset")
    parser.add_argument("--samples", type=int, default=10_000,
                        help="Samples per class (default 10000 → 30000 total)")
    parser.add_argument("--out", type=str,
                        default=os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_adhd.csv"),
                        help="Output CSV path")
    args = parser.parse_args()

    print(f"Generating {args.samples:,} samples per class ({args.samples * 3:,} total)...")
    rows = generate_dataset(n_per_class=args.samples)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)

    fieldnames = ["id", "teacher_prompt", "student_response",
                  "response_latency_seconds", "attention_label"]

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved {len(rows):,} rows -> {os.path.abspath(args.out)}")

    # Print class distribution
    from collections import Counter
    dist = Counter(r["attention_label"] for r in rows)
    for label, cnt in sorted(dist.items()):
        print(f"  {label:12s}: {cnt:6,}  ({cnt/len(rows)*100:.1f}%)")

    # Print sample
    print("\nSample rows:")
    for row in random.sample(rows, 3):
        print(f"  [{row['attention_label']}] Q: {row['teacher_prompt'][:60]}...")
        print(f"           A: {row['student_response'][:80]}...")
        print(f"           Latency: {row['response_latency_seconds']}s\n")


if __name__ == "__main__":
    main()
