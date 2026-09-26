# TypeFlow ⌨️

> A modern, completion-based typing speed test built with vanilla HTML, CSS, and JavaScript.

![TypeFlow Preview](https://img.shields.io/badge/TypeFlow-Typing%20Test-7c6af5?style=for-the-badge&logo=keyboard)

---


## Features

- **10 original passages** — medium-to-hard difficulty, ~150–250 words each
- **Character-by-character tracking** — correct / incorrect / current cursor states
- **Live statistics** — WPM, Accuracy, Time, typed/correct/incorrect characters
- **Accurate WPM formulas** — Net WPM, Raw WPM, and Accuracy per standard typing-test conventions
- **Timer starts on first keypress** — no countdown, completion-based
- **Backspace support** — correctly reverts character state and adjusts counts
- **Result modal** — full breakdown at test completion
- **Restart Test** — same story, reset progress
- **New Story** — random different story, full reset
- **Dark modern UI** — CSS variables, glassmorphism card, pulsing cursor animation
- **Fully responsive** — desktop → tablet → mobile

---

## Project Structure

```
typing-test/
├── index.html          # Application shell & result modal
├── css/
│   └── style.css       # Full styling, CSS variables, responsive breakpoints
├── js/
│   ├── stories.js      # 10 original passages (STORIES array)
│   └── app.js          # All application logic
└── README.md
```

---

## How to Run

No build step required. Open `index.html` directly in your browser:

```bash
# Option 1 — double-click index.html in your file explorer

# Option 2 — serve with a local dev server (recommended)
npx serve .
# or
python -m http.server 8000
```

> **Tip:** Using a local server avoids any CORS issues with ES module imports if you extend the project later.

---

## WPM Formulas

| Metric | Formula |
|--------|---------|
| **Net WPM** | `(correct chars / 5) / elapsed minutes` |
| **Raw WPM** | `(total chars typed / 5) / elapsed minutes` |
| **Accuracy** | `(correct chars in display / total keypresses) × 100` |

- A "word" is standardised as **5 characters** (including spaces).
- Backspacing reduces `totalTyped` and reverts the character's state.
- Errors are characters currently marked **incorrect** in the display.

---

## Keyboard Behaviour

| Key | Action |
|-----|--------|
| Any printable character | Type and advance cursor |
| `Backspace` | Delete last character, move cursor back |
| `Ctrl / Alt / Meta` | Ignored |
| `Shift` | Ignored (combined with printable chars works normally) |
| `Tab`, `Escape`, arrows | Ignored |
| `Ctrl+V` | Blocked (no paste) |

---

## Character States

| State | Visual |
|-------|--------|
| `untyped` | Muted grey |
| `correct` | Green (`#58e094`) |
| `incorrect` | Red (`#f25c6e`) with red background tint |
| `current` | Bright purple cursor with pulse animation |

---

## Customisation

### Adding More Stories
Open `js/stories.js` and append to the `STORIES` array:

```js
{
  id: 11,
  title: "Your Story Title",
  text: `Your passage text here.`
}
```

### Changing the Accent Color
In `css/style.css`, update the CSS variable:

```css
:root {
  --accent: #7c6af5; /* change to any hex */
}
```

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari).  
No external dependencies — zero npm installs required.

---

## License

MIT — free to use, modify, and distribute.
