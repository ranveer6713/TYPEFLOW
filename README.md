

## 📁 Projects

### ⌨️ TypeFlow — Typing Speed Test

> [`typing-test/`](./typing-test/)

A fully functional, modern typing-speed test web application built with **pure HTML, CSS, and vanilla JavaScript** — zero dependencies, no build step required.

#### Features

| Feature | Details |
|---------|---------|
| **10 Original Passages** | Medium-to-hard difficulty, ~150–250 words each |
| **Live WPM & Accuracy** | Updates every 100 ms while you type |
| **Pause / Resume** | `Esc` key or button; timer pauses accurately |
| **Light & Dark Theme** | Beige warm palette ↔ dark mode; persists via `localStorage` |
| **Progress Bar** | Shows completion % and character count live |
| **Result Modal** | Net WPM, Raw WPM, Accuracy, Time, Correct/Incorrect chars |
| **Performance Badge** | 🚀 Speed Demon / ⚡ Fast Fingers / 🎯 Solid Typist / etc. |
| **Keyboard Shortcuts** | `Tab` = Restart (idle only), `Esc` = Pause, `Enter` = New Story |
| **Backspace Support** | Correctly reverts character state and adjusts counts |
| **Responsive** | Works on desktop, tablet, and mobile |

#### Tech Stack

- **HTML5** — semantic structure, ARIA accessibility
- **CSS3** — CSS variables, Flexbox/Grid, animations, dual theme
- **Vanilla JavaScript** — no frameworks, no libraries

#### Project Structure

```
typing-test/
├── index.html          # App shell
├── css/
│   └── style.css       # Full styling + light/dark themes
├── js/
│   ├── stories.js      # 10 original story passages
│   └── app.js          # All application logic
└── README.md           # Detailed project docs
```

#### How to Run

```bash
# Just open in browser — no install needed
start typing-test/index.html
```

Or serve locally:

```bash
npx serve typing-test/
# visit http://localhost:3000
```

#### WPM Formulas

```
Net WPM  = (correct chars / 5) / elapsed minutes
Raw WPM  = (total keypresses / 5) / elapsed minutes
Accuracy = (correct chars / total keypresses) × 100
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone <your-repo-url>
cd turing

# Open any project directly — no npm install needed
start typing-test/index.html
```

---

## 🛠 Development Notes

- All projects in this workspace use **vanilla web technologies** unless noted.
- No bundlers (Webpack/Vite) or frameworks (React/Vue) are used unless explicitly required.
- Each project folder contains its own `README.md` with detailed documentation.

---

## 📄 License

MIT — free to use, modify, and distribute.
