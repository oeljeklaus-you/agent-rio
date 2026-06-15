export type PriceModelSeed = {
  provider: string;
  model: string;
  inputPricePer1M: number;
  cachedInputPricePer1M: number;
  outputPricePer1M: number;
  reasoningOutputPricePer1M: number | null;
  effectiveFrom: string;
};

// Prices are intentionally isolated here so they can be updated without changing business logic.
// The default values reflect the official OpenAI API pricing page during implementation.
export const PRICE_MODEL_SEEDS: PriceModelSeed[] = [
  {
    provider: 'openai',
    model: 'gpt-5.4',
    inputPricePer1M: 2.5,
    cachedInputPricePer1M: 0.25,
    outputPricePer1M: 15,
    reasoningOutputPricePer1M: null,
    effectiveFrom: '2026-06-15',
  },
  {
    provider: 'openai',
    model: 'gpt-5.4-mini',
    inputPricePer1M: 0.75,
    cachedInputPricePer1M: 0.075,
    outputPricePer1M: 4.5,
    reasoningOutputPricePer1M: null,
    effectiveFrom: '2026-06-15',
  },
];
