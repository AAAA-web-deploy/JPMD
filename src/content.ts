import rawMemes from "./data/meme-catalog.json" with { type: "json" };
import rawMoodGallery from "./data/mood-gallery.json" with { type: "json" };
import storyContent from "./data/story-content.json" with { type: "json" };
import voicesContent from "./data/wall-street-meets-ethereum.json" with { type: "json" };
import { isCatalogTheme, isCollection } from "./lib/gallery.ts";
import type { Meme, MoodImage } from "./lib/gallery.ts";

/** Implementation copy for review, based only on the narrative in this thread. */
const captions = [
  "Market closed. Group chat open.",
  "The old hand has seen this candle before.",
  "A quiet toast to surviving the week.",
  "The interview took an unexpected turn.",
  "The suit made it to the summit.",
  "From paperwork to the server room.",
  "The bear can wait outside.",
  "Checking what is actually being built.",
  "Still finding a way through the chop.",
  "The group chat is calling.",
  "Someone said the meeting was on the moon.",
  "Composure during a very windy session.",
  "There is always another door.",
  "Staring until the pattern makes sense.",
  "The new arrival has everyone looking.",
  "Builders and suits at the same table.",
  "A moment of calm before refreshing.",
  "So that is what they meant by a whale.",
  "Conviction takes a little training.",
  "A balanced portfolio of lunch options.",
  "Choosing the next route carefully.",
  "Good morning. The watchlist is already awake.",
  "Yes, I am still on the call.",
  "Taking a higher view for a minute.",
  "Coffee first. Candles second.",
  "Good night. The chart can manage without me.",
  "Dressed for a little unexpected weather.",
  "One more door. One more possibility.",
  "Thinking a few moves ahead.",
  "Zooming out from the desk.",
  "When the message finally arrives.",
  "Doing the reading before joining the chat.",
  "The part where I think about it again.",
  "Packed for the long haul.",
  "Taking the scenic route home.",
  "An extremely professional rest day.",
  "Back at the desk, fully recharged.",
  "Window seat. Entirely different perspective.",
  "A very discreet call to the group chat.",
  "Keeping an eye on the horizon.",
  "That take gets a red card.",
  "A small, suspiciously confident smile.",
  "New face in a familiar room.",
  "Arriving like the meeting was waiting for you.",
  "Thinking is still a strategy.",
  "Somehow the desk remains calm.",
  "Let me check that one more time.",
  "Connecting the pieces, carefully.",
  "A bull and a Shiba walk into the street.",
  "Just a pinch of good timing.",
  "Some things grow on their own schedule.",
  "One more level before checking the chart.",
  "Let the Shiba cook.",
  "Taking a closer look at the fundamentals.",
  "There is room at the table.",
  "A long horizon and a very sharp suit.",
  "Sorting the red days from the green days.",
  "Your support call has reached the Shiba.",
  "You said what in the group chat?",
  "Watching the situation develop.",
  "Asking the market very politely.",
  "Yes. I noticed that too.",
  "I looked away for one minute.",
  "And the source for that is…?",
  "Still working on the grip.",
  "A rough day at the office.",
  "Wake me when the next chapter starts.",
] as const;

export const memes: readonly Meme[] = rawMemes.map((meme, index) => {
  if (!isCatalogTheme(meme.category) || !captions[index]) {
    throw new Error(`Invalid meme catalog entry ${index}`);
  }
  return { ...meme, category: meme.category, caption: captions[index] };
});

/** Collection images left out of "The whole pack" archive and the moving strips. */
const leftOutOfPack = new Set(
  [6, 9, 10, 15, 21, 22, 23, 25, 28, 30, 34, 41, 42, 44, 53, 57, 60, 62, 64].map(
    (number) => `meme-${String(number).padStart(2, "0")}`,
  ),
);
/** Images shown in "The whole pack" archive and the moving strips, in catalog order. */
export const packMemes: readonly Meme[] = memes.filter((meme) => !leftOutOfPack.has(meme.id));

