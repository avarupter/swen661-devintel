#!/usr/bin/env node
/**
 * Token lint — guards the four invariants the design system rests on.
 *
 * Run: npm run lint:tokens        (CI-friendly: exits 1 on any error)
 *
 * No dependencies. The team already needs Node to run Vite, so this adds
 * nothing to install and nothing to keep up to date.
 *
 * ---------------------------------------------------------------------------
 * The point of this script is NOT that it catches everything. It is that the
 * three conventions below make a violation land in the WRONG FILE, where a
 * reviewer sees it in a pull request's file list before reading a line of CSS:
 *
 *   a hex colour        -> only tokens.css may contain one, so a colour change
 *                          is literally a diff to tokens.css
 *   a font-size literal -> sizes are token references, so a new raw size shows
 *                          up as the only font-size in the repo that is not a
 *                          var()
 *   an unlayered rule   -> every file wraps itself in its @layer, so a missing
 *                          wrapper is a one-line diff at the top of a file
 *
 * The script turns those three review signals into a build failure so they do
 * not depend on anyone remembering.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const STYLES = join('src', 'styles')
const TOKEN_FILE = join(STYLES, 'tokens.css')
const TYPE_FILE = join(STYLES, 'type.css')

/* The published 4px scale, plus the hairlines a border or a focus ring needs.
   0, 1, 2, 3 are allowed because a 1px border and a 3px ring are not spacing. */
const ALLOWED_PX = new Set([0, 1, 2, 3, 4, 8, 12, 16, 20, 24, 32, 40, 56])

const errors = []
const warnings = []
const err = (f, l, m) => errors.push(`${f}:${l}  ${m}`)
const warn = (f, l, m) => warnings.push(`${f}:${l}  ${m}`)

/** Blank out comments but keep every newline, so line numbers stay true. */
const decomment = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.css')) out.push(p)
  }
  return out
}

/* ---------------------------------------------------------------------------
 * 0. THE DECLARED LAYER ORDER MUST MATCH THE IMPORT ORDER.
 *
 * `vite build` STRIPS the `@layer a, b, c;` statement — verified against
 * dist/assets/*.css, where the six @layer blocks survive but the order
 * statement does not. The minifier treats it as redundant because every layer
 * is subsequently defined, which is true of the bundle as it stands and stops
 * being true the moment someone reorders the imports.
 *
 * So in production the real source of truth is the order the layer BLOCKS first
 * appear, i.e. the @import order in styles/index.css. Development (unbundled,
 * statement intact) and production (statement gone) therefore agree only as
 * long as the declared order and the import order agree. This check makes that
 * agreement a build failure rather than a coincidence.
 * ------------------------------------------------------------------------- */
