"""
Synthetic ADHD Educational Interaction Dataset Generator
Produces 500 labelled samples: Focused / Distracted / Impulsive
Output: data/raw/synthetic_adhd.csv
"""

import os
import random
import csv
from dataclasses import dataclass, fields, astuple

# ---------------------------------------------------------------------------
# Seed for reproducibility
# ---------------------------------------------------------------------------
SEED = 42
random.seed(SEED)

N_SAMPLES   = 500
LABEL_DIST  = {"Focused": 0.34, "Distracted": 0.33, "Impulsive": 0.33}

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "synthetic_adhd.csv")

# ---------------------------------------------------------------------------
# Prompt bank  (classroom / tutoring context)
# ---------------------------------------------------------------------------
TEACHER_PROMPTS = [
    "Can you tell me what the main cause of World War I was?",
    "What is the formula for calculating the area of a circle?",
    "Can you summarise the water cycle in your own words?",
    "What does photosynthesis mean?",
    "How do you solve a two-step equation?",
    "What was the significance of the Industrial Revolution?",
    "Can you explain what a metaphor is and give me an example?",
    "What are the three branches of government?",
    "How does gravity affect the motion of planets?",
    "What is the difference between a simile and a metaphor?",
    "Can you describe what happens during mitosis?",
    "What do you know about the Civil Rights Movement?",
    "How do we find the greatest common factor of two numbers?",
    "Can you explain Newton's first law of motion?",
    "What is the significance of the Magna Carta?",
    "Describe the process of erosion in your own words.",
    "What are the properties of a parallelogram?",
    "Can you name the layers of the Earth?",
    "What is the difference between weather and climate?",
    "How does the human digestive system work?",
    "What is osmosis?",
    "Can you explain what a prime number is?",
    "What caused the fall of the Roman Empire?",
    "How do vaccines work?",
    "What is the role of the mitochondria in a cell?",
    "Describe the plot of the story we read yesterday.",
    "What is the Pythagorean theorem?",
    "Can you explain what a food chain is?",
    "What is the difference between conduction and convection?",
    "How does democracy differ from monarchy?",
]

# ---------------------------------------------------------------------------
# Response banks per label
# ---------------------------------------------------------------------------

FOCUSED_RESPONSES = [
    "World War I was mainly caused by a combination of nationalism, imperialism, militarism, and the alliance system, triggered by the assassination of Archduke Franz Ferdinand.",
    "The area of a circle is calculated using the formula A equals pi times r squared, where r is the radius.",
    "The water cycle involves evaporation of water from oceans, condensation into clouds, and precipitation back to Earth as rain or snow.",
    "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of glucose.",
    "To solve a two-step equation, I first isolate the variable by undoing addition or subtraction, then deal with multiplication or division.",
    "The Industrial Revolution transformed society by shifting from agricultural economies to industrial manufacturing, leading to urbanisation and new labour systems.",
    "A metaphor is a figure of speech that describes something by saying it is something else. For example, saying 'life is a journey' is a metaphor.",
    "The three branches of government are the legislative branch, which makes laws, the executive branch, which enforces laws, and the judicial branch, which interprets laws.",
    "Gravity causes planets to follow elliptical orbits around the Sun because the Sun's gravitational pull continuously curves their path.",
    "A simile uses 'like' or 'as' to compare two things, while a metaphor states one thing is another without those connecting words.",
    "During mitosis, the cell duplicates its chromosomes and then divides into two identical daughter cells through phases called prophase, metaphase, anaphase, and telophase.",
    "The Civil Rights Movement was a struggle for racial equality in the United States, led by figures like Martin Luther King Jr., fighting against segregation and discrimination.",
    "To find the greatest common factor, I list the factors of each number and then identify the largest factor they share.",
    "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.",
    "The Magna Carta was significant because it limited the power of the king and established that everyone, including rulers, was subject to the law.",
    "Erosion is the process where wind, water, or ice gradually wears away and transports rock and soil from one place to another.",
    "A parallelogram has two pairs of parallel sides, opposite sides that are equal in length, and opposite angles that are equal.",
    "The Earth has four main layers: the inner core, outer core, mantle, and crust.",
    "Weather refers to short-term atmospheric conditions, while climate describes the long-term average weather patterns of a region.",
    "The digestive system breaks down food through mechanical and chemical processes starting in the mouth, continuing through the stomach, and nutrients are absorbed in the small intestine.",
    "Osmosis is the movement of water molecules through a semi-permeable membrane from an area of lower solute concentration to higher solute concentration.",
    "A prime number is a number greater than one that has no positive divisors other than one and itself, like 2, 3, 5, 7, and 11.",
    "The fall of the Roman Empire was caused by military pressures from barbarian invasions, economic troubles, political instability, and the overextension of the empire.",
    "Vaccines work by introducing a weakened or inactive form of a pathogen, training the immune system to recognise and fight the real disease in the future.",
    "The mitochondria is the powerhouse of the cell, responsible for producing ATP through cellular respiration to fuel all cell activities.",
    "The story followed a young girl who discovered a hidden garden and slowly brought it back to life, which paralleled her own emotional healing.",
    "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides, or a squared plus b squared equals c squared.",
    "A food chain shows how energy passes from one organism to another, starting with a producer like a plant and moving through herbivores and carnivores.",
    "Conduction transfers heat through direct contact between objects, while convection transfers heat through the movement of fluids or gases.",
    "Democracy gives power to the people through elected representatives, while in a monarchy, power is held by a single ruler who usually inherits the position.",
]

