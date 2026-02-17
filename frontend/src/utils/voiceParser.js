// Lightweight parser that turns natural language voice commands
// into structured expense fields (amount, category, title).
// Example: "add 500 rupees food expense for group Goa Trip"

const CATEGORY_KEYWORDS = [
  { category: 'Food', keywords: ['food', 'dinner', 'lunch', 'breakfast', 'meal', 'restaurant'] },
  { category: 'Travel', keywords: ['travel', 'taxi', 'uber', 'ola', 'cab', 'bus', 'train', 'flight', 'ticket'] },
  { category: 'Rent', keywords: ['rent', 'room', 'apartment'] },
  { category: 'Shopping', keywords: ['shopping', 'amazon', 'flipkart', 'mall', 'clothes', 'electronics'] },
  { category: 'Entertainment', keywords: ['movie', 'netflix', 'party', 'entertainment', 'music'] },
  { category: 'Groceries', keywords: ['grocery', 'groceries', 'supermarket'] },
];

function extractAmount(text) {
  if (!text) return null;
  // Look for the first number in the string
  const match = text.match(/(\d+([.,]\d+)?)/);
  if (!match) return null;
  const raw = match[1].replace(',', '.');
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function detectCategory(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.category;
    }
  }

  // Default fallback
  return 'Other';
}

function buildTitle(text, amount) {
  if (!text) return 'Voice expense';
  let cleaned = text.trim();
  if (amount != null) {
    cleaned = cleaned.replace(String(amount), '').trim();
  }

  // Remove some common filler words
  cleaned = cleaned
    .replace(/rupees?/gi, '')
    .replace(/rs\.?/gi, '')
    .replace(/add/gi, '')
    .replace(/expense/gi, '')
    .replace(/for group/gi, '')
    .replace(/group/gi, '')
    .replace(/hey splitx/gi, '')
    .replace(/splitx/gi, '')
    .trim();

  if (!cleaned) return 'Voice expense';

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * parseExpenseVoiceCommand
 * @param {string} transcript - raw speech-to-text result
 * @returns {{ amount: number | null, category: string | null, title: string }}
 */
export function parseExpenseVoiceCommand(transcript) {
  const amount = extractAmount(transcript);
  const category = detectCategory(transcript);
  const title = buildTitle(transcript, amount);

  return {
    amount,
    category,
    title,
  };
}