function checkLayerOrder() {
  const entry = join('src', 'styles', 'index.css')
  let src
  try {
    src = decomment(readFileSync(join(root, entry), 'utf8'))
  } catch {
    return err(entry, 0, 'no stylesheet entry point found')
  }

  const stmt = src.match(/@layer\s+([^{;]+);/)
  if (!stmt) return err(entry, 1, 'no `@layer a, b, c;` order statement — layer precedence would depend on import order alone')
  const declared = stmt[1].split(',').map((x) => x.trim()).filter(Boolean)

  const imported = [...src.matchAll(/@import\s+['"]\.\/([^'"]+)['"]/g)].map((m) => m[1])
  const fromImports = []
  for (const name of imported) {
    const body = decomment(readFileSync(join(root, 'src', 'styles', name), 'utf8'))
    const own = body.match(/@layer\s+([a-z0-9-]+)\s*\{/)
    if (!own) { err(join('src', 'styles', name), 1, 'imported file declares no @layer wrapper'); continue }
    if (!fromImports.includes(own[1])) fromImports.push(own[1])
  }

  if (declared.join() !== fromImports.join()) {
    err(entry, 1,
      'declared layer order does not match import order — the build strips the ' +
      '@layer statement, so production would use the import order.\n' +
      `        declared: ${declared.join(' -> ')}\n` +
      `        imports:  ${fromImports.join(' -> ')}`)
  }
  for (const l of fromImports) {
    if (!declared.includes(l)) err(entry, 1, `layer "${l}" is used but missing from the order statement`)
  }
}

const files = walk(join(root, 'src')).map((p) => relative(root, p))
if (files.length === 0) err('src', 0, 'no stylesheets found — is this the right directory?')
checkLayerOrder()

for (const file of files) {
  const raw = readFileSync(join(root, file), 'utf8')
  const css = decomment(raw)
  const lines = css.split('\n')
  const isTokens = file === TOKEN_FILE
  const isType = file === TYPE_FILE
  const isEntry = file === join('src', 'index.css')

  /* ---- 1. Stylesheets live in src/styles/ ------------------------------
     A per-component stylesheet imported from a .jsx file would land outside
     every @layer, and unlayered CSS outranks all six layers including a11y. */
  if (!isEntry && !file.startsWith(STYLES + sep)) {
    err(file, 1, `stylesheet outside ${STYLES}/ — it would be unlayered and outrank the a11y layer`)
  }

  /* ---- 2. Every file wraps its contents in its cascade layer ------------- */
  if (!isEntry) {
    const body = css
      .replace(/@charset[^;]*;/g, '')
      .replace(/@import[^;]*;/g, '')
      .replace(/@layer[^{;]*;/g, '')
      .trim()
    if (body && !/^@layer\s+[a-z0-9-]+\s*\{/.test(body)) {
      err(file, 1, 'rules are not wrapped in a @layer block — unlayered CSS outranks every layer')
    }
  }

  lines.forEach((line, i) => {
    const n = i + 1

    /* ---- 3. Hex colours only in tokens.css ------------------------------ */
    if (!isTokens) {
      const hex = line.match(/#[0-9a-fA-F]{3,8}\b/)
      if (hex) err(file, n, `hard-coded colour ${hex[0]} — add it to tokens.css and reference the token`)
    }

    /* ---- 4. rgb()/hsl() literals are hexes wearing a hat ----------------- */
    if (!isTokens && /\b(rgba?|hsla?|color-mix|oklch)\s*\(/.test(line)) {
      err(file, n, 'colour function outside tokens.css — define the value as a token instead')
    }

    /* ---- 5. THE 16px FLOOR ---------------------------------------------- */
    const fs = line.match(/font-size\s*:\s*([^;}]+)/)
    if (fs) {
      const value = fs[1].trim()
      const rem = value.match(/(\d*\.?\d+)rem/)
      const px = value.match(/(\d*\.?\d+)px/)
      const pct = value.match(/(\d*\.?\d+)%/)

      if (rem && parseFloat(rem[1]) < 1) {
        err(file, n, `font-size ${value} is below the 1rem/16px floor`)
      }
      if (px && parseFloat(px[1]) < 16) {
        err(file, n, `font-size ${value} is below the 16px floor`)
      }
      if (px && parseFloat(px[1]) >= 16 && !isType) {
        err(file, n, `font-size ${value} is a px literal — use rem via a token so it honours the reader's text size (WCAG 1.4.4)`)
      }
      if (pct && parseFloat(pct[1]) < 100) {
        err(file, n, `font-size ${value} shrinks inherited text below the floor`)
      }
      /* A size that is neither a token nor an inherit is a new size. */
      if (!/var\(--cc-[a-z-]+-size\)/.test(value) && !/^(inherit|100%)$/.test(value) && !isTokens) {
        warn(file, n, `font-size ${value} is not a token reference — the scale is five styles, add one to tokens.css if a sixth is really needed`)
      }
    }

    /* ---- 6. Nothing rebases the root font size -------------------------- */
    if (/^\s*html\b/.test(line) || /^\s*:root\b/.test(line)) {
      const next = lines.slice(i, i + 12).join(' ')
      const m = next.match(/font-size\s*:\s*([^;}]+)/)
      if (m && !/^\s*100%\s*$/.test(m[1])) {
        err(file, n, `root font-size is ${m[1].trim()} — rebasing the root puts the whole rem scale under the floor`)
      }
    }

    /* ---- 7. The focus ring is not removable ----------------------------- */
    if (/outline\s*:\s*(none|0)\b/.test(line)) {
      err(file, n, 'outline: none removes the focus indicator — a11y.css owns the ring')
    }
    if (/:focus\b(?!-visible)/.test(line) && !/focus-visible/.test(line)) {
      warn(file, n, ':focus fires on mouse press too — use :focus-visible')
    }
    /* box-shadow is not rendered in forced-colors mode, so a box-shadow ring
       disappears for high-contrast users. */
    if (/box-shadow/.test(line) && /focus/.test(lines.slice(Math.max(0, i - 3), i + 1).join(' '))) {
      err(file, n, 'focus ring drawn with box-shadow — not rendered in forced-colors mode; use outline')
    }

    /* ---- 8. The 1199/1200 trap ------------------------------------------ */
    const mq = line.match(/@media[^{]*max-width\s*:\s*(\d*\.?\d+)px/)
    if (mq) {
      const v = parseFloat(mq[1])
      const msg = v === 1199 || v === 767
        ? `max-width: ${v}px leaves ${v}.01–${v}.99px matching no breakpoint — use min-width only, or ${v}.98px`
        : `max-width breakpoint — this project uses min-width only; see the breakpoint note in tokens.css`
      warn(file, n, msg)
    }

    /* ---- 9. Off-scale spacing ------------------------------------------- */
    if (!isTokens && !/font-size|@media|outline|letter-spacing/.test(line)) {
      /* Drop var() references first, so a token NAME like --cc-space-4 is not
         mistaken for a literal, while a genuine negative offset still is. */
      const bare = line.replace(/var\([^)]*\)/g, '')
      for (const m of bare.matchAll(/(-?\d*\.?\d+)px/g)) {
        const v = Math.abs(parseFloat(m[1]))
        if (!ALLOWED_PX.has(v)) {
          warn(file, n, `${m[1]}px is not on the 4px scale — use a --cc-space-* token`)
        }
      }
    }
  })
}

const label = (xs, kind) => xs.map((x) => `  ${kind}  ${x}`).join('\n')
if (warnings.length) console.log(label(warnings, 'warn ') + '\n')
if (errors.length) {
  console.log(label(errors, 'ERROR'))
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s) in ${files.length} stylesheet(s).`)
  process.exit(1)
}
console.log(`Token lint clean: ${files.length} stylesheet(s), ${warnings.length} warning(s).`)
