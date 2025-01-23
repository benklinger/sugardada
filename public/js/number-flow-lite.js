const BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';
function createElement(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(el.dataset, v);
    } else if (k === 'className') {
      el.className = v;
    } else if (k === 'textContent') {
      el.textContent = v;
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    el.append(child);
  }
  return el;
}
function visible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}
function offset(el, dir) {
  const rect = el.getBoundingClientRect();
  return rect[dir];
}
function forEach(arr, fn, { reverse = false } = {}) {
  const len = arr.length;
  for (
    let i = reverse ? len - 1 : 0;
    reverse ? i >= 0 : i < len;
    reverse ? i-- : i++
  ) {
    fn(arr[i], i);
  }
}
class ServerSafeHTMLElement extends (BROWSER ? HTMLElement : class {}) {}
const dxVar = '--_number-flow-dx';
const deltaVar = '--_number-flow-d';
const widthDeltaVar = '--_number-flow-d-w';
const opacityDeltaVar = '--_number-flow-d-opacity';
let prefersReducedMotion = null;
if (BROWSER && 'matchMedia' in window) {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
}
let supportsAtProperty = false;
if (BROWSER && CSS && CSS.registerProperty) {
  try {
    CSS.registerProperty({
      name: opacityDeltaVar,
      syntax: '<number>',
      inherits: false,
      initialValue: '0'
    });
    CSS.registerProperty({
      name: dxVar,
      syntax: '<length>',
      inherits: true,
      initialValue: '0px'
    });
    CSS.registerProperty({
      name: widthDeltaVar,
      syntax: '<number>',
      inherits: false,
      initialValue: '0'
    });
    CSS.registerProperty({
      name: deltaVar,
      syntax: '<number>',
      inherits: true,
      initialValue: '0'
    });
    supportsAtProperty = true;
  } catch {}
}
const supportsLinear = BROWSER && CSS && CSS.supports && CSS.supports('animation-timing-function','linear(0.4,0.6)');
const supportsMod = BROWSER && CSS && CSS.supports && CSS.supports('line-height','mod(1,1)');
const canAnimate = supportsMod && supportsLinear && supportsAtProperty;

