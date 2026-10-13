// <pts-button>: the Button spec of ADR 0032 as a web component.
// A real <button> inside a shadow root does the keyboard, role, and screen-reader work; the host adds what a button
// inside a shadow root can't do on its own (submitting the surrounding form) and the states the spec adds
// (aria-disabled that stays focusable, loading). Styles read the button/* tokens from @pts/web/tokens.css, which the
// page loads: custom properties inherit into the shadow root, so data-theme, data-density, and data-shape reach it
// unchanged.
import { css, html, LitElement, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";
export type ButtonType = "button" | "submit" | "reset";

export class PtsButton extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    variant: { reflect: true },
    size: { reflect: true },
    type: { reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, reflect: true, attribute: "full-width" },
    label: {},
    hasLabel: { state: true },
  };

  /** primary: the main action, at most one per group; secondary (default): every other action; ghost: low emphasis; danger: destructive */
  declare variant: ButtonVariant;
  /** sm or md (default): the height of inputs and selects of the same size */
  declare size: ButtonSize;
  /** button (default), submit, or reset. Not submit by default, so a button never submits a form by accident. */
  declare type: ButtonType;
  /** Unavailable: dimmed, ignores clicks, but stays focusable (aria-disabled), so it can be found and explained */
  declare disabled: boolean;
  /** Working: a spinner replaces the content at the same width; ignores clicks and stays focusable (aria-busy) */
  declare loading: boolean;
  /** Fills the container, content centered */
  declare fullWidth: boolean;
  /** The accessible name. Required when the button has no text (icon-only). */
  declare label: string | undefined;

  declare protected hasLabel: boolean;

  readonly #internals = this.attachInternals();
  #warned = false;

  constructor() {
    super();
    this.variant = "secondary";
    this.size = "md";
    this.type = "button";
    this.disabled = false;
    this.loading = false;
    this.fullWidth = false;
    this.hasLabel = true;
    // Registered first and in the capture phase, so it runs before any listener a page adds to <pts-button>.
    this.addEventListener("click", this.#blockInactive, { capture: true });
  }

  get #inactive() {
    return this.disabled || this.loading;
  }

  #blockInactive = (event: Event) => {
    if (!this.#inactive) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  #onClick(event: MouseEvent) {
    if (this.#inactive) {
      // Stops the click inside the shadow root, so it never reaches the host or the page.
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === "submit") form.requestSubmit();
    else if (this.type === "reset") form.reset();
  }

  /** Whether the default slot has text. Runs after the first render too: an empty slot never fires slotchange. */
  #syncSlots = () => {
    const nodes = this.renderRoot.querySelector<HTMLSlotElement>("slot:not([name])")?.assignedNodes({ flatten: true }) ?? [];
    // Text makes a label; a button with only icons is icon-only (square, named by the label attribute)
    this.hasLabel = nodes.some((node) => (node.textContent ?? "").trim() !== "");
  };

  protected override firstUpdated() {
    this.#syncSlots();
  }

  protected override updated(changed: PropertyValues) {
    if ((changed.has("hasLabel") || changed.has("label")) && !this.hasLabel && !this.label && !this.#warned) {
      this.#warned = true;
      console.warn("<pts-button> has no text and no label attribute, so it has no accessible name.", this);
    }
  }

  protected override render() {
    return html`<button
      type="button"
      class=${this.hasLabel ? "" : "icon-only"}
      aria-label=${ifDefined(this.label)}
      aria-disabled=${this.disabled ? "true" : "false"}
      aria-busy=${this.loading ? "true" : "false"}
      @click=${this.#onClick}
    >
      <span class="content">
        <slot name="start"></slot>
        <span class="label"><slot @slotchange=${this.#syncSlots}></slot></span>
        <slot name="end"></slot>
      </span>
      ${this.loading ? html`<svg class="spinner" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" pathLength="100" /></svg>` : null}
    </button>`;
  }

  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      /* md, the default size; sm below */
      --_height: var(--button-md-height);
      --_padding: var(--button-md-padding-base);
      --_padding-icon: var(--button-md-padding-icon-side);
      --_gap: var(--button-md-gap);
      --_icon: var(--button-md-icon);
      --_label: var(--button-md-label);
      --_tracking: var(--button-md-label-letter-spacing);
      /* secondary, the default variant */
      --_surface: var(--button-secondary-surface-rest);
      --_surface-hover: var(--button-secondary-surface-hover);
      --_surface-pressed: var(--button-secondary-surface-pressed);
      --_content: var(--button-secondary-content);
      --_border: var(--button-secondary-border);
    }
    :host([size="sm"]) {
      --_height: var(--button-sm-height);
      --_padding: var(--button-sm-padding-base);
      --_padding-icon: var(--button-sm-padding-icon-side);
      --_gap: var(--button-sm-gap);
      --_icon: var(--button-sm-icon);
      --_label: var(--button-sm-label);
      --_tracking: var(--button-sm-label-letter-spacing);
    }
    :host([variant="primary"]) {
      --_surface: var(--button-primary-surface-rest);
      --_surface-hover: var(--button-primary-surface-hover);
      --_surface-pressed: var(--button-primary-surface-pressed);
      --_content: var(--button-primary-content);
      --_border: transparent;
    }
    :host([variant="ghost"]) {
      --_surface: transparent;
      --_surface-hover: var(--button-ghost-surface-hover);
      --_surface-pressed: var(--button-ghost-surface-pressed);
      --_content: var(--button-ghost-content);
      --_border: transparent;
    }
    :host([variant="danger"]) {
      --_surface: var(--button-danger-surface-rest);
      --_surface-hover: var(--button-danger-surface-hover);
      --_surface-pressed: var(--button-danger-surface-pressed);
      --_content: var(--button-danger-content);
      --_border: transparent;
    }
    /* Disabled: the shared colors; ghost keeps no fill, and only secondary draws the outline */
    :host([disabled]) {
      --_surface: var(--button-disabled-surface);
      --_content: var(--button-disabled-content);
    }
    :host([disabled][variant="ghost"]) {
      --_surface: transparent;
    }
    :host([disabled][variant="secondary"]),
    :host([disabled]:not([variant])) {
      --_border: var(--button-disabled-border);
    }
    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    button {
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      height: var(--_height);
      margin: 0;
      /* the height comes from the control size; the label is centered, with no vertical padding.
         The sides pad the icon-side step; the label adds the rest (ADR 0055) */
      padding: 0 var(--_padding-icon);
      border: var(--button-border-width) solid var(--_border);
      border-radius: var(--button-radius);
      background: var(--_surface);
      color: var(--_content);
      font: var(--_label);
      letter-spacing: var(--_tracking);
      white-space: nowrap;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition-property: background-color, border-color, color;
      transition-duration: var(--motion-duration-fast);
      transition-timing-function: var(--motion-easing-standard);
    }
    button.icon-only {
      width: var(--_height);
      padding: 0;
    }
    button.icon-only .label {
      display: none;
    }
    :host(:not([disabled]):not([loading])) button:hover {
      background: var(--_surface-hover);
    }
    :host(:not([disabled]):not([loading])) button:active {
      background: var(--_surface-pressed);
    }
    :host([disabled]) button {
      cursor: not-allowed;
    }
    :host([loading]) button {
      cursor: progress;
    }
    button:focus {
      outline: none;
    }
    button:focus-visible {
      outline: var(--focus-ring-width) solid var(--border-focus);
      outline-offset: var(--focus-ring-offset);
    }

    /* The layers of the Figma component (ADR 0055): the icon side pads one padding step less, since an icon reads
       heavier than text, without knowing which side has an icon. The button pads padding/icon-side, the label adds
       the difference on both sides, and the gap gives it back next to an icon. It needs gap >= the difference
       (pts/icon-side-padding): a negative gap is invalid and would be dropped without a warning. */
    .content {
      display: inline-flex;
      align-items: center;
      gap: calc(var(--_gap) - (var(--_padding) - var(--_padding-icon)));
    }
    .label {
      display: inline-flex;
      padding-inline: calc(var(--_padding) - var(--_padding-icon));
    }
    /* loading keeps the content in place, transparent rather than hidden, so the width holds and it stays the accessible name */
    :host([loading]) .content {
      opacity: 0;
    }
    ::slotted([slot="start"]),
    ::slotted([slot="end"]),
    ::slotted(svg) {
      flex: none;
      width: var(--_icon);
      height: var(--_icon);
    }
    slot:not([name]) {
      display: contents;
    }

    .spinner {
      position: absolute;
      inset: 0;
      width: var(--_icon);
      height: var(--_icon);
      margin: auto;
      /* the spinner's speed is not a design token: motion tokens time transitions, not loops */
      animation: pts-button-spin 1s linear infinite;
    }
    .spinner circle {
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-dasharray: 70 100;
    }
    @keyframes pts-button-spin {
      to {
        transform: rotate(1turn);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
      /* the spinner keeps turning: it is the only sign that something is happening (WCAG 2.3.3) */
    }
  `;
}

if (!customElements.get("pts-button")) customElements.define("pts-button", PtsButton);

declare global {
  interface HTMLElementTagNameMap {
    "pts-button": PtsButton;
  }
}
