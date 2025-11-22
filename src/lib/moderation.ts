import leoProfanity from "leo-profanity";
import { Filter } from "bad-words";
import { googleToxicityCheck } from "./toxicity"; // custom function

const filter = new Filter();

// 1. Load built-in multilingual list (safe)
// Wrap in try-catch to prevent module load failure
try {
    leoProfanity.loadDictionary();
    // leoProfanity.getDictionary("hi") might not be available in all versions
    // leoProfanity.add(leoProfanity.getDictionary("hi")); 
} catch (e) {
    console.error("Failed to load leo-profanity dictionary", e);
}

// 2. Load external safe blocklists (YOU provide the file privately)
import extraBlocklist from "@/blocklists/indianWords.json"; 
try {
    if (Array.isArray(extraBlocklist)) {
        leoProfanity.add(extraBlocklist); 
    }
} catch (e) {
    console.error("Failed to add extra blocklist", e);
}

// 3. Add safe roots (not explicit words)
filter.addWords(
  "root-mc",
  "root-bc",
  "root-gaand",
  "root-bhos",
  "root-lund",
  "root-chod",
  "root-madar",
  "root-behen",
  "mf", "fkkk", "a*hole", "asshole", "fck", "bsdk", "mc", "bc"
);

// 4. Strong Hinglish Regex Variations
const regexList = [
  /m[ai@]*d[hc]+[a@i]*/i,  // generic abusive pattern
  /b[ai@]*s[dh]+[a@]*/i,   // generic abusive pattern
  /ch[o0]+d/i,            // common transliteration
  /g[a@]+nd/i,
  /l[u@]+nd/i
];

// 5. Normalize user text
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0900-\u0D7F\s]/g, ""); // Keep spaces!
}

function compact(text: string) {
    return text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\u0900-\u0D7F]/g, ""); // Remove spaces for "f u c k" detection
}

// 6. Unicode detection for Indian languages
const indicUnicode = /[\u0900-\u0D7F]/;  // Hindi–Tamil–Malayalam–Kannada–Bengali etc.

// MAIN FUNCTION — strong detection
export async function containsProfanity(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Check with spaces preserved (standard sentences)
  const standardClean = normalize(text);
  if (leoProfanity.check(standardClean)) return true;
  if (filter.isProfane(standardClean)) return true;

  // 2. Check compacted text (bypass attempts like "f u c k")
  const compacted = compact(text);
  if (regexList.some(rx => rx.test(compacted))) return true;
  
  // Optional: Check compacted against dictionaries too? 
  // Might cause false positives (e.g. "class" -> "ass"), so be careful. 
  // We'll stick to regex for compacted.

  // 3. Unicode (flag if abusive content found in any Indic range)
  if (indicUnicode.test(text)) {
    if (leoProfanity.check(text)) return true;
  }

  // 4. AI fallback: Google Perspective API
  const toxicity = await googleToxicityCheck(text);
  if (toxicity > 0.75) return true;

  return false;
}

export function cleanContent(text: string): string {
  if (!text) return text;
  return leoProfanity.clean(text);
}

export async function validateContent(text: string, fieldName: string) {
  if (await containsProfanity(text)) {
    throw new Error(`The ${fieldName} contains inappropriate language.`);
  }
}