window.formatToData = function formatToData(value, formatter, prefix, suffix) {
  const parts = formatter.formatToParts(value);
  if (prefix) {
    parts.unshift({ type: 'prefix', value: prefix });
  }
  if (suffix) {
    parts.push({ type: 'suffix', value: suffix });
  }
  const pre = [];
  const _integer = [];
  const fraction = [];
  const post = [];
  const counts = {};
  function generateKey(partType) {
    counts[partType] = (counts[partType] ?? -1) + 1;
    return `${partType}:${counts[partType]}`;
  }
  let valueAsString = '';
  let seenInteger = false;
  let seenDecimal = false;
  for (const part of parts) {
    valueAsString += part.value;
    let type = (part.type === 'minusSign' || part.type === 'plusSign') ? 'sign' : part.type;
    if (type === 'integer') {
      seenInteger = true;
      for (const d of part.value) {
        _integer.push({ type: 'integer', value: parseInt(d, 10) });
      }
    } else if (type === 'group') {
      _integer.push({ type: 'group', value: part.value });
    } else if (type === 'decimal') {
      seenDecimal = true;
      fraction.push({ type, value: part.value, key: generateKey(type) });
    } else if (type === 'fraction') {
      for (const d of part.value) {
        fraction.push({
          type: 'fraction',
          value: parseInt(d, 10),
          key: generateKey('fraction'),
          pos: -1 - counts.fraction
        });
      }
    } else {
      (seenInteger || seenDecimal ? post : pre).push({
        type,
        value: part.value,
        key: generateKey(type)
      });
    }
  }
  const integer = [];
  for (let i = _integer.length - 1; i >= 0; i--) {
    const p = _integer[i];
    if (p.type === 'integer') {
      integer.unshift({
        ...p,
        key: generateKey('integer'),
        pos: counts.integer
      });
    } else {
      integer.unshift({
        ...p,
        key: generateKey(p.type)
      });
    }
  }
  return {
    type: 'number',
    pre,
    integer,
    fraction,
    post,
    valueAsString,
    value
  };
};
window.formatTextToData = function formatTextToData(text) {
  const typed = text.split('').map((c, i) => ({
    type: 'textChar',
    value: c.toUpperCase(),
    key: `char:${i}`
  }));
  return {
    type: 'text',
    pre: [],
    integer: typed,
    fraction: [],
    post: [],
    valueAsString: text,
    value: text
  };
};
const styles = `
:host {
  display: inline-block;
  direction: ltr;
  white-space: nowrap;
  line-height: var(--number-flow-char-height, 1em) !important;
  isolation: isolate;
}
.number,
.number__inner {
  display: inline-block;
  transform-origin: left top;
}
:host([data-will-change]) :is(.number, .number__inner, .section, .digit, .digit__num, .symbol) {
  will-change: transform;
}
.number {
  --scale-x: calc(1 + var(${widthDeltaVar}) / var(--width));
  transform: translateX(var(${dxVar})) scaleX(var(--scale-x));
  margin: 0 calc(-1 * var(--number-flow-mask-width, 0.5em));
  position: relative;
  -webkit-mask-image:
    linear-gradient(
      to right,
      transparent 0,
      #000 calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)),
      #000 calc(100% - calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x))),
      transparent
    ),
    linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--number-flow-mask-height, 0.25em),
      #000 calc(100% - var(--number-flow-mask-height, 0.25em)),
      transparent
    ),
    radial-gradient(at bottom right, #000 0, transparent 71%),
    radial-gradient(at bottom left, #000 0, transparent 71%),
    radial-gradient(at top left, #000 0, transparent 71%),
    radial-gradient(at top right, #000 0, transparent 71%);
  -webkit-mask-size:
    100% calc(100% - var(--number-flow-mask-height, 0.25em) * 2),
    calc(100% - calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)) * 2) 100%,
    calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)) var(--number-flow-mask-height, 0.25em),
    calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)) var(--number-flow-mask-height, 0.25em),
    calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)) var(--number-flow-mask-height, 0.25em),
    calc(var(--number-flow-mask-width, 0.5em) / var(--scale-x)) var(--number-flow-mask-height, 0.25em);
  -webkit-mask-position:
    center,
    center,
    top left,
    top right,
    bottom right,
    bottom left;
  -webkit-mask-repeat: no-repeat;
}
.number__inner {
  padding: calc(var(--number-flow-mask-height, 0.25em) / 2) var(--number-flow-mask-width, 0.5em);
  transform: scaleX(calc(1 / var(--scale-x))) translateX(calc(-1 * var(${dxVar})));
}
:host > :not(.number) {
  z-index: 5;
}
.section,
.symbol {
  display: inline-block;
  position: relative;
  isolation: isolate;
}
.section::after {
  content: '\\200b';
  display: inline-block;
}
.section--justify-left {
  transform-origin: center left;
}
.section--justify-right {
  transform-origin: center right;
}
.section > [inert],
.symbol > [inert] {
  margin: 0 !important;
  position: absolute !important;
  z-index: -1;
}
.digit {
  display: inline-block;
  position: relative;
  --c: var(--current) + var(${deltaVar});
}
.digit__num,
.number .section::after {
  padding: calc(var(--number-flow-mask-height, 0.25em) / 2) 0;
}
.digit__num {
  display: inline-block;
  --offset-raw: mod(var(--length) + var(--n) - mod(var(--c), var(--length)), var(--length));
  --offset: calc(
    var(--offset-raw) - var(--length) * round(down, var(--offset-raw) / (var(--length) / 2), 1)
  );
  --y: clamp(-100%, var(--offset) * 100%, 100%);
  transform: translateY(var(--y));
}
.digit__num[inert] {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(var(--y));
}
.digit:not(.is-spinning) .digit__num[inert] {
  display: none;
}
.symbol__value {
  display: inline-block;
  mix-blend-mode: plus-lighter;
  white-space: pre;
}
.section--justify-left .symbol > [inert] {
  left: 0;
}
.section--justify-right .symbol > [inert] {
  right: 0;
}
.animate-presence {
  opacity: calc(1 + var(${opacityDeltaVar}));
}
`;
window.NumberFlowLite = class NumberFlowLite extends ServerSafeHTMLElement {
  static get defaultProps() {
    return {
      transformTiming: {
        duration: 900,
        easing: 'linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)'
      },
      spinTiming: undefined,
      opacityTiming: { duration: 450, easing: 'ease-out' },
      animated: true,
      trend: (oldVal, newVal) => Math.sign(newVal - oldVal),
      respectMotionPreference: true,
      plugins: undefined,
      digits: undefined
    };
  }
  constructor() {
    super();
    const { animated, ...props } = window.NumberFlowLite.defaultProps;
    this._animated = this.computedAnimated = animated;
    Object.assign(this, props);
  }
  _animated = true;
  _data = undefined;
  _abortAnimationsFinish = undefined;
  _pre = undefined;
  _num = undefined;
  _post = undefined;
  created = false;
  computedTrend = undefined;
  computedAnimated = true;
  manual = false;
  transformTiming;
  spinTiming;
  opacityTiming;
  respectMotionPreference;
  trend;
  plugins;
  digits;
  get animated() {
    return this._animated;
  }
  set animated(val) {
    if (this._animated === val) return;
    this._animated = val;
    this.shadowRoot?.getAnimations().forEach(a => a.finish());
  }
  set data(newData) {
    if (!newData) return;
    const { pre, integer, fraction, post, value } = newData;
    if (!this.created) {
      this._data = newData;
      this.attachShadow({ mode: 'open' });
      if (typeof CSSStyleSheet !== 'undefined' && this.shadowRoot.adoptedStyleSheets) {
        if (!window.NumberFlowLite._sheet) {
          window.NumberFlowLite._sheet = new CSSStyleSheet();
          window.NumberFlowLite._sheet.replaceSync(styles);
        }
        this.shadowRoot.adoptedStyleSheets = [window.NumberFlowLite._sheet];
      } else {
        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        this.shadowRoot.appendChild(styleTag);
      }
      this._pre = new SymbolSection(this, pre, { justify: 'right', part: 'left' });
      this.shadowRoot.appendChild(this._pre.el);
      this._num = new Num(this, integer, fraction);
      this.shadowRoot.appendChild(this._num.el);
      this._post = new SymbolSection(this, post, { justify: 'left', part: 'right' });
      this.shadowRoot.appendChild(this._post.el);
    } else {
      const prev = this._data;
      this._data = newData;
      this.computedTrend = (typeof this.trend === 'function')
        ? this.trend(prev.value, value)
        : this.trend;
      this.computedAnimated =
        canAnimate &&
        this._animated &&
        (!this.respectMotionPreference || !prefersReducedMotion?.matches) &&
        visible(this);
      this.plugins?.forEach(plugin => plugin.onUpdate?.(newData, prev, this));
      if (!this.manual) this.willUpdate();
      this._pre.update(pre);
      this._num.update({ integer, fraction });
      this._post.update(post);
      if (!this.manual) this.didUpdate();
    }
    this.created = true;
  }
  get data() {
    return this._data;
  }
  willUpdate() {
    this._pre.willUpdate();
    this._num.willUpdate();
    this._post.willUpdate();
  }
  didUpdate() {
    if (!this.computedAnimated) return;
    if (this._abortAnimationsFinish) this._abortAnimationsFinish.abort();
    else this.dispatchEvent(new Event('animationsstart'));
    this._pre.didUpdate();
    this._num.didUpdate();
    this._post.didUpdate();
    const controller = new AbortController();
    Promise.all(this.shadowRoot.getAnimations().map(a => a.finished)).then(() => {
      if (!controller.signal.aborted) {
        this.dispatchEvent(new Event('animationsfinish'));
        this._abortAnimationsFinish = undefined;
      }
    });
    this._abortAnimationsFinish = controller;
  }
};
window.NumberFlowLite._sheet = null;
class Num {
  constructor(flow, integer, fraction) {
    this.flow = flow;
    this._integer = new NumberSection(flow, integer, { justify: 'right', part: 'integer' });
    this._fraction = new NumberSection(flow, fraction, { justify: 'left', part: 'fraction' });
    this._inner = createElement('span', { className: 'number__inner' }, [
      this._integer.el,
      this._fraction.el
    ]);
    this.el = createElement('span', { part: 'number', className: 'number' }, [this._inner]);
  }
  willUpdate() {
    this._prevWidth = this.el.offsetWidth;
    this._prevLeft = this.el.getBoundingClientRect().left;
    this._integer.willUpdate();
    this._fraction.willUpdate();
  }
  update({ integer, fraction }) {
    this._integer.update(integer);
    this._fraction.update(fraction);
  }
  didUpdate() {
    const rect = this.el.getBoundingClientRect();
    this._integer.didUpdate();
    this._fraction.didUpdate();
    const dx = this._prevLeft - rect.left;
    const width = this.el.offsetWidth;
    const dWidth = this._prevWidth - width;
    this.el.style.setProperty('--width', String(width));
    this.el.animate(
      {
        [dxVar]: [`${dx}px`, '0px'],
        [widthDeltaVar]: [dWidth, 0]
      },
      {
        ...this.flow.transformTiming,
        composite: 'accumulate'
      }
    );
  }
}
class Section {
  constructor(flow, parts, { justify, className, ...props }, childrenCb) {
    this.flow = flow;
    this.justify = justify;
    this.children = new Map();
    const chars = parts.map(p => this.addChar(p).el);
    this.el = createElement(
      'span',
      {
        ...props,
        className: `section section--justify-${justify} ${className ?? ''}`
      },
      childrenCb ? childrenCb(chars) : chars
    );
  }
  addChar(part, { startDigitsAtZero = false, ...props } = {}) {
    if (part.type === 'integer' || part.type === 'fraction') {
      const comp = new Digit(
        this,
        part.type,
        startDigitsAtZero ? 0 : part.value,
        part.pos,
        { ...props, onRemove: this.onCharRemove(part.key) }
      );
      this.children.set(part.key, comp);
      return comp;
    } else if (part.type === 'textChar' && /^[A-Z]$/.test(part.value)) {
      const comp = new LetterSpin(
        this,
        part.value,
        { startDigitsAtZero: true, animateIn: true, onRemove: this.onCharRemove(part.key) }
      );
      this.children.set(part.key, comp);
      return comp;
    } else {
      const comp = new Sym(
        this,
        part.type,
        part.value,
        { ...props, onRemove: this.onCharRemove(part.key) }
      );
      this.children.set(part.key, comp);
      return comp;
    }
  }
  onCharRemove = (key) => () => {
    this.children.delete(key);
  }
  unpop(char) {
    char.el.removeAttribute('inert');
    char.el.style.top = '';
    char.el.style[this.justify] = '';
  }
  pop(chars) {
    chars.forEach(char => {
      char.el.style.top = `${char.el.offsetTop}px`;
      char.el.style[this.justify] = `${offset(char.el, this.justify)}px`;
    });
    chars.forEach(char => {
      char.el.setAttribute('inert', '');
      char.present = false;
    });
  }
  addNewAndUpdateExisting(parts) {
    const added = new Map();
    const updated = new Map();
    const reverse = (this.justify === 'left');
    const op = reverse ? 'prepend' : 'append';
    forEach(parts, (part) => {
      let comp;
      if (this.children.has(part.key)) {
        comp = this.children.get(part.key);
        updated.set(part, comp);
        this.unpop(comp);
        comp.present = true;
      } else {
        comp = this.addChar(part, { startDigitsAtZero: true, animateIn: true });
        added.set(part, comp);
      }
      this.el[op](comp.el);
    }, { reverse });
    if (this.flow.computedAnimated) {
      const rect = this.el.getBoundingClientRect();
      added.forEach((comp) => comp.willUpdate(rect));
    }
    added.forEach((comp, part) => comp.update(part.value));
    updated.forEach((comp, part) => comp.update(part.value));
  }
  willUpdate() {
    const rect = this.el.getBoundingClientRect();
    this._prevOffset = rect[this.justify];
    this.children.forEach(comp => comp.willUpdate(rect));
  }
  didUpdate() {
    const rect = this.el.getBoundingClientRect();
    this.children.forEach(comp => comp.didUpdate(rect));
    const offsetPos = rect[this.justify];
    const dx = this._prevOffset - offsetPos;
    if (dx && this.children.size) {
      this.el.animate(
        {
          transform: [`translateX(${dx}px)`, 'none']
        },
        {
          ...this.flow.transformTiming,
          composite: 'accumulate'
        }
      );
    }
  }
}
class NumberSection extends Section {
  update(parts) {
    const removed = new Map();
    this.children.forEach((comp, key) => {
      if (!parts.find(p => p.key === key)) {
        removed.set(key, comp);
      }
      this.unpop(comp);
    });
    this.addNewAndUpdateExisting(parts);
    removed.forEach(comp => {
      if (comp instanceof Digit) comp.update(0);
      if (comp instanceof LetterSpin) comp.update('A');
    });
    this.pop(removed);
  }
}
class SymbolSection extends Section {
  update(parts) {
    const removed = new Map();
    this.children.forEach((comp, key) => {
      if (!parts.find(p => p.key === key)) {
        removed.set(key, comp);
      }
    });
    this.pop(removed);
    this.addNewAndUpdateExisting(parts);
  }
}
class AnimatePresence {
  constructor(flow, el, { onRemove, animateIn = false } = {}) {
    this.flow = flow;
    this.el = el;
    this._present = true;
    this._onRemove = onRemove;
    this.el.classList.add('animate-presence');
    if (this.flow.computedAnimated && animateIn) {
      this.el.animate(
        {
          [opacityDeltaVar]: [-0.9999, 0]
        },
        {
          ...this.flow.opacityTiming,
          composite: 'accumulate'
        }
      );
    }
  }
  get present() {
    return this._present;
  }
  set present(val) {
    if (this._present === val) return;
    this._present = val;
    if (!this.flow.computedAnimated) {
      if (!val) this._remove();
      return;
    }
    if (val) {
      this.el.removeAttribute('inert');
    } else {
      this.el.setAttribute('inert', '');
    }
    this.el.style.setProperty('--_number-flow-d-opacity', val ? '0' : '-.999');
    this.el.animate(
      {
        [opacityDeltaVar]: val ? [-0.9999, 0] : [0.999, 0]
      },
      {
        ...this.flow.opacityTiming,
        composite: 'accumulate'
      }
    );
    if (val) {
      this.flow.removeEventListener('animationsfinish', this._remove);
    } else {
      this.flow.addEventListener('animationsfinish', this._remove, { once: true });
    }
  }
  _remove = () => {
    this.el.remove();
    this._onRemove?.();
  }
}
class Char extends AnimatePresence {
  constructor(section, value, el, props) {
    super(section.flow, el, props);
    this.section = section;
    this.value = value;
  }
  willUpdate() {}
  update() {}
  didUpdate() {}
}
class Digit extends Char {
  constructor(section, type, value, pos, props) {
    const length = (section.flow.digits?.[pos]?.max ?? 9) + 1;
    const numbers = Array.from({ length }).map((_, i) => {
      const num = createElement('span', { className: 'digit__num' }, [String(i)]);
      if (i !== value) num.setAttribute('inert', '');
      num.style.setProperty('--n', String(i));
      return num;
    });
    const el = createElement('span', {
      part: `digit ${type}-digit`,
      className: 'digit'
    }, numbers);
    el.style.setProperty('--current', String(value));
    el.style.setProperty('--length', String(length));
    super(section, value, el, props);
    this.pos = pos;
    this._numbers = numbers;
    this.length = length;
  }
  willUpdate(parentRect) {
    const rect = this.el.getBoundingClientRect();
    this._prevValue = this.value;
    const prevOffset = rect[this.section.justify] - parentRect[this.section.justify];
    const halfWidth = rect.width / 2;
    this._prevCenter = (this.section.justify === 'left')
      ? prevOffset + halfWidth
      : prevOffset - halfWidth;
  }
  update(value) {
    this.value = value;
    this.el.style.setProperty('--current', String(value));
    this._numbers.forEach((num, i) => {
      if (i === value) num.removeAttribute('inert');
      else num.setAttribute('inert', '');
    });
  }
  didUpdate(parentRect) {
    const rect = this.el.getBoundingClientRect();
    const offsetPos = rect[this.section.justify] - parentRect[this.section.justify];
    const halfWidth = rect.width / 2;
    const center = (this.section.justify === 'left')
      ? offsetPos + halfWidth
      : offsetPos - halfWidth;
    const dx = this._prevCenter - center;
    if (dx) {
      this.el.animate(
        { transform: [`translateX(${dx}px)`, 'none'] },
        {
          ...this.flow.transformTiming,
          composite: 'accumulate'
        }
      );
    }
    const delta = this.getDelta();
    if (!delta) return;
    this.el.classList.add('is-spinning');
    this.el.animate(
      { [deltaVar]: [-delta, 0] },
      {
        ...(this.flow.spinTiming ?? this.flow.transformTiming),
        composite: 'accumulate'
      }
    );
    this.flow.addEventListener('animationsfinish', this._onAnimationsFinish, { once: true });
  }
  getDelta() {
    if (this.flow.plugins) {
      for (const plugin of this.flow.plugins) {
        const diff = plugin.getDelta?.(this.value, this._prevValue, this);
        if (diff != null) return diff;
      }
    }
    const diff = this.value - this._prevValue;
    const trend = this.flow.computedTrend || Math.sign(diff);
    if (trend < 0 && this.value > this._prevValue) {
      return this.value - this.length - this._prevValue;
    } else if (trend > 0 && this.value < this._prevValue) {
      return this.length - this._prevValue + this.value;
    }
    return diff;
  }
  _onAnimationsFinish = () => {
    this.el.classList.remove('is-spinning');
  }
}
class LetterSpin extends Char {
  static ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  constructor(section, letter, props) {
    const length = LetterSpin.ALPHABET.length;
    const idx = LetterSpin.ALPHABET.indexOf(letter) >= 0 ? LetterSpin.ALPHABET.indexOf(letter) : 0;
    const children = LetterSpin.ALPHABET.map((c, i) => {
      const s = createElement('span', { className: 'digit__num' }, [c]);
      if (i !== idx) s.setAttribute('inert', '');
      s.style.setProperty('--n', String(i));
      return s;
    });
    const el = createElement('span', {
      part: `letter-spin`,
      className: 'digit'
    }, children);
    el.style.setProperty('--current', String(idx));
    el.style.setProperty('--length', String(length));
    super(section, idx, el, props);
    this._numbers = children;
    this.length = length;
    this._prevIndex = idx;
  }
  willUpdate(parentRect) {
    this._prevIndex = this.value;
    const rect = this.el.getBoundingClientRect();
    const prevOffset = rect[this.section.justify] - parentRect[this.section.justify];
    const halfWidth = rect.width / 2;
    this._prevCenter = (this.section.justify === 'left')
      ? prevOffset + halfWidth
      : prevOffset - halfWidth;
  }
  update(letter) {
    let idx = LetterSpin.ALPHABET.indexOf(letter);
    if (idx < 0) idx = 0;
    this.value = idx;
    this.el.style.setProperty('--current', String(idx));
    this._numbers.forEach((span, i) => {
      if (i === idx) span.removeAttribute('inert');
      else span.setAttribute('inert', '');
    });
  }
  didUpdate(parentRect) {
    const rect = this.el.getBoundingClientRect();
    const offsetPos = rect[this.section.justify] - parentRect[this.section.justify];
    const halfWidth = rect.width / 2;
    const center = (this.section.justify === 'left')
      ? offsetPos + halfWidth
      : offsetPos - halfWidth;
    const dx = this._prevCenter - center;
    if (dx) {
      this.el.animate(
        { transform: [`translateX(${dx}px)`, 'none'] },
        {
          ...this.flow.transformTiming,
          composite: 'accumulate'
        }
      );
    }
    const delta = this.getDelta();
    if (!delta) return;
    this.el.classList.add('is-spinning');
    this.el.animate(
      { [deltaVar]: [-delta, 0] },
      {
        ...(this.flow.spinTiming ?? this.flow.transformTiming),
        composite: 'accumulate'
      }
    );
    this.flow.addEventListener('animationsfinish', this._onAnimationsFinish, { once: true });
  }
  getDelta() {
    const newVal = this.value;
    const oldVal = this._prevIndex;
    const diff = newVal - oldVal;
    const trend = this.flow.computedTrend || Math.sign(diff);
    const length = this.length;
    if (trend < 0 && newVal > oldVal) {
      return newVal - length - oldVal;
    } else if (trend > 0 && newVal < oldVal) {
      return length - oldVal + newVal;
    }
    return diff;
  }
  _onAnimationsFinish = () => {
    this.el.classList.remove('is-spinning');
  }
}
class Sym extends Char {
  constructor(section, type, value, props) {
    const val = createElement('span', { className: 'symbol__value', textContent: value });
    const el = createElement(
      'span',
      { part: `symbol ${type}`, className: 'symbol' },
      [val]
    );
    super(section, value, el, props);
    this.type = type;
    this._children = new Map();
    this._children.set(value, new AnimatePresence(this.flow, val, {
      onRemove: this._onChildRemove(value)
    }));
  }
  _onChildRemove = (key) => () => {
    this._children.delete(key);
  }
  willUpdate(parentRect) {
    if (this.type === 'decimal') return;
    const rect = this.el.getBoundingClientRect();
    this._prevOffset = rect[this.section.justify] - parentRect[this.section.justify];
  }
  update(value) {
    if (this.value !== value) {
      const current = this._children.get(this.value);
      current.present = false;
      if (this._children.has(value)) {
        this._children.get(value).present = true;
      } else {
        const newVal = createElement('span', { className: 'symbol__value', textContent: value });
        this.el.appendChild(newVal);
        this._children.set(value, new AnimatePresence(this.flow, newVal, {
          animateIn: true,
          onRemove: this._onChildRemove(value)
        }));
      }
    }
    this.value = value;
  }
  didUpdate(parentRect) {
    if (this.type === 'decimal') return;
    const rect = this.el.getBoundingClientRect();
    const offsetPos = rect[this.section.justify] - parentRect[this.section.justify];
    const dx = this._prevOffset - offsetPos;
    if (dx) {
      this.el.animate(
        { transform: [`translateX(${dx}px)`, 'none'] },
        {
          ...this.flow.transformTiming,
          composite: 'accumulate'
        }
      );
    }
  }
}
customElements.define('number-flow-lite', window.NumberFlowLite);
