import { useId } from "react";

/**
 * Persistent label and helper text stay with the control; an error is explained
 * in words, not by colour alone.
 *
 * aria-describedby points at the helper text, and at the error as well when one
 * is present, so a screen reader reads the guidance and then the problem. The
 * error is NOT a live region. A form validates on submit and moves focus to the
 * first invalid field, whose label, helper and error are then read through
 * aria-describedby (content-messages-help.md §4.5). A live region here would
 * announce on first render, and two errors appearing at once would collide.
 *
 * Uncontrolled with `defaultValue`, or controlled with `value` and `onChange`.
 * `multiline` renders a <textarea> of `rows` lines in place of the <input>,
 * with the same label, helper and error wiring. `id` replaces the generated id
 * when a page needs a stable one, and `inputRef` reaches the input or textarea,
 * so a page can move focus to it.
 *
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   helperText?: string,
 *   errorText?: string,
 *   defaultValue?: string,
 *   value?: string,
 *   onChange?: (event: import('react').ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
 *   name?: string,
 *   id?: string,
 *   required?: boolean,
 *   maxLength?: number,
 *   autoComplete?: string,
 *   disabled?: boolean,
 *   type?: string,
 *   multiline?: boolean,
 *   rows?: number,
 *   inputRef?: import('react').Ref<HTMLInputElement | HTMLTextAreaElement>,
 * }} props
 */
export default function TextField({
  label,
  placeholder,
  helperText,
  errorText,
  defaultValue,
  value,
  onChange,
  name,
  id,
  required,
  maxLength,
  autoComplete,
  disabled = false,
  type = "text",
  multiline = false,
  rows = 4,
  inputRef,
}) {
  // Called on every render, so the hook order never depends on the props.
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const describedBy = [helperText ? helperId : null, errorText ? errorId : null]
    .filter(Boolean)
    .join(" ");

  // Everything the input and the textarea share, so the two cannot drift.
  const control = {
    id: fieldId,
    className: "cc-field__input",
    name,
    placeholder,
    value,
    defaultValue,
    onChange,
    required,
    maxLength,
    autoComplete,
    disabled,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": errorText ? true : undefined,
  };

  return (
    <div className={`cc-field${errorText ? " cc-field--error" : ""}`}>
      <label className="cc-field__label" htmlFor={fieldId}>
        {label}
      </label>
      {multiline ? (
        <textarea ref={inputRef} rows={rows} {...control} />
      ) : (
        <input ref={inputRef} type={type} {...control} />
      )}
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
