// <pts-button> stories. The Component/Button docs page (Button.mdx) shows them next to the button/* tokens; only the
// Playground is listed in the sidebar.
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import "@pts/components/button.js";
import type { ButtonSize, ButtonVariant } from "@pts/components/button.js";
import { DENSITIES, THEMES } from "../tokens";

// Placeholder icons, the same glyphs as the Figma placeholders: a 24px grid with a 2px round stroke.
const glyph = (d: string) => (props: { slot?: string }) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const Plus = glyph("M12 5v14M5 12h14");
const ChevronDown = glyph("m6 9 6 6 6-6");
const Close = glyph("M6 6l12 12M18 6 6 18");

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];
const label = (v: string) => v[0].toUpperCase() + v.slice(1);

type Args = {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
  fullWidth: boolean;
  startIcon: boolean;
  endIcon: boolean;
};

const meta = {
  title: "Component/Button",
  tags: ["!dev"],
  args: { label: "Button", variant: "secondary", size: "md", disabled: false, loading: false, fullWidth: false, startIcon: false, endIcon: false },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
  },
  render: ({ label: text, startIcon, endIcon, ...props }) => (
    <pts-button {...props} label={text ? undefined : "Add"}>
      {startIcon && <Plus slot="start" />}
      {text}
      {endIcon && <ChevronDown slot="end" />}
    </pts-button>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: ReactNode }) => <div className="pts-button-row">{children}</div>;

/** Every argument as a control. The only story in the sidebar. */
export const Playground: Story = { tags: ["dev"] };

/** In each theme and density: every variant on the page and on a surface, the sizes with an icon, and focus, disabled, and loading. */
export const Preview: Story = {
  render: () => (
    <div className="pts-button-preview">
      {THEMES.map((theme) =>
        DENSITIES.map((density) => (
          <div key={`${theme}-${density}`} className="pts-button-preview-cell" data-theme={theme} data-density={density}>
            <span className="pts-alias">
              {theme} · {density}
            </span>
            <Row>
              {VARIANTS.map((v) => (
                <pts-button key={v} variant={v}>
                  {label(v)}
                </pts-button>
              ))}
            </Row>
            <div className="pts-button-row pts-button-surface">
              {VARIANTS.map((v) => (
                <pts-button key={v} variant={v}>
                  {label(v)}
                </pts-button>
              ))}
            </div>
            <Row>
              {SIZES.map((s) => (
                <pts-button key={s} variant="primary" size={s}>
                  <Plus slot="start" />
                  {label(s)}
                </pts-button>
              ))}
              <pts-button label="Close">
                <Close slot="start" />
              </pts-button>
            </Row>
            <Row>
              <pts-button variant="secondary" disabled>
                Disabled
              </pts-button>
              <pts-button variant="primary" loading>
                Saving
              </pts-button>
              <pts-button variant="ghost">
                Options
                <ChevronDown slot="end" />
              </pts-button>
            </Row>
          </div>
        )),
      )}
    </div>
  ),
};
