import * as React from 'react'
import uuid from 'uuid/v4'

interface Elm {
  Main: {
    init (args: ElmInitArgs): App
  }
}

interface App {
  ports: {
    [key: string]: {
      subscribe (fn: (data: any) => void): void
      send (data: any): void
    }
  }
}

interface ElmInitArgs {
  node: React.RefObject<HTMLDivElement>
}

interface ElmProps {
  [key: string]: any
}

type Listener = (...data: any[]) => void

interface Listeners {
  [key: string]: Listener
}

interface Instance {
  app: App
  listeners: Listeners
  subscriptions: string[]
}

interface Instances {
  [key: string]: Instance
}

function logErr (msg: string) {
  console.error(`react-elm-component: ${msg}`)
}

function isObject (input: any) : input is object {
  if (input === null) return false
  if (typeof input === 'function') return false
  if (typeof input !== 'object') return false
  return true
}

const instances: Instances = { }

function addListener(id: string, name: string, listener: Listener) {
  const instance = instances[id]
  if (!instance) {
    // TODO: handle error
    throw new Error('FIXME')
  }
  instance.listeners[name] = listener
  if (!instance.subscriptions.includes(name)) {
    instance.app.ports[name].subscribe((...payload) => {
      if (instance && instance.listeners[name]) {
        instance.listeners[name](...payload)
        instance.subscriptions.push(name)
      } else {
        // TODO: handle, should never happen
        throw new Error('Deal with me')
      }
    })
  }
}

function wrap <Props extends ElmProps> (elm: Elm) {

  return function (props: Props) {
    if (!isObject(props)) {
      logErr(`props must be of type "object", not ${typeof props}`)
    }

    const node = React.createRef<HTMLDivElement>()
    // can optimize this later
    const [id] = React.useState(uuid())

    // handle if elm has been initialized already (not first run)
    if (instances[id]) {
      const propKeys = Object.keys(props)
      const instance = instances[id]
      // send data to elm instance
      // TODO: only do this when prop value changes? avoid overhead of interop?
      Object
        .keys(props)
        .filter(key => typeof props[key] !== 'function')
        .forEach(key => {
          instances[id].app.ports[key].send(props[key])
        })

      Object
        .keys(props)
        .filter(key => typeof props[key] === 'function')
        .forEach(key => {
          addListener(id, key, props[key])
        })


      // fix subscription list
      const { listeners } = instance
      const subKeys = Object.keys(listeners)
      subKeys.forEach(key => {
        if (typeof props[key] !== 'function') {
          delete listeners[key]
        }
      })
      propKeys.forEach(key => {
        if (typeof listeners[key] !== 'function') {
          listeners[key] = props[key]
        }
      })
    }

    React.useEffect(() => {
      // should only run once, setup instance
      instances[id] = (() => {
        const app = elm.Main.init({
          node,
        })

        return {
          app,
          listeners: {},
          subscriptions: [],
        }
      })()

      // setup inital ports
      Object.keys(props).forEach(key => {
        if (typeof props[key] === 'function') {
          addListener(id, key, props[key])
        } else {
          instances[id].app.ports[key].send(props[key])
        }
      })

      return () => {
        // cleanup instance
        delete instances[id]
      }
    }, [])

    return <div id={id} ref={node} />
  }
}

export { Elm, App, ElmInitArgs }

export default wrap
