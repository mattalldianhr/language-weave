# Language Weave homepage — content brief (shared by all builders)

Content only. Visual direction comes from each builder's seed. Do not add style words from here.

## Product

Language Weave is an open-source browser extension. It swaps a few English words on any web page for the same
words in a language you are learning (Spanish, French, German, Italian, Portuguese to start). You read what you
were going to read anyway. Hover a swapped word and the English appears; click and it flips back. Swaps are rare
(one word in fifty at first, never more than one in twenty), chosen where the sentence makes the meaning
obvious, and each word comes back on later days until it sticks. Nouns arrive with their article ("la casa",
"das Haus") so gender comes for free. Nothing leaves your machine unless you give it a key.

Built from first principles with real data: frequency corpora for eight languages, the vocabulary-acquisition
literature, and a measured precision experiment. The numbers below are real; use them as written.

- Audience: people who read a lot of English on the web and want a second language to come to them. Many
  install via a coding agent (Claude Code or Codex) with a one-line prompt.
- Tone of copy: playful and a little weird; sneaky, bookish, delighted. Never gamified, never a sales pitch,
  never a lecture. Short sentences.
- Name: Language Weave. GitHub: https://github.com/mattalldianhr/language-weave (placeholder; render as given).

## The demo requirement (every build must do this)

The page's own copy carries woven foreign words. Mark each one up like this, with a working hover gloss (the
English) and click-to-flip (text toggles to English and back). Keyboard: focusable, Enter/Space flips.

```html
<span class="lw" data-en="because" data-lang="es" tabindex="0" role="button">porque</span>
```

Include a language switcher (es / fr / de / it / pt) that re-renders every woven word in the chosen language
without reloading. Default Spanish. Use ONLY the word pairs below (English → es / fr / de / it / pt). Weave
about one word in twenty-five of the page's running text, spread evenly; never two in one sentence. Weave only
where the sentence makes the meaning guessable.

| English | es | fr | de | it | pt |
|---|---|---|---|---|---|
| because | porque | parce que | weil | perché | porque |
| but | pero | mais | aber | ma | mas |
| also | también | aussi | auch | anche | também |
| always | siempre | toujours | immer | sempre | sempre |
| never | nunca | jamais | nie | mai | nunca |
| now | ahora | maintenant | jetzt | adesso | agora |
| already | ya | déjà | schon | già | já |
| maybe | quizás | peut-être | vielleicht | forse | talvez |
| very | muy | très | sehr | molto | muito |
| a little | un poco | un peu | ein bisschen | un po' | um pouco |
| without | sin | sans | ohne | senza | sem |
| together | juntos | ensemble | zusammen | insieme | juntos |
| slowly | despacio | lentement | langsam | lentamente | devagar |
| often | a menudo | souvent | oft | spesso | muitas vezes |
| nothing | nada | rien | nichts | niente | nada |
| new | nuevo | nouveau | neu | nuovo | novo |
| the word | la palabra | le mot | das Wort | la parola | a palavra |
| the words | las palabras | les mots | die Wörter | le parole | as palavras |
| the page | la página | la page | die Seite | la pagina | a página |
| the book | el libro | le livre | das Buch | il libro | o livro |
| the house | la casa | la maison | das Haus | la casa | a casa |
| the city | la ciudad | la ville | die Stadt | la città | a cidade |
| the morning | la mañana | le matin | der Morgen | la mattina | a manhã |
| the browser | el navegador | le navigateur | der Browser | il browser | o navegador |
| a friend | un amigo | un ami | ein Freund | un amico | um amigo |
| every day | cada día | chaque jour | jeden Tag | ogni giorno | todos os dias |

## Sections (in this order; one strong idea each; no filler)

1. Opening: a short passage of ordinary prose about reading on the web, with woven words in it. The visitor
   should hover one before reading any pitch. One line of product name and what it is.
2. How it works, in three short beats: swaps are rare and placed where meaning is obvious; hover shows English,
   click flips; words come back on later days until they stick (about ten meetings, spaced). Mention nouns come
   with their article.
3. The evidence, as asides or marginalia, not a stats block. Use these exact facts:
   - The 100 most common English words cover 46% of web text, but they are almost all grammar words you can't
     swap. A useful list starts around 300 words and is mostly nouns and connectors.
   - A word needs about 8–12 meetings before it stays; fewer than 8 and nothing was recalled three months later.
   - Keep foreign words under 1 in 20 of the text, nearer 1 in 50, so comprehension stays above 95%.
   - Naive word-for-word swapping is right only 63% of the time; part-of-speech checks and a sense whitelist
     lift that to 82%; the remaining errors are idioms and senses, which a verifier catches.
   - Learning a noun without its article makes learning its gender harder later.
4. Install: two paths. (a) Tell your coding agent: "Set up Language Weave from github.com/mattalldianhr/language-weave".
   (b) Load the extension folder unpacked in Chrome. One line each; a copy button on the prompt.
5. Privacy, in three sentences: page text stays on your machine; on-device models when the browser has them;
   a cloud key only if you add one, and then only sentence fragments are sent.
6. Footer: open source, MIT, link to the research folder, link to the GitHub repo.

## Must not

No gradient hero with three feature cards. No testimonials, no pricing. No mascots, streaks, confetti. No dark
page with neon accents. No dense grey academic layout. No stock illustrations of globes, speech bubbles, or
flags. No fake metrics (user counts, ratings).