DISTRACTED_RESPONSES = [
    "I think it was something about an assassination... oh, speaking of which, did you watch that new documentary? It was really good. Anyway, there were some countries involved.",
    "I know it has pi in it... my older brother is studying engineering and he uses pi a lot. Wait, is pi 3.14 or something? I think it's a circle thing.",
    "Water goes up and then it comes back down. Oh wait, is this the same as what we did in science class? I was thinking about the experiment with the cups.",
    "Plants make their own food, right? I was wondering, do cacti also do photosynthesis? Because they are in the desert. And I saw a cactus once on a trip.",
    "You add something and then divide maybe? I forgot what we did yesterday because I was thinking about lunch. Can we use a calculator for this?",
    "There were lots of factories and smoke and stuff. My grandmother talks about how things used to be made by hand. She knits sweaters, did I mention that?",
    "A metaphor is like... a comparison? I think? We did this last week and I had it written down but I left my notebook at home today.",
    "There's a president and some other parts. Oh wait, is this about America? Because I was thinking about how I want to visit Washington D.C. someday.",
    "Gravity pulls things down, right? I always think about the moon when we talk about gravity. Also, is it true astronauts float in space because of gravity?",
    "Similes use 'like' I think... or is it 'as'? Metaphors are different. Wait, which one is 'her smile was like sunshine'? I can never remember the difference.",
    "The cell splits and makes copies... I think. Is mitosis the same as meiosis? I always mix those two up. Also, when does meiosis happen again?",
    "It was in America and there were marches and Martin Luther King, and I watched a video about it once. There was a bus thing too, I think.",
    "You find numbers that both go into... I think? I remember doing factor trees but then I get confused. Can we do an example? I like when we do examples.",
    "An object stays still unless something pushes it? I was thinking, is this why cars need engines? Because otherwise they just stay parked forever?",
    "It was a really old document. It had something to do with rights. I was thinking about how old paper gets all yellow, like the documents in museums.",
    "Water moves rocks around and stuff like that. Oh, is this why the Grand Canyon exists? I saw pictures of it and it looked incredible. I want to go there.",
    "It has parallel sides... I think four sides. Wait, is a rectangle a parallelogram? I always get confused between all the different quadrilateral names.",
    "There's the crust where we live, and then there's the core which is really hot. I was wondering, could you dig to the centre of the Earth theoretically?",
    "Weather changes every day like rain and sun. Climate is more... permanent? My mum was saying the weather has been strange lately. Is that climate change?",
    "Food goes in your mouth and gets broken down. I was thinking about how weird it is that we eat every day. What did people do before farms existed?",
    "Water goes through a membrane? I think we did an experiment. Oh wait, that was with the egg in vinegar. Was that osmosis or something different?",
    "Prime numbers are special numbers that can only be divided by themselves and one. Is one a prime number? I always forget. Also is zero a number or not?",
    "Too many invaders came I think. And it was very big. Empires that are too big fall apart, right? Like, how big was the Roman Empire actually?",
    "Vaccines have something that fights the disease. My mum made me get a flu shot last year and I really didn't want to go. But I didn't get flu so maybe it worked.",
    "Mitochondria produces energy. Oh, is that the powerhouse of the cell thing? I saw that as a meme once. It's funny that a meme taught me biology.",
    "There was a character who found something and it changed things. I don't remember all of it. I was kind of distracted during the reading part. Can you remind me?",
    "It's something with triangles. A squared plus B squared... I think. We used this last month. Can you draw it on the board? I understand better with pictures.",
    "Animals eat other animals? And plants are at the bottom? Oh, are humans at the top? What would be above humans in a food chain if something existed?",
    "Conduction is when things touch, right? Convection I'm less sure. Is that why the sea breeze happens at the beach? I love the beach actually.",
    "Democracy means voting. A monarchy has a king or queen. Britain has both I think? That's confusing. Does the queen actually make laws in Britain?",
]

