// Fake "AI" that looks at a photo of a flooded street.
//
// The app gets its photo analysis ONLY from `analyzeFloodPhoto` below.
// Right now it picks a made-up result. Later, a teammate can replace the body
// with a real AI call (upload the photo, get back JSON in the same shape),
// and no screen needs to change.

// How deep the water is, compared to a motorbike wheel.
export type DepthLevel = 'ankle' | 'half_wheel' | 'above_wheel';

// Can a motorbike get through?
export type Passable = 'yes' | 'risky' | 'no';

// The shape of one analysis. A real AI call should return this same shape.
export type FloodAnalysis = {
  street: string; // e.g. "Nguyễn Trãi"
  depth_level: DepthLevel;
  depth_cm: number; // estimated water depth in centimeters
  passable: Passable;
  confidence: number; // 0 to 1, how sure the AI is
  tip: string; // a short safety tip for the rider
};

// A few possible results. We pick one at random so the demo looks different each time.
const FAKE_RESULTS: Omit<FloodAnalysis, 'street'>[] = [
  {
    depth_level: 'ankle',
    depth_cm: 10,
    passable: 'yes',
    confidence: 0.85,
    tip: 'Shallow water. Ride slowly and keep a steady speed so you do not splash others.',
  },
  {
    depth_level: 'half_wheel',
    depth_cm: 25,
    passable: 'risky',
    confidence: 0.7,
    tip: 'Water may reach the exhaust. Keep the engine running in low gear and do not stop in the middle.',
  },
  {
    depth_level: 'above_wheel',
    depth_cm: 45,
    passable: 'no',
    confidence: 0.8,
    tip: 'Too deep. The engine can stall and hidden holes are dangerous. Turn around and find another route.',
  },
];

// Some streets in Hanoi that often flood.
const FAKE_STREETS = ['Nguyễn Trãi', 'Trường Chinh', 'Láng', 'Giải Phóng', 'Nguyễn Xiển', 'Phạm Văn Đồng'];

// "Analyze" a photo. `photoUri` is unused for now, but a real implementation will upload it.
export async function analyzeFloodPhoto(photoUri: string): Promise<FloodAnalysis> {
  // Pretend the AI is thinking, so the loading state is visible.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  return { street: pick(FAKE_STREETS), ...pick(FAKE_RESULTS) };
}
