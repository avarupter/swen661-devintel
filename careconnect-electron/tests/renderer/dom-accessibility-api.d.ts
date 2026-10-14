// The package ships typings, but its "exports" map hides them from bundler-style resolution.
declare module 'dom-accessibility-api' {
  export function computeAccessibleName(root: Element): string
}
