/**
 * Babel config — used by Jest (babel-jest) only.
 *
 * Vite never reads this file: @vitejs/plugin-react runs Babel with
 * `babelrc: false, configFile: false`, and `vite build` compiles with esbuild.
 * babel-jest finds it automatically and turns the app's TypeScript + JSX +
 * ES modules into CommonJS that Jest can run on the current Node version.
 *
 * `.cjs` because package.json has "type": "module".
 */

/**
 * Vite replaces `import.meta.env.*` at build time. Under Jest the code runs as
 * CommonJS, where `import.meta` is a SyntaxError, so rewrite it to a plain
 * global object that the test setup owns:
 *
 *   import.meta.env.PROD   →  globalThis.__VITE_ENV__.PROD
 *   import.meta            →  ({ env: globalThis.__VITE_ENV__ })
 *
 * Defaults live in src/test/setup.ts; a test can change a value before the
 * code reads it (registerSW reads PROD at call time, ChatBot reads the
 * Supabase URL once, at import time).
 */
function importMetaEnvToGlobal({ types: t }) {
  const envGlobal = () =>
    t.memberExpression(t.identifier('globalThis'), t.identifier('__VITE_ENV__'));

  return {
    name: 'careconnect-import-meta-env',
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name !== 'import' || property.name !== 'meta') return;

        const parent = path.parentPath;
        if (
          parent.isMemberExpression() &&
          parent.node.object === path.node &&
          !parent.node.computed &&
          t.isIdentifier(parent.node.property, { name: 'env' })
        ) {
          parent.replaceWith(envGlobal());
        } else {
          path.replaceWith(
            t.objectExpression([t.objectProperty(t.identifier('env'), envGlobal())]),
          );
        }
      },
    },
  };
}

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [importMetaEnvToGlobal],
};
