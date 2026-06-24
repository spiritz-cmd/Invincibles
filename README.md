# INVINCIBLES

**Can you go 15-0 through the Champions League?**

Draft 11 players from UEFA Champions League history, build your formation, then simulate your XI through the full 2025/26 UCL season — league phase, knockouts, all the way to the Final. Go unbeaten and you're Invincible.

🔗 **[Play now](https://spiritz-cmd.github.io/Invincibles/)**

---

## How to play

### 1. Setup

Choose your options before the draft begins:

- **Formation** — 12 options from 4-3-3 to 3-5-2
- **Draft mode** — *Squad-first* (spin a club, pick any player) or *Position-first* (pick a slot, spin clubs that can fill it)
- **Re-rolls** — 0, 1, 3, or 5 spins you can skip per draft
- **Ratings** — *Career* (the player's rating for that specific season) or *Prime* (their peak career rating)
- **Difficulty** — affects how simulation results play out

### 2. Draft

Spin the wheel to land on a club and season from Champions League history. A list of eligible players from that club's squad appears — pick one to add them to your XI.

- Players are auto-assigned to the best open slot in your formation
- You can drag and rearrange players between slots on the pitch at any time
- A player can fill an out-of-position slot at a **−4% rating penalty** (e.g. a CM in a DM slot, or an LM in an LW slot — same side only)
- Keep spinning until all 11 slots are filled

### 3. Review your squad

See your completed XI on the pitch with an **Overall rating** (weighted by position group: GK, DEF, MID, ATT). Pre-season odds show your projected finish and expected points. Hit **Simulate** when you're ready.

### 4. Season simulation

Your XI plays through the full 2025/26 UCL format:

**League Phase** — 36 teams, 8 matches each (round-robin draw). Finish positions determine how you enter the knockouts:
- **1st–8th** → automatic Round of 16
- **9th–24th** → Knockout Playoff, then Round of 16
- **25th–36th** → eliminated

**Knockout Stage** — Playoff → R16 → Quarter-Final → Semi-Final → Final. All rounds are two legs except the Final. Ties decided on aggregate; level after 90 mins goes to extra time and penalties.

### 5. Results

After simulation, see the full match-by-match breakdown — every result, scoreline, and goalscorer across the league phase and knockouts. Your squad gets:

- **Golden Boot** — top scorer across all 15 matches
- **Golden Glove** — GK, with clean sheet count
- **Player of the Season** — the tournament's top scorer

Hit **Save Season Card** to generate a shareable image of your run.

---

## Position rules

Players can only fill slots that suit their position. Slots in each formation have a natural position (or positions) they accept with no penalty. Out-of-position assignments are handled as follows:

| Situation | Penalty |
|-----------|---------|
| Natural fit | None |
| Same-side cross (LM↔LW, RB↔RWB, etc.) | −4% |
| Wrong position entirely | Not allowed |

`ST` and `CF` are interchangeable with no penalty. `CB` cannot fill `LB` or `RB` slots.

---

## Rating tiers

| Tier | Range |
|------|-------|
| 🟤 Bronze | < 75 |
| ⚪ Silver | 75–79 |
| 🟡 Gold | 80–84 |
| 🟢 Emerald | 85–89 |
| 🔵 Platinum | 90–94 |
| 🟣 Purple | 95+ |

---

## Player database

Over 8,800 player-seasons covering every UCL campaign from 1992–93 through 2025–26 — 754 spinnable club+season combinations, each with at least 11 players to fill a full XI.

---

## Tech

React 18 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Zustand · GitHub Pages
