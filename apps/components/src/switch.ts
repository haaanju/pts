// <pts-switch>: the Switch spec of ADR 0077 as a web component.
// A real <input type="checkbox" role="switch"> inside a shadow root does the keyboard, role, and screen-reader work;
// the host adds what an input inside a shadow root can't do on its own (taking part in the surrounding form, a change
// event the page can hear) and the state the spec adds (aria-disabled that stays focusable). Styles read the switch/*
// tokens from @pts/web/tokens.css, which the page loads, so data-theme and data-density reach them unchanged.
import { css, html, LitElement, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

export class PtsSwitch extends LitElement {
  static formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    name: { reflect: true },
    value: {},
    label: {},
    hasLabel: { state: true },
  };

  /** On. The attribute is the starting state, which a form reset returns to. */
  declare checked: boolean;
  /** Unavailable: dimmed, ignores clicks and keys, but stays focusable (aria-disabled), so it can be found and explained */
  declare disabled: boolean;
  /** The form field's name */
  declare name: string | undefined;
  /** What the form submits while on ("on" by default, as a checkbox); nothing is submitted while off */
  declare value: string;
  /** The accessible name. Required when the switch has no text. */
  declare label: string | undefined;

  declare protected hasLabel: boolean;

  readonly #internals = this.attachInternals();
  #default = false;
  #warned = false;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.value = "on";
    this.hasLabel = true;
    // Registered first and in the capture phase, so it runs before any listener a page adds to <pts-switch>.
    this.addEventListener("click", this.#blockDisabled, { capture: true });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#default = this.hasAttribute("checked");
  }

  #blockDisabled = (event: Event) => {
    if (!this.disabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  #onClick(event: MouseEvent) {
    // Prevented, a checkbox's click undoes its toggle; stopped, it never reaches the host or the page.
    if (!this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
  }

  #onChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    // change doesn't cross the shadow root (input does), so the host fires its own
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  formResetCallback() {
    this.checked = this.#default;
  }

  /** Whether the default slot has text. Runs after the first render too: an empty slot never fires slotchange. */
  #syncSlots = () => {
    const nodes = this.renderRoot.querySelector<HTMLSlotElement>("slot")?.assignedNodes({ flatten: true }) ?? [];
    this.hasLabel = nodes.some((node) => (node.textContent ?? "").trim() !== "");
  };

  protected override firstUpdated() {
    this.#syncSlots();
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has("checked") || changed.has("value")) this.#internals.setFormValue(this.checked ? this.value : null);
    if ((changed.has("hasLabel") || changed.has("label")) && !this.hasLabel && !this.label && !this.#warned) {
      this.#warned = true;
      console.warn("<pts-switch> has no text and no label attribute, so it has no accessible name.", this);
    }
  }

  protected override render() {
    return html`<label class=${this.hasLabel ? "" : "no-label"}>
      <span class="label"><slot @slotchange=${this.#syncSlots}></slot></span>
      <span class="track">
        <input
          type="checkbox"
          role="switch"
          .checked=${this.checked}
          aria-label=${ifDefined(this.label)}
          aria-disabled=${this.disabled ? "true" : "false"}
          @click=${this.#onClick}
          @change=${this.#onChange}
        />
        <span class="thumb"></span>
      </span>
    </label>`;
  }

  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      /* off, the default */
      --_surface: var(--switch-off-surface-rest);
      --_surface-hover: var(--switch-off-surface-hover);
      --_surface-pressed: var(--switch-off-surface-pressed);
      --_content: var(--switch-off-content);
      --_border: var(--switch-off-border);
      --_label: var(--switch-label-content);
    }
    :host([checked]) {
      --_surface: var(--switch-on-surface-rest);
      --_surface-hover: var(--switch-on-surface-hover);
      --_surface-pressed: var(--switch-on-surface-pressed);
      --_content: var(--switch-on-content);
      --_border: transparent;
    }
    :host([disabled]) {
      --_surface: var(--switch-disabled-off-surface);
      --_content: var(--switch-disabled-off-content);
      --_border: var(--switch-disabled-off-border);
      --_label: var(--switch-disabled-off-content);
    }
    :host([disabled][checked]) {
      --_surface: var(--switch-disabled-on-surface);
      --_content: var(--switch-disabled-on-content);
      --_border: transparent;
    }

    /* The label comes first and takes the room left, so a switch given a width puts its track at the end, as in a
       settings row. */
    label {
      display: inline-flex;
      flex: 1;
      align-items: center;
      gap: var(--switch-gap);
      color: var(--_label);
      font: var(--switch-label-text);
      letter-spacing: var(--switch-label-text-letter-spacing);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    label.no-label {
      gap: 0;
    }
    label.no-label .label {
      display: none;
    }
    .label {
      flex: 1;
    }
    :host([disabled]) label {
      cursor: not-allowed;
    }

    .track {
      box-sizing: border-box;
      position: relative;
      flex: none;
      width: var(--switch-track-width);
      height: var(--switch-track-height);
      border: var(--switch-border-width) solid var(--_border);
      border-radius: var(--switch-radius);
      background: var(--_surface);
      transition-property: background-color, border-color;
      transition-duration: var(--motion-duration-fast);
      transition-timing-function: var(--motion-easing-standard);
    }
    :host(:not([disabled])) label:hover .track {
      background: var(--_surface-hover);
    }
    :host(:not([disabled])) label:active .track {
      background: var(--_surface-pressed);
    }
    .track:has(input:focus-visible) {
      outline: var(--focus-ring-width) solid var(--border-focus);
      outline-offset: var(--focus-ring-offset);
    }

    /* the input covers the whole track, border included, so a click anywhere on it toggles */
    input {
      position: absolute;
      inset: calc(-1 * var(--switch-border-width));
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    input:focus {
      outline: none;
    }

    /* The thumb sits switch/thumb/inset from the track's outer edge, as in the Figma component, where the stroke is
       inside the frame; positions start inside the border, so the border width comes off. */
    .thumb {
      position: absolute;
      top: calc(var(--switch-thumb-inset) - var(--switch-border-width));
      left: calc(var(--switch-thumb-inset) - var(--switch-border-width));
      width: var(--switch-thumb-size);
      height: var(--switch-thumb-size);
      border-radius: var(--switch-radius);
      background: var(--_content);
      pointer-events: none;
      transition-property: transform, background-color;
      transition-duration: var(--motion-duration-fast);
      transition-timing-function: var(--motion-easing-standard);
    }
    :host([checked]) .thumb {
      transform: translateX(calc(var(--switch-track-width) - var(--switch-thumb-size) - 2 * var(--switch-thumb-inset)));
    }

    @media (prefers-reduced-motion: reduce) {
      .track,
      .thumb {
        transition: none;
      }
    }
  `;
}

if (!customElements.get("pts-switch")) customElements.define("pts-switch", PtsSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "pts-switch": PtsSwitch;
  }
}
