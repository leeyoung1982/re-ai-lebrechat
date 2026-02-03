/**
 * Resolves the icon URL for an endpoint based on its properties.
 * This function provides a centralized mapping from endpoint characteristics to icon URLs.
 *
 * Priority order for detection:
 * 1. endpoint.name (string)
 * 2. endpoint.models?.default (array of strings, first item)
 * 3. endpoint.baseURL (string)
 *
 * @param endpoint - The endpoint object with name, models, and baseURL properties
 * @returns The icon URL path (e.g., /assets/openai.svg) or null if no match
 */
export function resolveEndpointIconURL(endpoint: {
  name?: string;
  models?: { default?: string[] | string };
  baseURL?: string;
}): string | null {
  // Collect all relevant fields for pattern matching
  const searchFields: string[] = [];

  // Add name
  if (endpoint.name) {
    searchFields.push(endpoint.name);
  }

  // Add models (handle both array and string formats)
  if (endpoint.models?.default) {
    if (Array.isArray(endpoint.models.default)) {
      searchFields.push(...endpoint.models.default);
    } else if (typeof endpoint.models.default === 'string') {
      searchFields.push(endpoint.models.default);
    }
  }

  // Add baseURL
  if (endpoint.baseURL) {
    searchFields.push(endpoint.baseURL);
  }

  // Combine all fields into a searchable string
  const searchString = searchFields.join(' ').toLowerCase();

  if (!searchString) {
    return null;
  }

  // Pattern matching in priority order
  // AI Radio LLM 选荐 / re-AI-Radio / propose
  if (
    searchString.includes('ai radio llm') ||
    searchString.includes('ai radio') ||
    searchString.includes('re-ai-radio') ||
    searchString.includes('propose') ||
    searchFields.some((field) => field.includes('AI Radio LLM'))
  ) {
    return '/assets/brand/new-icon.svg';
  }

  // OpenAI/ChatGPT/gpt-
  if (
    searchString.includes('openai') ||
    searchString.includes('chatgpt') ||
    searchString.includes('gpt-')
  ) {
    return '/assets/openai.svg';
  }

  // Gemini/Google/gemini-
  if (
    searchString.includes('gemini') ||
    searchString.includes('google') ||
    searchString.includes('gemini-')
  ) {
    return '/assets/google.svg';
  }

  // Anthropic/Claude/claude-
  if (
    searchString.includes('anthropic') ||
    searchString.includes('claude') ||
    searchString.includes('claude-')
  ) {
    return '/assets/anthropic.svg';
  }

  // xAI/Grok/grok-
  if (searchString.includes('xai') || searchString.includes('grok')) {
    return '/assets/xai.svg';
  }

  // DeepSeek/deepseek-
  if (searchString.includes('deepseek')) {
    return '/assets/deepseek.svg';
  }

  // DOUBAO/doubao-/ark-/volces (also check Chinese name)
  if (
    searchString.includes('doubao') ||
    searchString.includes('ark-') ||
    searchString.includes('volces') ||
    searchFields.some((field) => field.includes('豆包'))
  ) {
    return '/assets/doubao.svg';
  }

  // Moonshot/Kimi/moonshot-/kimi- (also check Chinese name)
  if (
    searchString.includes('moonshot') ||
    searchString.includes('kimi') ||
    searchFields.some((field) => field.includes('月之暗面'))
  ) {
    return '/assets/moonshot.svg';
  }

  return null;
}
