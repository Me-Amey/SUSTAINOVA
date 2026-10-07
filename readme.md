# SmartFresh

SmartFresh is an interactive concept website and product storytelling landing page built for a sustainable milk packaging idea. The project presents a biodegradable milk pouch concept with a natural colour-changing freshness indicator that helps consumers understand product freshness using a simple visual cue and smartphone-based scan experience.

## Purpose of the website

The website explains the SmartFresh innovation in a way that is clear, visually engaging, and easy to understand for users, judges, stakeholders, and potential partners. It communicates:

- the problem with conventional milk packaging and waste
- the concept of a biodegradable pouch
- the natural freshness indicator based on colour change
- how the product can be scanned and interpreted through a digital interface
- the environmental and consumer-value story behind the idea

The core message is: SmartFresh makes milk freshness visible, helps consumers make better decisions, and reduces dependence on inefficient or waste-heavy packaging habits.

## Project vision

SmartFresh is designed around a simple but powerful idea:

- the packaging itself gives a visual freshness signal
- the signal can be captured with a phone camera
- the image is interpreted through a lightweight digital analysis layer
- users receive clearer guidance without relying only on a printed date label

This website acts as a prototype presentation for that vision, combining product concept, storytelling, UX mockups, and interactive lab simulations.

## Key features

- Responsive single-page landing page for product storytelling
- Premium eco-conscious UI with clean modern visuals
- Floating product mockups and animated cards
- Freshness lab simulation for colour analysis
- Sample calibration states for Fresh, Warning, Changing, and Not Fresh
- Image upload preview for indicator analysis
- Fully local and resilient asset handling for offline-friendly presentation
- YouTube CTA linking to the Sustainova channel
- Floating FAQ/chat-style assistant with suggested questions
- Google Analytics integration for page tracking
- AOS animation support for scroll-based micro-interactions

## 3D mode

The site ships with an optional WebGL layer that turns the flat artwork into a
real-time 3D experience. It is progressive enhancement: with JavaScript off, on
a browser without WebGL, or with the toggle switched off, the original flat
assets render exactly as before.

**What is 3D**

- **Hero pouch** — a procedurally modelled SmartFresh pouch (extruded film body,
  crimped top weld, printed label, QR block, bottom seal) rendered with three.js.
  The freshness indicator disc is emissive and cycles through the same
  deep-purple → magenta → dark-red calibration as the 2D lab, casting coloured
  light onto the film. Drag to spin it, move the pointer for parallax.
- **Circular-economy orbit** — a tilted rotating ring with four glowing beads
  that traces the loop just outside the lifecycle diagram. Hovering a lifecycle
  step in the copy column lights up its matching bead and shows its caption.
- **Card tilt** — every feature, stat, step and SDG card sits in its own
  perspective space and follows the pointer, with a specular sheen that tracks
  the cursor. Hover lifts are preserved.
- **Scroll depth** — section headers drift against the scroll position for a
  layered parallax feel.

**Controls**

A `3D` toggle in the header switches the whole layer on and off; the choice is
remembered in `localStorage`. Visitors who ask for reduced motion get the flat
version by default and can still opt in.

**Files**

- `js/smartfresh-3d.js` — the two three.js scenes and the public bridge
  (`window.SmartFresh3D`) used by `script.js`
- `vendor/three/` — the bundled three.js r160 module build, mapped through an
  import map so nothing is fetched from a CDN at runtime

## Tech stack

This project is built using a lightweight static web stack:

- HTML5 for page structure and content
- CSS3 for layout, styling, responsiveness, and effects
- JavaScript for interactivity and dynamic UI logic
- AOS (Animate on Scroll) for smooth reveal animations
- Google Tag Manager / Google Analytics snippet for tracking
- Local image assets and static files for portability and reliability

## How the website works

The landing page follows a storytelling flow:

1. Hero section introduces the product and value proposition.
2. Feature cards explain the material, indicator, and digital layer.
3. Workflow section explains the scan-to-understand user journey.
4. Freshness lab section lets users simulate or upload packaging indicator imagery.
5. Pouch passport section presents a prototype traceability and batch concept.
6. Impact section reinforces the sustainability story and broader purpose.
7. Floating FAQ assistant guides users with suggested questions and answers.

## Project structure

- index.html — page layout and content
- styles.css — all styling, animations, layout, and visual polish
- script.js — interactive logic, chat assistant, calibration logic, upload simulation, 3D toggle, tilt engine and motion effects
- js/smartfresh-3d.js — the WebGL 3D layer
- vendor/three/ — bundled three.js module build
- sustainova-logo.jpeg — team branding asset
- smartfresh-prototype.jpg.png — product imagery
- readme.md — project documentation

## Run locally

Because this is a static website, you can run it in several simple ways:

### Option 1: Open directly in a browser

- Open index.html directly in the browser.

### Option 2: Use a local server

From the project folder, run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Notes on design and implementation

The project has been designed to feel premium and product-ready while staying lightweight and easy to maintain. It avoids heavy frameworks and uses plain HTML, CSS, and JavaScript to keep the deployment simple and fast.

Key implementation choices include:

- static files for quick hosting and easy portability
- three.js is vendored locally, so the 3D layer needs no CDN at runtime
- no other dependency on large external libraries beyond AOS and analytics
- local asset fallback to keep the site functional even if external sources vanish
- mobile-friendly layout and responsive behaviour
- chat-like FAQ assistant for better exploration and user engagement

## Sustainability and product narrative

The SmartFresh concept is intended to address a real-world problem in food packaging and consumption:

- excessive plastic waste
- unclear freshness information
- lack of direct consumer education at the point of use
- dependence on printed dates alone

By connecting a biodegradable pack concept with a natural indicator and a digital interpretation layer, the idea aims to make responsible packaging and smarter consumer decisions feel more natural and more accessible.

## Target audience

This website is suitable for:

- judges and evaluators
- sustainability-focused stakeholders
- packaging and product design reviewers
- potential collaborators and investors
- users exploring the SmartFresh product concept

## Status

This project is a concept prototype and presentation website for the SmartFresh innovation. It is designed to communicate the idea clearly and demonstrate how the product could work in a real-world environment.

## Team and project identity

The project is associated with Sustainova and presents the SmartFresh concept under the broader team identity. The content is oriented around a thoughtful, eco-conscious product story with a strong research and design language.

## Future improvements

Possible extensions include:

- adding a more advanced real colour detection algorithm
- extending the FAQ chat assistant with richer dynamic responses
- adding product-specific landing pages or a multi-page experience
- integrating real backend data for batch verification and traceability
- expanding the concept into a complete prototype demo or pitch deck

## Summary

SmartFresh is more than a landing page — it is a presentation of a sustainable product concept that merges material innovation, design, consumer understanding, and digital interaction. The website is built to communicate that idea in a polished, persuasive, and easy-to-understand format.