IMPULSIVE_RESPONSES = [
    "The assassination!",
    "Pi r squared!",
    "Rain!",
    "Sunlight makes food!",
    "Add then divide!",
    "Factories!",
    "It's a comparison!",
    "President, Congress, judges!",
    "It pulls things!",
    "Simile has 'like'!",
    "The cell splits!",
    "Marches and protests!",
    "Common factors!",
    "Objects stay put!",
    "It gave people rights!",
    "Wind and water move rocks!",
    "It has parallel sides!",
    "Crust, mantle, core, inner core!",
    "Weather is short, climate is long!",
    "Breaks down food!",
    "Water through a membrane!",
    "Only divisible by one and itself!",
    "Too many invaders!",
    "Trains your immune system!",
    "Energy production!",
    "A garden and a girl!",
    "A squared plus B squared equals C squared!",
    "Producers and consumers!",
    "Contact versus movement!",
    "People vote in democracy!",
    "Oh I know this! It's about the war!",
    "I know! I know! Pick me! Something with pi!",
    "Water goes up! Water comes down!",
    "Plants eat sun!",
    "You just solve it!",
    "Machines replaced people!",
    "Saying something IS something else!",
    "Executive! Legislative! Judicial! Done!",
    "Keeps planets going round!",
    "Like and as — that's simile!",
    "Duplicate chromosomes!",
    "Rosa Parks! MLK! Equality!",
    "Biggest number both share!",
    "Stays still unless pushed — inertia!",
    "Limited the king's power!",
    "Weathering and transporting material!",
    "Four sides, parallel, equal angles!",
    "Four layers!",
    "Short term versus long term!",
    "Stomach breaks it down!",
]

# ---------------------------------------------------------------------------
# Latency distributions (seconds) per label
# ---------------------------------------------------------------------------

def latency_focused() -> float:
    """Measured, deliberate — 3 to 12 seconds."""
    return round(random.uniform(3.0, 12.0), 2)

def latency_distracted() -> float:
    """Slow to start, often pauses — 8 to 25 seconds."""
    return round(random.uniform(8.0, 25.0), 2)

def latency_impulsive() -> float:
    """Blurts out immediately — 0.5 to 3 seconds."""
    return round(random.uniform(0.5, 3.0), 2)

LATENCY_FN = {
    "Focused":     latency_focused,
    "Distracted":  latency_distracted,
    "Impulsive":   latency_impulsive,
}

RESPONSE_BANK = {
    "Focused":    FOCUSED_RESPONSES,
    "Distracted": DISTRACTED_RESPONSES,
    "Impulsive":  IMPULSIVE_RESPONSES,
}

# ---------------------------------------------------------------------------
# Sample dataclass
# ---------------------------------------------------------------------------

@dataclass
class Sample:
    id: int
    teacher_prompt: str
    student_response: str
    response_latency_seconds: float
    attention_label: str

# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------

def _build_label_sequence(n: int, dist: dict) -> list[str]:
    """Build a shuffled label list honouring the target distribution."""
    counts = {label: round(n * frac) for label, frac in dist.items()}
    # Adjust rounding drift so total == n
    diff = n - sum(counts.values())
    counts[max(counts, key=counts.get)] += diff
    labels = []
    for label, count in counts.items():
        labels.extend([label] * count)
    random.shuffle(labels)
    return labels


