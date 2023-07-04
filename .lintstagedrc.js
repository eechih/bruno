module.exports = {
  // Type check TypeScript files
  '**/*.ts': () => 'pnpm tsc --noEmit',

  // Lint & Prettify TS and JS files
  '**/*.(ts|js)': filenames => {
    return [
      `pnpm eslint ${filenames.join(' ')}`,
      `pnpm prettier --write ${filenames.join(' ')}`,
    ]
  },

  // Running Jest Tests
  '**/*': () => 'pnpm test',

  // Prettify only Markdown and JSON files
  '**/*.(md|json)': filenames => `pnpm prettier --write ${filenames.join(' ')}`,
}
