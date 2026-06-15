export type PriceModel = {
  provider: string;
  model: string;
  inputPricePer1M: number;
  cachedInputPricePer1M: number;
  outputPricePer1M: number;
  reasoningOutputPricePer1M: number | null;
  effectiveFrom: string;
};

export type EstimateInput = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
};

export type CostEstimate = {
  costUsd: number | null;
  costSource: 'estimated' | 'unknown_model';
};

export function estimateCost(model: PriceModel | null, usage: EstimateInput): CostEstimate {
  if (!model) {
    return {
      costUsd: null,
      costSource: 'unknown_model',
    };
  }

  const reasoningTokens = Math.min(usage.reasoningOutputTokens, usage.outputTokens);
  const nonReasoningOutputTokens = Math.max(usage.outputTokens - reasoningTokens, 0);

  const inputCost = (usage.inputTokens / 1_000_000) * model.inputPricePer1M;
  const cachedInputCost = (usage.cachedInputTokens / 1_000_000) * model.cachedInputPricePer1M;
  const outputCost = (nonReasoningOutputTokens / 1_000_000) * model.outputPricePer1M;

  const reasoningCost =
    model.reasoningOutputPricePer1M === null
      ? (reasoningTokens / 1_000_000) * model.outputPricePer1M
      : (reasoningTokens / 1_000_000) * model.reasoningOutputPricePer1M;

  return {
    costUsd: inputCost + cachedInputCost + outputCost + reasoningCost,
    costSource: 'estimated',
  };
}