/**
 * Images of the "Meet the many moods of Shiba" gallery, in display order. Each belongs to one
 * filter button (`collection`); "All Shibas" shows every entry. New images go in
 * `public/images/memes/`, `src/data/mood-gallery.json`, and `src/data/asset-manifest.json`.
 * An entry's optional `alt` is its image description; without it, `description` is used.
 */
export const moodImages: readonly MoodImage[] = [
  ...rawMoodGallery.map(({ file, collection, title, description, alt }) => {
    if (!isCollection(collection)) throw new Error(`Invalid gallery collection for ${file}`);
    return {
      id: file.replace(/\.png$/, ""),
      path: `images/memes/${file}`,
      alt: alt ?? description,
      caption: title,
      collection,
    };
  }),
  ...memes
    .filter((meme) => meme.category === "Community")
    .map(({ id, path, alt, caption }): MoodImage => ({
      id,
      path,
      alt,
      caption,
      collection: "Shiba Society",
    })),
];

export interface Chapter {
  title: string;
  label: string;
  paragraphs: readonly string[];
  image: string;
  alt: string;
}
/** Lore book (#lore): section intro, cover, and five chapters from the story package. */
export const story = {
  section: storyContent.section,
  cover: storyContent.cover,
} as const;
export const chapters: readonly Chapter[] = storyContent.chapters.map(
  ({ label, title, paragraphs, image, alt }) => ({ label, title, paragraphs, image, alt }),
);

export interface Voice {
  id: string;
  name: string;
  role: string;
  quote: string;
  sourceUrl: string;
  sourceLabel: string;
  image: string;
  width: number;
  height: number;
  alt: string;
}
/** Wall Street Meets Ethereum (#ethereum): approved copy and motion values from the update package. */
export const voicesSection = {
  title: voicesContent.title,
  subtitle: voicesContent.subtitle,
  transitionMs: voicesContent.animation.transitionMs,
  entryMs: voicesContent.animation.entryMs,
  portraitTranslationPx: voicesContent.animation.portraitTranslationPx,
  portraitStartScale: voicesContent.animation.portraitStartScale,
  quoteTranslationPx: voicesContent.animation.quoteTranslationPx,
} as const;
export const voices: readonly Voice[] = voicesContent.animation.order.map((id) => {
  const speaker = voicesContent.speakers.find((entry) => entry.id === id);
  if (!speaker) throw new Error(`Missing speaker: ${id}`);
  const { name, role, quote, sourceUrl, sourceLabel, imagePath, width, height, alt } = speaker;
  return { id, name, role, quote, sourceUrl, sourceLabel, image: imagePath, width, height, alt };
});

export const roadmap = [
  {
    title: "Make an entrance",
    image: "images/roadmap/flag.png",
    intro: "Every story needs a character worth remembering.",
    points: [
      "Meet the Shiba",
      "Read the five chapters",
      "Get to know the pack",
    ],
  },
  {
    title: "Find your mood",
    image: "images/roadmap/bell.png",
    intro: "The market has a mood for every moment.",
    points: [
      `Explore all ${packMemes.length} scenes`,
      "Choose your reaction",
      "Bring your own caption",
    ],
  },
  {
    title: "Make it your own",
    image: "images/roadmap/city.png",
    intro: "A familiar face. Your own point of view.",
    points: [
      "Ride the Bull Run mini-game",
      "Jump the red candles",
      "Beat your best score",
    ],
  },
  {
    title: "Keep the story open",
    image: "images/roadmap/book.png",
    intro: "The best chapters leave room for the community.",
    points: [
      "Start a conversation",
      "Share a new perspective",
      "Imagine what comes next",
    ],
  },
] as const;

export const tickerPhrases = [
  "SHIBA P. MORGAN INU",
  "OLD MONEY. OPEN LEDGERS.",
  "THE SUIT MET ITS MATCH.",
  "AN ETHEREUM STORY",
  "A WHOLE NEW SHIBA",
];
