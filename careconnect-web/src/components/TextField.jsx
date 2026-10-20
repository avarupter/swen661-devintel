import { useId } from "react";

/**
 * Persistent label and helper text stay with the control; an error is explained
 * in words, not by colour alone.
 *
 * aria-describedby points at the helper text, and at the error as well when one
 * is present, so a screen reader reads the guidance and then the problem. The
 * error is NOT a live region: the board is explicit that nothing on this screen
 * is wired, so there is no validation event to announce — a live region here
 * would announce on first render, which is worse than silence.
 *
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   helperText?: string,
 *   errorText?: string,
 *   defaultValue?: string,
 *   disabled?: boolean,
 *   type?: string,
 * }} props
 */
export default function TextField({
  label,
  placeholder,
  helperText,
  errorText,
  defaultValue,
  disabled = false,
  type = "text",
}) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = [helperText ? helperId : null, errorText ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`cc-field${errorText ? " cc-field--error" : ""}`}>
      <label className="cc-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="cc-field__input"
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-describedby={describedBy || undefined}
        aria-invalid={errorText ? true : undefined}
      />
      {helperText ? (
        <p className="cc-field__helper" id={helperId}>
          {helperText}
        </p>
      ) : null}
      {errorText ? (
        <p className="cc-field__error" id={errorId}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
