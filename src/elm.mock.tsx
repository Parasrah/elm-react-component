import * as React from 'react'

import { Elm, ElmInitArgs } from '.'

interface MockInit {
  incoming: string[]
  outgoing: string[]
}

interface Mock extends Elm {
  getRef (): React.RefObject<HTMLDivElement> | undefined
}

function createMock ({ incoming, outgoing }: MockInit): Mock {
  let ref: React.RefObject<HTMLDivElement> | undefined

  return {
    Main: {
      init ({ node }: ElmInitArgs) {
        ref = node
        return {
          ports: new Proxy({}, {
            get (_, key: string, __) {
              if (incoming.includes(key)) {
                return {
                  send: jest.fn(),
                }
              } else if (outgoing.includes(key)) {
                return {
                  subscribe: jest.fn(),
                }
              } else {
                throw new Error(`there is no existing port for ${key}`)
              }
            },
          }),
        }
      },
    },
    getRef () { return ref },
  }
}

export { Mock, MockInit }

export default createMock
