const LIGHT_CLASS_RE = /\b(bg-white(?!\/)|bg-pearl-[123](?!\/)|bg-cream(?!\/)|bg-champagne(?!\/)|bg-\[#F[0-9A-Fa-f]{2,5}\](?!\/)|bg-\[#FFF[0-9A-Fa-f]*\](?!\/)|from-\[#[CDEF][0-9A-Fa-f]{5}\](?!\/)|from-gold(?!-dark)\b|from-\[hsl\(var\(--gold\)\)\](?!\/))\b/;
const WHITE_TEXT_RE = /(?<![:\w-])text-white(?:\/[0-9]{1,3})?\b|(?<![:\w-])text-\[#FDFBF7\](?:\/[0-9]{1,3})?\b|(?<![:\w-])text-\[#F7F2EA\](?:\/[0-9]{1,3})?\b/;

const seg = 'bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-3xl max-h-[85vh] overflow-hidden';
console.log('LIGHT_CLASS_RE test:', LIGHT_CLASS_RE.test(seg));
console.log('WHITE_TEXT_RE test:', WHITE_TEXT_RE.test(seg));
