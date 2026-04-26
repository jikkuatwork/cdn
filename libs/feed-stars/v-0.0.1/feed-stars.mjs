// feed-stars v0.0.1 — animated 1-5 stars rating custom element.
//
// Adapted from Aaron Iker's "Stars rating animation" (CodePen XWrxyRJ),
// MIT licensed. jQuery removed, encapsulated in Shadow DOM, configurable
// via CSS custom properties + attributes, dispatches `change` events.
//
// Usage:
//   import 'feed-stars';
//   <feed-stars value="3"></feed-stars>
//   el.addEventListener('change', e => console.log(e.detail.value));
//
// Customisation (set on host or any ancestor):
//   --feed-stars-active        primary star color when selected
//   --feed-stars-active-pale   trailing dust color (rgba)
//   --feed-stars-inactive      unselected star color
//   --feed-stars-face-active   face features on selected star
//   --feed-stars-face-inactive face features on unselected stars
//   --feed-stars-gap           horizontal space between stars

const STAR_PATH = "M19.6859343,0.861782958 L24.8136328,8.05088572 C25.0669318,8.40601432 25.4299179,8.6717536 25.8489524,8.80883508 L34.592052,11.6690221 C35.6704701,12.021812 36.2532905,13.1657829 35.8938178,14.2241526 C35.8056709,14.4836775 35.6647294,14.7229267 35.4795411,14.9273903 L29.901129,21.0864353 C29.5299163,21.4962859 29.3444371,22.0366367 29.3872912,22.5833831 L30.1116131,31.8245163 C30.1987981,32.9368499 29.3506698,33.9079379 28.2172657,33.993502 C27.9437428,34.0141511 27.6687736,33.9809301 27.4085205,33.8957918 L18.6506147,31.0307612 C18.2281197,30.8925477 17.7713439,30.8925477 17.3488489,31.0307612 L8.59094317,33.8957918 C7.51252508,34.2485817 6.34688429,33.6765963 5.98741159,32.6182265 C5.90066055,32.3628116 5.86681029,32.0929542 5.88785051,31.8245163 L6.61217242,22.5833831 C6.65502653,22.0366367 6.46954737,21.4962859 6.09833466,21.0864353 L0.519922484,14.9273903 C-0.235294755,14.0935658 -0.158766688,12.8167745 0.690852706,12.0755971 C0.899189467,11.8938516 1.14297067,11.7555303 1.40741159,11.6690221 L10.1505113,8.80883508 C10.5695458,8.6717536 10.9325319,8.40601432 11.1858308,8.05088572 L16.3135293,0.861782958 C16.9654141,-0.0521682813 18.2488096,-0.274439442 19.1800736,0.365326425 C19.3769294,0.500563797 19.5481352,0.668586713 19.6859343,0.861782958 Z";

