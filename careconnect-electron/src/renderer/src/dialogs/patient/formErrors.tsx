import { useId, type Ref } from 'react'
import { Icon } from '../../components/Icon'

/** One invalid field: `field` is the input's id, so the summary can link to it. */
export interface FieldError {
  field: string
  message: string
}

export function errorIdFor(field: string): string {
  return `${field}-error`
}

export function errorFor(errors: readonly FieldError[], field: string): string | undefined {
  return errors.find((error) => error.field === field)?.message
}

/**
 * aria attributes for an input (spec card 07): `aria-invalid` and an
 * `aria-describedby` that points at its error message, plus any hint.
 */
export function fieldA11y(field: string, error: string | undefined, hintId?: string): { 'aria-invalid'?: true; 'aria-describedby'?: string } {
  const describedBy = [hintId, error ? errorIdFor(field) : undefined].filter(Boolean).join(' ')
  return {
    ...(error ? { 'aria-invalid': true as const } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {})
  }
}

/** The message under a field's label. "Error:" is spoken, not shown; the icon carries it visually. */
export function FieldErrorMessage({ field, message }: { field: string; message: string | undefined }): React.JSX.Element | null {
  if (!message) return null
  return (
    <p id={errorIdFor(field)} className="field__error">
      <Icon name="alert" />
      <span>
        <span className="visually-hidden">Error: </span>
        {message}
      </span>
    </p>
  )
}

/**
 * The error summary (spec card 07): shown at the top of the form after a failed
 * submit and focused, with a link to each invalid field.
 */
export function ErrorSummary({ errors, ref }: { errors: readonly FieldError[]; ref?: Ref<HTMLDivElement> }): React.JSX.Element {
  const titleId = useId()
  return (
    <div ref={ref} className="error-summary" role="alert" tabIndex={-1} aria-labelledby={titleId}>
      <h3 id={titleId} className="error-summary__title">
        <Icon name="alert" />
        {errors.length === 1 ? 'There is a problem' : `There are ${errors.length} problems`}
      </h3>
      <ul>
        {errors.map((error) => (
          <li key={error.field}>
            <a
              href={`#${error.field}`}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(error.field)?.focus()
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
