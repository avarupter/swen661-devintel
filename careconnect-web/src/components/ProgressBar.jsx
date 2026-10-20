/**
 * The day's progress.
 *
 * The bar itself is aria-hidden and the same number is given in text beside it,
 * so the information does not depend on a progressbar role being understood.
 * The fill is the only place --cc-brand is allowed outside the mark.
 *
 * @param {{ percent: number, label: string }} props
 */
export default function ProgressBar({ percent, label }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="cc-progress">
      <div className="cc-progress__row">
        <span className="cc-progress__label">{label}</span>
        <span className="cc-progress__value">{clamped}%</span>
      </div>
      <div className="cc-progress__track" aria-hidden="true">
        <div className="cc-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
