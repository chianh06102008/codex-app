// Fake price-check data.
//
// Everything the app knows about "is this price fair?" comes from the
// `checkPrice` function below. Right now it returns hard-coded data.
// Later, a teammate can replace the body of `checkPrice` with a real AI call
// (send the photo, get back JSON in the same shape) and no screen needs to change.

// How expensive the quoted price is compared to the fair range.
export type Verdict = 'normal' | 'slightly_high' | 'high';

// The shape of one price-check result. A real API should return this same shape.
export type PriceCheckResult = {
  item: string; // name of the item or dish, e.g. "Phở bò"
  quoted_price: number; // price the seller asked for, in VND
  fair_range: [number, number]; // [lowest, highest] typical price, in VND
  verdict: Verdict;
  explanation: string; // short, plain-English reason for the verdict
};

// The fake result we always return for now.
export const FAKE_RESULT: PriceCheckResult = {
  item: 'Phở bò',
  quoted_price: 120000,
  fair_range: [40000, 70000],
  verdict: 'high',
  explanation:
    'A bowl of beef phở usually costs 40,000–70,000 VND at street stalls and local restaurants. ' +
    '120,000 VND is unusually high unless it is a large special bowl or a restaurant in a tourist area.',
};

// "Analyze" a photo and return a price-check result.
// `photoUri` is unused for now, but a real implementation will upload it.
export async function checkPrice(photoUri: string): Promise<PriceCheckResult> {
  // Pretend we are waiting for a server, so the loading state is visible.
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return FAKE_RESULT;
}
