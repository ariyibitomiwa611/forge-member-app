import { type ReactNode, useState } from "react";
import { type Scale, type TipKey, TIPS } from "../lib/data";

/** Small "i" button that reveals an explanation on hover or keyboard focus. */
export function InfoTip({ tip, align = "center" }: { tip: TipKey; align?: "center" | "left" }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        type="button"
        className="info-btn"
        aria-label="More information"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        i
      </button>
      {show && (
        <span role="tooltip" className={align === "left" ? "tip left" : "tip"}>
          {TIPS[tip]}
        </span>
      )}
    </>
  );
}

export function FieldLabel({ children, tip }: { children: ReactNode; tip?: TipKey }) {
  return (
    <div className="field-label" style={{ position: "relative" }}>
      {children}
      {tip && <InfoTip tip={tip} align="left" />}
    </div>
  );
}

/** 1–5 picker used for feel and readiness. */
export function ScalePicker({
  value,
  onChange,
  colorFor,
  label,
}: {
  value: Scale | 0 | null;
  onChange: (v: Scale) => void;
  colorFor?: (v: Scale) => string;
  label: string;
}) {
  return (
    <div className="scale" role="group" aria-label={label}>
      {([1, 2, 3, 4, 5] as Scale[]).map((v) => {
        const on = value === v;
        return (
          <button
            type="button"
            key={v}
            className={on ? "on" : undefined}
            aria-pressed={on}
            style={on && colorFor ? { background: colorFor(v) } : undefined}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function Dot({ size, color, outline }: { size: number; color: string; outline?: string }) {
  return (
    <span
      className="dot"
      aria-hidden="true"
      style={{ width: size, height: size, background: color, border: outline ? `1px solid ${outline}` : undefined }}
    />
  );
}
