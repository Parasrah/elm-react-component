import * as R from 'ramda'

import { ElmStep, ElmModule, App, Elm } from '.'

interface AppInit {
  incoming: string[]
  outgoing: string[]
}

interface ModuleInit extends AppInit {
  path: string[]
}

function createMock (moduleArgs: ModuleInit[]): Elm {
  const main: Elm = {
    // we explicitly cast to ElmStep because we want to be able to pass in an elm
    // module and see how it handles it (because this is probably going to be
    // happening
    Elm: moduleArgs.map(createModule).reduce(R.mergeDeepLeft, {}) as ElmStep,
  }

  return main
}

function createApp ({ incoming, outgoing }: AppInit): App {
  return {
    ports: {
      ...(
        incoming
          .map(i => ({
            [i]: {
              send: jest.fn(),
            },
          }))
          .reduce(R.merge, {})
      ),
      ...(
        outgoing
          .map(i => ({
            [i]: {
              subscribe: jest.fn(),
              unsubscribe: jest.fn(),
            },
          }))
          .reduce(R.merge, {})
      ),
    },
  }
}

function createModule ({ path, outgoing, incoming }: ModuleInit): ElmStep | ElmModule {
  if (!path.length) {
    return {
      init: jest.fn().mockReturnValue(createApp({ outgoing, incoming })),
    }
  }

  const [key, ...rest] = path
  return {
    [key]: createModule({ path: rest, incoming, outgoing }),
  }
}

export { ModuleInit }

export default createMock
