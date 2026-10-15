// Step 6: tag every corpus sentence with compromise (JS tagger) and record throughput.
// Usage: NODE_PATH=<scratch>/node-tagger/node_modules node tag_compromise.js sentences.jsonl out.jsonl
// Each output line: {sid, terms:[{text, start, end, tags}]}; timing is written to stderr.
const fs = require("fs");
const nlp = require("compromise");

const [inPath, outPath] = process.argv.slice(2);
const lines = fs.readFileSync(inPath, "utf8").split("\n").filter(Boolean);
const out = fs.createWriteStream(outPath);
let words = 0;
const t0 = process.hrtime.bigint();
for (const line of lines) {
  const s = JSON.parse(line);
  const doc = nlp(s.text);
  const terms = [];
  for (const sent of doc.json({ offset: true, terms: { offset: true, tags: true } })) {
    for (const t of sent.terms) {
      terms.push({ text: t.text, start: t.offset.start, end: t.offset.start + t.offset.length, tags: t.tags });
    }
  }
  words += s.n_words;
  out.write(JSON.stringify({ sid: s.sid, terms }) + "\n");
}
const secs = Number(process.hrtime.bigint() - t0) / 1e9;
out.end();
console.error(JSON.stringify({ sentences: lines.length, words, seconds: secs, words_per_sec: words / secs }));
