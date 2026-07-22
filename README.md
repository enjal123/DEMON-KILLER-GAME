# ⚔️ DEMON KILLER

*A cinematic 2D action-platformer built with Phaser 3 + Matter.js*

> "The end of hatred… begins with one fallen demon."

[GAME LINK 
]([url](https://demon-killer-game.netlify.app/))---

## 🎥 Gameplay


<img width="800" height="450" alt="GIF1" src="https://github.com/user-attachments/assets/b6033e86-234b-4684-bc24-865629609801" />

<img width="800" height="436" alt=<img width="800" height="436" alt="GIF2" src="https://github.com/user-attachments/assets/6b9f3100-b063-4833-ac9d-14858190abe6" />

---

## 📖 The Story

You are **Enjalandro** — a villager who left home to earn a better life for his family.

Three days into the trip, something felt wrong. The roads went cold. The forest went silent. And when he finally made it back... he was too late. His family was gone, slaughtered by creatures that hide in the dark and feed on a world too blind to see them: **demons**.

A mysterious stranger finds him in the wreckage of his grief and offers him a choice — die chasing blind revenge, or *survive* long enough to actually get it. For one year, Enjalandro trains. He sheds his fear, his weakness, his old self, until there's only one thing left inside him.

**Vengeance.**

Beyond a cave at the edge of the world lie the **Five Demon Levels** — each more dangerous than the last. At the bottom waits the one responsible for everything he lost.

This is where the nightmare ends.

---

## 🎯 Objective

Fight your way down through **5 increasingly brutal levels**, defeating the demons guarding each floor, unlocking the door forward, and descending deeper into the cave until you face the true source of your revenge in a final showdown.

Along the way, you can recruit fallen warriors to fight at your side — for the right price.

---

## 🕹️ Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| `SPACE` | Roll / Dodge (i-frames) |
| `Q` | Dash |
| `Q` `Q` (double-tap) or `T` | Lightning Dash |
| `Z` | Quick Attack (grounded) / Air Attack (airborne) |
| `X` | Combo Attack |
| `C` | Heavy Combo Attack |
| `V` | **Unleash Ultimate** (once charge bar is full) |
| `O` | Throw Kunai (ranged) |
| `I` (hold) | Block |
| `F` | Drink Potion (heal) |
| `E` | Interact (recruit allies / open doors) |
| `M` | Skip cutscene |

Build up your **Ultimate gauge** by landing hits, then unleash a flurry of strikes with `V` to turn the tide of a boss fight.

---

## 👹 The Demons You'll Face

| Level | Boss(es) |
|---|---|
| **1** | A flying demon that rains projectiles from above |
| **2** | A relentless melee brawler with a punishing follow-up combo |
| **3** | A two-phase imp that evolves mid-fight into a hulking flying demon lord — flanked by a boss slime that gets *more* dangerous the lower its health drops |
| **4** | A demon samurai who catches fire and grows deadlier as the fight goes on, fighting alongside an elemental warrior with devastating aerial and special attacks |
| **5 — Final Boss** | The one who ended it all. A shadow-cloaked assassin who transforms mid-battle into a full elemental form with faster, harder-hitting attacks |

Every boss scales in health and damage the deeper you go — level 1 is a warm-up. Level 5 is not.

---

## 🤝 Recruit Allies

Scattered through the cave are fallen warriors willing to fight beside you — for a price of **potions**, not gold. Each one follows you, fights bosses automatically, and can be knocked out if they take too much damage:

- 🌪️ **Wind Hashira** — fast, aggressive all-rounder
- 🔥 **Fire Hashira** — heavy-hitting melee specialist
- 💧 **Water Hashira** — the only ally who can *heal herself* mid-fight
- 🪨 **Stone Hashira** — tanky and relentless
- 🎵 **Sound Hashira** — quick, precise striker

Choose wisely — potions spent on allies are potions you don't have for yourself.

---

## ✨ Features

- 🎬 Full **cinematic intro cutscene** with typewriter dialogue, dynamic camera flashes, and procedurally generated ambient sound/heartbeat/thunder effects — all synthesized live with the Web Audio API, no audio files required
- ⚔️ A **deep combat system**: light/heavy combos, aerial attacks, ranged kunai, blocking, dodge-rolling with invincibility frames, dash and lightning-dash movement tech, and a chargeable ultimate
- 🧠 **Custom enemy AI state machines** per boss (IDLE → FOLLOW → ATTACK → SWING → HURT → DEATH) with unique attack patterns, phase transitions, and defend/counter windows
- 🤖 **5 recruitable AI allies**, each with independent combat AI that chases, attacks, defends, and (in one case) self-heals
- 🎞️ Hand-tuned frame-accurate animation timing across dozens of custom sprite sheets
- 🗺️ Physics-driven world built on **Matter.js**, with custom collision filtering so players can walk through enemies while combat still resolves via precise hit detection
- 🏆 A full cinematic **ending sequence** with its own scripted dialogue, plus a Game Over / retry flow

---

## 🛠️ Tech Stack

- **[Phaser 3](https://phaser.io/)** — game engine & rendering
- **Matter.js** — physics engine (via Phaser's Matter integration)
- **Tiled** — level/tilemap design (`.tmj` map format)
- **Web Audio API** — real-time synthesized sound effects and ambience
- Vanilla **JavaScript** — no framework overhead, just raw game logic

---

## 🚀 Running It Locally

1. Clone the repo
2. Serve the project folder with any static server (Phaser needs assets loaded over HTTP, not `file://`), for example:
   ```bash
   npx serve .
   ```
3. Open the local URL in your browser
4. Enter your name, hit `ENTER`, and step into the cave

---

## 🙏 Credits

Built solo — story, game design, combat systems, and enemy AI all custom-written. Sprite packs used under their respective licenses (Elementals series, Flying Demon, Boss Demon Slime, Demon Samurai, Imp, and NightBorne asset packs).

---

*"I finally kept my promise."*