def generate(n: int = N_SAMPLES) -> list[Sample]:
    """
    Generate samples with aligned prompt-response pairs.

    Each response bank entry at index k was written to answer TEACHER_PROMPTS[k].
    We pick a random k and use TEACHER_PROMPTS[k] + RESPONSE_BANK[label][k],
    ensuring semantic coherence between prompt and response.
    Impulsive/Distracted responses intentionally drift from the topic by
    construction, so topic_shift_score will correctly separate the classes.
    """
    labels      = _build_label_sequence(n, LABEL_DIST)
    n_prompts   = len(TEACHER_PROMPTS)   # 30 aligned pairs
    samples     = []

    for i, label in enumerate(labels, start=1):
        # Pick a topic index — same index used for prompt and all three response banks
        topic_idx = random.randrange(n_prompts)
        bank      = RESPONSE_BANK[label]

        # Use aligned response if bank is long enough, else wrap around
        response  = bank[topic_idx % len(bank)]
        prompt    = TEACHER_PROMPTS[topic_idx]
        latency   = LATENCY_FN[label]()

        samples.append(Sample(
            id=i,
            teacher_prompt=prompt,
            student_response=response,
            response_latency_seconds=latency,
            attention_label=label,
        ))
    return samples

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def save_csv(samples: list[Sample], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([field.name for field in fields(Sample)])
        for s in samples:
            writer.writerow(astuple(s))
    print(f"[save] {len(samples)} samples -> {os.path.abspath(path)}")

# ---------------------------------------------------------------------------
# Statistics & preview
# ---------------------------------------------------------------------------

def print_statistics(samples: list[Sample]) -> None:
    from collections import Counter

    label_counts = Counter(s.attention_label for s in samples)
    total = len(samples)

    latency_by_label: dict[str, list[float]] = {}
    for s in samples:
        latency_by_label.setdefault(s.attention_label, []).append(s.response_latency_seconds)

    print("\n" + "=" * 60)
    print("  DATASET STATISTICS")
    print("=" * 60)
    print(f"  Total samples : {total}")
    print()
    print(f"  {'Label':<14} {'Count':>6}  {'%':>6}  {'Avg latency (s)':>17}  {'Min':>6}  {'Max':>6}")
    print(f"  {'-'*14}  {'-'*6}  {'-'*6}  {'-'*17}  {'-'*6}  {'-'*6}")
    for label in ("Focused", "Distracted", "Impulsive"):
        count   = label_counts[label]
        pct     = count / total * 100
        lats    = latency_by_label[label]
        avg_lat = sum(lats) / len(lats)
        min_lat = min(lats)
        max_lat = max(lats)
        print(f"  {label:<14}  {count:>6}  {pct:>5.1f}%  {avg_lat:>17.2f}  {min_lat:>6.2f}  {max_lat:>6.2f}")
    print()

    # Response length stats
    print(f"  {'Label':<14}  {'Avg response length (chars)':>30}")
    print(f"  {'-'*14}  {'-'*30}")
    for label in ("Focused", "Distracted", "Impulsive"):
        lengths = [len(s.student_response) for s in samples if s.attention_label == label]
        avg_len = sum(lengths) / len(lengths)
        print(f"  {label:<14}  {avg_len:>30.1f}")
    print("=" * 60)


def print_preview(samples: list[Sample], n: int = 3) -> None:
    print("\n" + "=" * 60)
    print("  SAMPLE PREVIEW (one per label)")
    print("=" * 60)
    seen = set()
    for s in samples:
        if s.attention_label not in seen:
            seen.add(s.attention_label)
            print(f"\n  ID              : {s.id}")
            print(f"  Label           : {s.attention_label}")
            print(f"  Latency (s)     : {s.response_latency_seconds}")
            print(f"  Teacher prompt  : {s.teacher_prompt}")
            print(f"  Student response: {s.student_response}")
            print(f"  {'-'*56}")
        if len(seen) == n:
            break
    print()

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Generating synthetic ADHD educational interaction dataset...")
    samples = generate(N_SAMPLES)
    save_csv(samples, OUTPUT_PATH)
    print_statistics(samples)
    print_preview(samples)
    print("Done.")
