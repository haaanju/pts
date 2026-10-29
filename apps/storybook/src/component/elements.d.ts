// JSX types for the @pts/components custom elements, so stories type-check their attributes (ADR 0032).
// React 19 passes a prop to a custom element as a property when the element has one (variant, disabled, fullWidth, …).
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { ButtonSize, ButtonType, ButtonVariant, PtsButton } from "@pts/components/button.js";
import type { PtsSwitch } from "@pts/components/switch.js";

type ButtonProps = DetailedHTMLProps<HTMLAttributes<PtsButton>, PtsButton> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  label?: string;
};

type SwitchProps = DetailedHTMLProps<HTMLAttributes<PtsSwitch>, PtsSwitch> & {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  label?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pts-button": ButtonProps;
      "pts-switch": SwitchProps;
    }
  }
}
