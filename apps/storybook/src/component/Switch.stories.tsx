// <pts-switch> stories. The Component/Switch docs page (Switch.mdx) shows them next to the switch/* tokens; only the
// Playground is listed in the sidebar.
import type { Meta, StoryObj } from "@storybook/react-vite";
import "@pts/components/switch.js";
import { DENSITIES, THEMES } from "../tokens";

type Args = { label: string; checked: boolean; disabled: boolean };

const meta = {
  title: "Component/Switch",
  tags: ["!dev"],
  args: { label: "Notifications", checked: false, disabled: false },
  render: ({ label: text, ...props }) => (
    <pts-switch {...props} label={text ? undefined : "Notifications"}>
      {text}
    </pts-switch>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every argument as a control. The only story in the sidebar. */
export const Playground: Story = { tags: ["dev"] };

const Rows = () => (
  <>
    <pts-switch checked>Notifications</pts-switch>
    <pts-switch>Location</pts-switch>
    <pts-switch disabled>Disabled, off</pts-switch>
    <pts-switch disabled checked>
      Disabled, on
    </pts-switch>
  </>
);

/** In each density (rows) and theme (columns): settings rows on the page and on a surface, off, on, and disabled. */
export const Preview: Story = {
  render: () => (
    <div className="pts-button-preview">
      {DENSITIES.map((density) =>
        THEMES.map((theme) => (
          <div key={`${theme}-${density}`} className="pts-button-preview-cell" data-theme={theme} data-density={density}>
            <span className="pts-alias">
              {theme} · {density}
            </span>
            <div className="pts-switch-rows">
              <Rows />
            </div>
            <div className="pts-switch-rows pts-button-surface">
              <Rows />
            </div>
          </div>
        )),
      )}
    </div>
  ),
};