const STYLES = `
:host {
  --feed-stars-active: #FFED76;
  --feed-stars-active-pale: rgba(255, 237, 118, 0.36);
  --feed-stars-inactive: #121621;
  --feed-stars-face-active: #121621;
  --feed-stars-face-inactive: #1C212E;
  --feed-stars-gap: 16px;
  display: inline-block;
  -webkit-tap-highlight-color: transparent;
}
:host([disabled]) { pointer-events: none; opacity: 0.5; }

.rating {
  --active: var(--feed-stars-active);
  --active-pale: var(--feed-stars-active-pale);
  --inactive: var(--feed-stars-inactive);
  --face-active: var(--feed-stars-face-active);
  --face-inactive: var(--feed-stars-face-inactive);
  display: flex;
  position: relative;
}
.rating ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  color: var(--inactive);
}
.rating ul li {
  --face: var(--face-inactive);
  cursor: pointer;
  position: relative;
  outline: none;
}
.rating ul li:focus-visible svg {
  filter: drop-shadow(0 0 2px var(--active));
}
.rating ul li:before, .rating ul li:after {
  content: "";
  position: absolute;
  z-index: 2;
  transition: all 0.2s ease;
}
.rating ul li:before {
  --r: 0deg;
  width: 2px;
  height: 2px;
  border-radius: 1px;
  top: 15px;
  left: 13px;
  transform: rotate(var(--r));
  filter: drop-shadow(8px 0 0 var(--face));
}
.rating ul li span {
  width: 2px;
  height: 2px;
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  margin: -1px 0 0 -1px;
  transform: scale(0.6);
  opacity: 0;
  box-shadow:
    16px -16px 0 var(--active-pale),
    -16px -16px 0 var(--active-pale),
    -21px 8px 0 var(--active-pale),
    21px 8px 0 var(--active-pale),
    0 22px 0 var(--active-pale);
}
.rating ul li:nth-child(1):after {
  width: 10px;
  height: 10px;
  top: 20px;
  left: 13px;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: var(--face);
}
.rating ul li:nth-child(3):after {
  width: 6px;
  left: 15px;
  top: 20px;
  height: 1px;
  background: var(--face);
}
.rating ul li:nth-child(4):after {
  width: 10px;
  height: 10px;
  top: 12px;
  left: 13px;
  border-radius: 50%;
  border: 1px solid transparent;
  border-bottom-color: var(--face);
}
.rating ul li:nth-child(4).current { animation: feedstars-active-4 0.4s ease; }
.rating ul li:nth-child(4).current span { animation: feedstars-active-span 0.32s ease; }
.rating ul li:nth-child(5):after {
  width: 6px;
  height: 3px;
  left: 15px;
  top: 20px;
  border-radius: 0 0 3px 3px;
  background: var(--face);
}
.rating ul li:nth-child(5).current { animation: feedstars-active-5 0.72s ease; }
.rating ul li:nth-child(5).current span { animation: feedstars-active-span 0.32s ease; }
.rating ul li.current { --face: var(--face-active); }
.rating ul li.current svg {
  color: var(--active);
  fill: rgba(0, 0, 0, 0.2);
}
.rating ul li:not(.current) svg { transition: transform 0.2s ease; }
.rating ul li:not(.current):active svg { transform: scale(0.9); }
.rating ul li:not(:last-child) { margin: 0 var(--feed-stars-gap) 0 0; }
.rating ul li:not(:last-child):before { background: var(--face); }
.rating ul li:not(:last-child).current:before {
  animation: feedstars-blink 3s linear infinite;
}
.rating ul li:last-child:before {
  --r: -45deg;
  width: 3px;
  height: 3px;
  border-top: 1px solid var(--face);
  border-right: 1px solid var(--face);
  border-radius: 0 1px 0 0;
  left: 12px;
  filter: drop-shadow(6px 6px 0 var(--face));
}
.rating svg {
  width: 36px;
  height: 34px;
  display: block;
  fill: rgba(0, 0, 0, 0.04);
}
.rating > div {
  left: 0;
  top: 0;
  position: absolute;
  display: none;
  transform: translateX(var(--x));
  transition: transform 0.3s cubic-bezier(0, 0, 0.265, 1.1) 0.24s;
}
.rating > div span { display: block; }
.rating > div span svg {
  color: var(--active);
  fill: rgba(0, 0, 0, 0.2);
}
.rating.animate-left > div, .rating.animate-right > div { display: block; }
.rating.animate-left > div span, .rating.animate-right > div span {
  animation: feedstars-scale 0.28s linear 0.24s;
}
.rating.animate-left li.move-to:before {
  animation: feedstars-move-to-left 0.31s ease 0.36s;
}
.rating.animate-left li.move-from:before {
  animation: feedstars-move-to-right 0.28s ease;
}
.rating.animate-left > div { animation: feedstars-double-left 0.32s linear 0.24s; }
.rating.animate-left > div span svg {
  animation: feedstars-left 0.3s ease, feedstars-right-end 0.4s ease 0.4s;
}
.rating.animate-right li.move-to:before {
  animation: feedstars-move-to-right 0.31s ease 0.36s;
}
.rating.animate-right li.move-from:before {
  animation: feedstars-move-to-left 0.28s ease;
}
.rating.animate-right > div { animation: feedstars-double-right 0.32s linear 0.24s; }
.rating.animate-right > div span svg {
  animation: feedstars-right 0.3s ease, feedstars-left-end 0.4s ease 0.4s;
}

@keyframes feedstars-active-4 {
  40% { transform: scale(1.25); }
}
@keyframes feedstars-active-span {
  60% { opacity: 1; }
  100% { transform: scale(1.16); opacity: 0; }
}
@keyframes feedstars-active-5 {
  15% { transform: rotate(180deg) scale(1.1); }
  30% { transform: rotate(360deg) scale(1.2); }
  70% { transform: rotate(360deg) translateY(14%) scaleY(0.72); }
  100% { transform: rotate(360deg); }
}
@keyframes feedstars-double-right {
  60% { filter: drop-shadow(-5px 0 1px var(--active-pale)) drop-shadow(4px 0 1px var(--active-pale)); }
}
@keyframes feedstars-double-left {
  60% { filter: drop-shadow(5px 0 1px var(--active-pale)) drop-shadow(-4px 0 1px var(--active-pale)); }
}
@keyframes feedstars-scale {
  60% { transform: scaleX(1.32); filter: blur(0.5px); }
}
@keyframes feedstars-blink {
  0%, 5%, 15%, 100% { transform: scaleY(1); }
  10% { transform: scaleY(0.4); }
}
@keyframes feedstars-right {
  0%, 100% { transform-origin: 17% 100%; }
  50% { transform: rotate(-12deg) skewX(12deg); }
}
@keyframes feedstars-left {
  0%, 100% { transform-origin: 83% 100%; }
  50% { transform: rotate(12deg) skewX(-12deg); }
}
@keyframes feedstars-right-end {
  0%, 100% { transform-origin: 17% 100%; }
  40% { transform: rotate(-6deg) skewX(4deg) scaleX(0.92); }
  70% { transform: rotate(1deg) skewX(-8deg) scaleX(1.04); }
}
@keyframes feedstars-left-end {
  0%, 100% { transform-origin: 83% 100%; }
  40% { transform: rotate(6deg) skewX(-4deg) scaleX(0.92); }
  70% { transform: rotate(-1deg) skewX(8deg) scaleX(1.04); }
}
@keyframes feedstars-move-to-right {
  40% { transform: translateX(3px) rotate(var(--r)); }
}
@keyframes feedstars-move-to-left {
  40% { transform: translateX(-3px) rotate(var(--r)); }
}
@media (prefers-reduced-motion: reduce) {
  .rating *, .rating *::before, .rating *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

const TEMPLATE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol viewBox="0 0 36 34" id="feedstars-star">
    <path fill="currentColor" d="${STAR_PATH}"/>
  </symbol>
</svg>
<div class="rating" role="radiogroup">
  <ul>
    ${[0,1,2,3,4].map(i => `
      <li role="radio" tabindex="${i === 0 ? 0 : -1}" aria-checked="false" data-index="${i}" aria-label="${i+1} ${i === 0 ? 'star' : 'stars'}">
        ${i >= 3 ? '<span></span>' : ''}
        <svg><use href="#feedstars-star"/></svg>
      </li>
    `).join('')}
  </ul>
  <div><span><svg><use href="#feedstars-star"/></svg></span></div>
</div>
`;

