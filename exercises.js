// The exercise library. Edit this file to add, remove, or change exercises.
//
// Fields:
//   id           unique, stable, no spaces. Logged history refers to this, so don't rename it later.
//   name         what the user sees
//   category     any label you like (used as a tag on the card)
//   description  how to do it — shown as the guide text
//   progressions OPTIONAL. Ordered easiest -> hardest: [{ name, note }, ...].
//                The first entry is the starting level and should match `name`.
//                `note` is the change from the base exercise, shown under the description.
//                Any number of levels works. The user's current level per exercise is
//                stored separately, and each logged block records which level was done,
//                so adding levels later doesn't break existing history.
//   suggestions  OPTIONAL. Ideas for what could come after the top level. When someone
//                reaches the top and asks for more, these are included in the request email.

const EXERCISES = [
  {
    id: "glute-bridge-hold",
    name: "Glute bridge isometric hold",
    category: "Glutes",
    description: "Lie on your back, knees bent, feet flat. Lift your hips until your body forms a straight line from shoulders to knees, squeeze your glutes, and hold. Breathe steadily; don't arch your low back.",
    progressions: [
      { name: "Glute bridge isometric hold" },
      { name: "Glute bridge hold with band", note: "Loop a band above your knees and press your knees out against it while you hold." },
      { name: "Weighted glute bridge hold", note: "Rest a dumbbell or weight across your hips and hold." },
    ],
    suggestions: ["Hip thrust hold with upper back on a bench", "Single leg glute bridge hold"],
  },
  {
    id: "single-leg-glute-bridge",
    name: "Single leg glute bridge",
    category: "Glutes",
    description: "Lie on your back, one foot flat and the other leg extended or held up. Drive through the planted heel to lift your hips, keeping them level. Lower slowly, then switch sides.",
    progressions: [
      { name: "Single leg glute bridge" },
      { name: "Single leg glute bridge with pause", note: "Hold for 3 seconds at the top of every rep." },
      { name: "Weighted single leg glute bridge", note: "Rest a dumbbell or weight across your hips." },
    ],
    suggestions: ["Single leg hip thrust with upper back on a bench", "Feet-elevated single leg glute bridge"],
  },
  {
    id: "clamshells-band",
    name: "Clamshells with band",
    category: "Hips",
    description: "Lie on your side, knees bent, band just above your knees. Keep your feet together and open the top knee like a clam without rolling your hips back. Lower slowly, then switch sides.",
    progressions: [
      { name: "Clamshells with band" },
      { name: "Clamshells with stronger band", note: "Use the next band up in resistance." },
      { name: "Clamshells with stronger band and pause", note: "Hold 3 seconds at the top and take 3 seconds to lower." },
    ],
    suggestions: ["Clamshells from a side plank (knees down)", "Clamshells with band and feet lifted off the floor"],
  },
  {
    id: "side-lying-hip-abduction-band",
    name: "Side lying hip abduction with band",
    category: "Hips",
    description: "Lie on your side with a band around your thighs or ankles, bottom leg bent for balance. Lift the top leg straight up and slightly back, toes forward, then lower with control. Switch sides.",
    progressions: [
      { name: "Side lying hip abduction with band" },
      { name: "Side lying hip abduction with stronger band", note: "Use the next band up in resistance." },
      { name: "Side lying hip abduction with stronger band and pause", note: "Hold 3 seconds at the top and take 3 seconds to lower." },
    ],
    suggestions: ["Banded lateral walks", "Side plank with top leg lifts"],
  },
  {
    id: "hip-hinge",
    name: "Standing hip hinge",
    category: "Hamstrings",
    description: "Stand with feet hip-width apart and a soft bend in the knees. Push your hips straight back while your chest tips forward and your back stays flat. Stand tall by driving your hips forward.",
    progressions: [
      { name: "Standing hip hinge" },
      { name: "Weighted hip hinge", note: "Hold a dumbbell or kettlebell against your chest." },
      { name: "Dumbbell Romanian deadlift", note: "Hold a dumbbell in each hand and slide them down your thighs as you hinge." },
      { name: "Kettlebell swing", note: "Hinge back and let the kettlebell swing between your legs, then snap your hips forward to send it to chest height with straight arms. Your hips drive it, not your arms." },
    ],
    suggestions: ["Heavier kettlebell swings", "Single arm kettlebell swings"],
  },
  {
    id: "wall-sit",
    name: "Wall sit",
    category: "Legs",
    description: "Lean your back against a wall and slide down until your knees are around 90 degrees, directly over your ankles. Hold, breathing steadily, with your weight through your heels.",
    progressions: [
      { name: "Wall sit" },
      { name: "Weighted wall sit", note: "Hold a dumbbell or weight at your chest." },
      { name: "Wall sit with alternating leg lifts", note: "While holding, briefly lift one foot off the floor, then switch." },
    ],
    suggestions: ["Single leg wall sit", "Weighted wall sit with alternating leg lifts"],
  },
  {
    id: "step-ups",
    name: "Step ups",
    category: "Legs",
    description: "Place one foot fully on a sturdy step. Press through that heel to stand up, then lower back down slowly. Complete your reps on one side, then switch.",
    progressions: [
      { name: "Step ups" },
      { name: "Higher step ups", note: "Use a taller step, so your knee is above hip height at the bottom." },
      { name: "Weighted step ups", note: "Hold a dumbbell in each hand while you step." },
    ],
    suggestions: ["Step ups with a knee drive and a balance hold at the top", "Bulgarian split squats"],
  },
  {
    id: "farmer-carries",
    name: "Farmer carries",
    category: "Full body",
    description: "Hold a weight in each hand at your sides. Stand tall, shoulders back, core braced, and walk with steady steps. Turn around and come back.",
    progressions: [
      { name: "Farmer carries" },
      { name: "Heavier farmer carries", note: "Use heavier weights, as long as you can keep standing tall." },
      { name: "Suitcase carries", note: "Carry one heavy weight in a single hand and don't let your torso lean. Switch hands." },
    ],
    suggestions: ["Heavier suitcase carries", "Front rack kettlebell carries"],
  },
  {
    id: "single-leg-rdl",
    name: "Single leg RDL",
    category: "Hamstrings",
    description: "Stand on one leg with a soft knee. Hinge at the hip, extending the other leg behind you as your chest lowers, back flat. Return to standing by driving the hip forward. Switch sides.",
    progressions: [
      { name: "Single leg RDL" },
      { name: "Single leg RDL with weight", note: "Hold a light dumbbell in the hand opposite your standing leg." },
      { name: "Single leg RDL with heavier weight", note: "Use a heavier dumbbell and take 3 seconds to lower." },
    ],
    suggestions: ["Single leg RDL holding a weight in each hand", "Single leg RDL standing on a low step (deficit)"],
  },
  {
    id: "hamstring-curl-band",
    name: "Hamstring curl with band",
    category: "Hamstrings",
    description: "Anchor a band and loop it around your ankle. Keeping your thighs still, bend your knee to bring your heel toward your glutes, then return slowly. Switch legs.",
    progressions: [
      { name: "Hamstring curl with band" },
      { name: "Hamstring curl with stronger band", note: "Use the next band up in resistance." },
      { name: "Hamstring curl with stronger band and slow return", note: "Take 3 seconds to return to the start on every rep." },
    ],
    suggestions: ["Slider or towel hamstring curls from a glute bridge", "Assisted Nordic hamstring curls"],
  },
  {
    id: "fire-hydrants-band",
    name: "Fire hydrants with band",
    category: "Hips",
    description: "On hands and knees with a band above your knees. Keeping your knee bent, lift one leg out to the side without twisting your torso, then lower with control. Switch sides.",
    progressions: [
      { name: "Fire hydrants with band" },
      { name: "Fire hydrants with stronger band", note: "Use the next band up in resistance." },
      { name: "Fire hydrants with stronger band and pause", note: "Hold 3 seconds at the top of each rep." },
    ],
    suggestions: ["Fire hydrants with band and an ankle weight", "Fire hydrant into donkey kick combo with band"],
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    category: "Core",
    description: "Lie on your back, arms up and knees bent over your hips. Keep your low back pressed into the floor and slowly lower the opposite arm and leg. Return and alternate sides.",
    progressions: [
      { name: "Dead bug" },
      { name: "Straight-leg dead bug", note: "Keep your legs straighter as you lower them, only as far as your low back stays flat." },
      { name: "Weighted dead bug", note: "Hold a light dumbbell or weight in both hands, arms straight up." },
    ],
    suggestions: ["Straight-leg weighted dead bug", "Hollow body hold"],
  },
  {
    id: "kettlebell-march",
    name: "Kettlebell march",
    category: "Full body",
    description: "Hold a kettlebell at your chest with both hands. Stand tall and march in place, lifting each knee to about hip height without leaning back. Keep your core braced and your pace steady.",
    progressions: [
      { name: "Kettlebell march" },
      { name: "Heavier kettlebell march", note: "Use a heavier kettlebell, as long as you can keep standing tall." },
      { name: "Single arm kettlebell march", note: "Hold one kettlebell in one hand at your side and don't let your torso lean. Switch hands halfway." },
    ],
    suggestions: ["Single arm kettlebell march with a heavier weight", "Kettlebell march with a 2-second balance hold at the top of each knee lift"],
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    category: "Legs",
    description: "Hold a kettlebell or dumbbell against your chest with both hands. Feet shoulder-width apart, sit your hips back and down with your chest tall, then stand by driving through your heels.",
    progressions: [
      { name: "Goblet squat" },
      { name: "Heavier goblet squat", note: "Use a heavier weight, as long as your chest stays tall and your heels stay down." },
      { name: "Goblet squat with pause", note: "Pause for 3 seconds at the bottom of every rep." },
    ],
    suggestions: ["Goblet Bulgarian split squats", "Front squats with two kettlebells"],
  },
  {
    id: "band-anti-rotation-mini-squat",
    name: "Pallof press with mini squats",
    category: "Core",
    description: "Stand sideways to a band anchored at chest height, holding it in both hands at your chest. Let the band pull sideways while you resist, keeping your shoulders and hips square. Do short squats while holding that position. Switch sides.",
    progressions: [
      { name: "Pallof press with mini squats" },
      { name: "Pallof press with mini squats, more tension", note: "Use a stronger band, or step farther from the anchor to increase the pull." },
      { name: "Pallof press with mini squats, staggered stance", note: "Stand with one foot in front of the other, so the sideways pull is harder to resist." },
    ],
    suggestions: ["Half-kneeling Pallof press", "Pallof press with reverse lunges"],
  },
];
