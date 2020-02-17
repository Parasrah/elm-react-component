/*
 * In keeping with Elm, we'd like to have high quality error messages
 */

const libName = '@elm-react/component'

type Anchor
  = 'install'
  | 'usage'
  | 'opts'
  | 'complex-props'
  | 'common-pitfalls'
  | 'asset-size'
  | 'with-elm-webpack-loader'
  | 'with-cra'
  | 'create-react-app'
  | 'issues'

function link (anchor?: Anchor) {
  if (anchor === 'issues') {
    return 'https://github.com/Parasrah/elm-react-component/issues'
  }
  if (anchor) {
    return `https://github.com/Parasrah/elm-react-component#${anchor}`
  }
  return 'https://github.com/Parasrah/elm-react-component'
}

// we format these as javascript types, as it's more likely they are
// familiar with js
const common = {
  wrapDefinition: 'wrap(elm: ElmInstance, opts?: Options)',
  missingOpt: 'It looks like some options are missing!',
  expectedOpt: `We expected your opts to look like this:
  {
    path?: string[]
  }`,
  internalError (code: number) {
    return `
    ${libName} has experienced an internal error. please consider visiting
    ${link('issues')} and opening an issue with the following format:

    title: internal error: ${code}

    description: <empty>
    `
  },
}

const errors = {

  missingRef: common.internalError(1),

  duplicateInstance: common.internalError(2),

  missingInstance: common.internalError(3),

  missingPath: `
  ${common.missingOpt}

  ${common.expectedOpt}

  "path" is only optional when you only have a single elm module. If you're seeing
  this error, you've probably passed in more than one. You can figure out your path
  by looking at the top of your elm module (file).

  \`module Elements.Button\` translates to \`path: ['Elements', 'Button']\`

  check out the readme for more information: ${link()}
  `,

  invalidElmInstance: `
  "wrap" expects the following arguments:

  ${common.wrapDefinition}

  The provided Elm instance does not match what we expected. Maybe you passed in
  arguments in the wrong order?

  You can view ${link('usage')} for help
  `,

  invalidPath: `
  The path provided to ${libName}#wrap could not be
  resolved to an Elm module.

  For more information, please read ${link('opts')}
  `,

  pathRequired: `
  There seems to be multiple elm modules in the elm instance
  passed to ${libName}#wrap

  For more information, please read ${link('opts')}
  `,

  missingPort (name: string) {
    return `
    ${libName}: Unable to find a port for ${name}

    Maybe you passed in a function for an incoming port,
    or an object/primitive for an outgoing port?

    For more information, please read:

    ${link('usage')}

    It's also possible an unforseen prop is being passed
    into the elm component. You can read more here:

    ${link('common-pitfalls')}
    `
  },

  invalidProps: `
  ${libName}: Elm components expect props to be an object
  `,

  invalidOpts: `
  The provided opts to ${libName}#wrap did not match what we expected.

  Please provide opts in the following format:

  ${common.expectedOpt}
  `,
}

export default errors
