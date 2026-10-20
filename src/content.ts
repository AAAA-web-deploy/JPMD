import rawMemes from "./data/meme-catalog.json" with { type: "json" };
import { isCatalogTheme } from "./lib/gallery.ts";
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

/**
 * Images of the "Meet the many moods of Shiba" gallery, in display order. Each belongs to one
 * filter button (`collection`); "All Shibas" shows every entry. New images go in
 * `public/images/moods/` and are listed here (and in `src/data/asset-manifest.json`).
 * Wall Street, Ethereum, Trading Desk, and Shiba Culture are waiting for their images.
 */
export const moodImages: readonly MoodImage[] = memes
  .filter((meme) => meme.category === "Community")
  .map(({ id, path, alt, caption }) => ({
    id,
    path,
    alt,
    caption,
    collection: "Shiba Society",
  }));

export interface Chapter {
  title: string;
  label: string;
  paragraphs: readonly string[];
  image: string;
  alt: string;
}
export const chapters: readonly Chapter[] = [
  {
    label: "CHAPTER 01 · THE OLD WORLD",
    title: "A different kind of meeting.",
    paragraphs: [
      "Wall Street knew the towers, the suits, and the closing bell. Crypto was already on every screen. The financiers wanted to understand the people on the other side.",
      "So they left the boardroom. Somewhere beyond the familiar doors, a new conversation was waiting.",
    ],
    image: "images/story/chapter-01.png",
    alt: "Three fictional financiers look from traditional financial architecture toward a modern city.",
  },
  {
    label: "CHAPTER 02 · THE FIRST PITCH",
    title: "The cat had the room.",
    paragraphs: [
      "First came the cat: bright, quick, and impossible to ignore. The presentation moved fast. So did the conversation.",
      "The traders knew that feeling. A lively room can catch your attention in a second. The financiers kept listening. They were still looking for their own reason to stay.",
    ],
    image: "images/story/chapter-02.png",
    alt: "An original cat presents to the same fictional financiers in a bright meeting room.",
  },
  {
    label: "CHAPTER 03 · A FAMILIAR FACE",
    title: "Then came the frog.",
    paragraphs: [
      "Across the bridge, a frog brought the energy of a trading crowd. Familiar faces. Big entrances. Plenty to talk about in the group chat.",
      "The financiers enjoyed the meeting. The question followed them out: where would their next chapter begin?",
    ],
    image: "images/story/chapter-03.png",
    alt: "An original frog meets the fictional financiers beside a city bridge.",
  },
  {
    label: "CHAPTER 04 · ENTER SHIBA",
    title: "The suit met its match.",
    paragraphs: [
      "Then Shiba walked in. A sharp suit, a steady look, and a chair already pulled up to the table. He opened the ledger. The room leaned closer.",
      "The financiers found their spark. The traders found their character. In our story, Ethereum had just gained a very memorable new arrival.",
    ],
    image: "images/story/chapter-04.png",
    alt: "The Shiba banker opens a blank ledger with the three fictional financiers.",
  },
  {
    label: "CHAPTER 05 · THE OPEN FUTURE",
    title: "The next chapter is open.",
    paragraphs: [
      "Ethereum had a story long before the suits arrived: builders, communities, experiments, and plenty of late nights. Now the meeting had more seats at the table.",
      "Beyond the glass, the city was still being built. Shiba looked ahead. The pack had a whole new chapter to imagine.",
    ],
    image: "images/story/chapter-05.png",
    alt: "The Shiba, financiers, and builders look toward an imagined city under construction.",
  },
];

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
      "Explore all 67 scenes",
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
