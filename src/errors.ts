/*
 * In keeping with Elm, we'd like to have high quality error messages
 */

type Anchor
  = 'install'
  | 'usage'
  | 'opts'
  | 'perf'
  | 'assets'
  | 'cra'

function link (anchor?: Anchor) {
  if (anchor) {
    return `https://github.com/Parasrah/elm-react-component#${anchor}`
  }
  return 'https://github.com/Parasrah/elm-react-component'
}

// we format these as javascript types, as it's more likely they are
// familiar with js
const common = {
  missingOpt: 'It looks like some options are missing!',
  expectedOpt: `We expected your opts to look like this:
  {
    path?: string[]
  }`,
}

const errors = {

  missingPath: `
  ${common.missingOpt}

  ${common.expectedOpt}

  "path" is only optional when you only have a single elm module. If you're seeing
  this error, you've probably passed in more than one. You can figure out your path
  by looking at the top of your elm module (file).

  \`module Elements.Button\` translates to \`path: ['Elements', 'Button']\`

  check out the readme for more information: ${link()}
  `,

  missingRef: `
  TODO: write error
  `,

  invalidElmInstance: `
  TODO: write error
  `,

  invalidPath: `
  TODO: write error
  `,

  missingInstance: `
  TODO: write error
  `,

  missingPort (_: string) {
    return `
    TODO: write error
    `
  },

  invalidProps: `
  TODO: write error
  `,
}

export default errors