export class FeedStars extends HTMLElement {
  static get observedAttributes() { return ['value', 'disabled']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`;
    this._value = 0;
    this._animating = false;
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this._lis = Array.from(this.shadowRoot.querySelectorAll('li'));
    this._rating = this.shadowRoot.querySelector('.rating');
    this._lis.forEach(li => {
      li.addEventListener('click', this._onClick);
      li.addEventListener('keydown', this._onKeydown);
    });
    const attr = this.getAttribute('value');
    if (attr != null) this._paint(parseInt(attr, 10));
  }

  disconnectedCallback() {
    this._lis?.forEach(li => {
      li.removeEventListener('click', this._onClick);
      li.removeEventListener('keydown', this._onKeydown);
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected) return;
    if (name === 'value' && newVal !== oldVal) {
      const v = parseInt(newVal, 10);
      if (!isNaN(v)) this._paint(v);
    }
  }

  get value() { return this._value; }
  set value(v) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return;
    this._paint(n);
  }

  reset() { this._paint(0); }

  // Snap to a value with no traveling animation. Used for initial paint
  // and explicit reset / programmatic value changes.
  _paint(v) {
    if (!this._lis) return;
    const idx = v >= 1 && v <= 5 ? v - 1 : -1;
    this._lis.forEach((li, i) => {
      li.classList.remove('current', 'active', 'move-to', 'move-from');
      li.classList.toggle('current', i === idx);
      li.classList.toggle('active', i < idx);
      li.setAttribute('aria-checked', i === idx ? 'true' : 'false');
      li.tabIndex = (idx === -1 ? i === 0 : i === idx) ? 0 : -1;
    });
    this._rating.classList.remove('animate-left', 'animate-right');
    this._value = idx === -1 ? 0 : v;
  }

  _onClick(e) {
    const li = e.currentTarget;
    this._animateTo(parseInt(li.dataset.index, 10), { focus: true });
  }

  _onKeydown(e) {
    const cur = this._value > 0 ? this._value - 1 : 0;
    let next = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(4, cur + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, cur - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 4;
    else if (e.key === ' ' || e.key === 'Enter') {
      next = parseInt(e.currentTarget.dataset.index, 10);
    } else return;
    e.preventDefault();
    this._animateTo(next, { focus: true });
  }

  _animateTo(idx, { focus = false } = {}) {
    if (this._animating || idx < 0 || idx > 4) return;
    const lis = this._lis;
    const rating = this._rating;
    const last = rating.querySelector('li.current');
    const lastIdx = last ? lis.indexOf(last) : -1;

    if (idx === lastIdx) {
      if (focus) lis[idx].focus();
      return;
    }

    if (lastIdx === -1) {
      this._paint(idx + 1);
      if (focus) lis[idx].focus();
      this._emit();
      return;
    }

    this._animating = true;
    last.classList.remove('current');
    lis.forEach((li, i) => li.classList.toggle('active', idx > i));

    rating.classList.add(idx > lastIdx ? 'animate-right' : 'animate-left');
    const liEl = lis[idx];
    rating.style.setProperty('--x', liEl.offsetLeft + 'px');
    liEl.classList.add('move-to');
    last.classList.add('move-from');

    setTimeout(() => {
      liEl.classList.add('current');
      liEl.classList.remove('move-to');
      last.classList.remove('move-from');
      rating.classList.remove('animate-left', 'animate-right');
      lis.forEach((l, i) => {
        l.setAttribute('aria-checked', i === idx ? 'true' : 'false');
        l.tabIndex = i === idx ? 0 : -1;
      });
      this._value = idx + 1;
      this._animating = false;
      this._emit();
      if (focus) liEl.focus();
    }, 800);
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this._value },
      bubbles: true,
      composed: true,
    }));
  }
}

export const VERSION = '0.0.1';

if (!customElements.get('feed-stars')) {
  customElements.define('feed-stars', FeedStars);
}

export default FeedStars;
