import * as React from 'react'

interface Elm {
  Main: {
    init (args: InitArgs): App
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

interface InitArgs {
  node: React.RefObject<HTMLDivElement>
}

interface ElmProps {
  [key: string]: any
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

function without <T> (item: T, list: T[]) {
  return list.filter(i => i !== item)
}

type ListEffect <T> = [
  T[],
  (item: T) => void,
  (item: T) => void,
]

function listEffect <T> (initial: T[] = []): ListEffect<T> {
  const [list, setList] = React.useState<T[]>(initial)

  function add (item: T) {
    setList([
      ...without(item, list),
      item
    ])
  }

  function remove (item: T) {
    setList(without(item, list))
  }

  return [list, add, remove]
}

function wrap <Props extends ElmProps> (elm: Elm) {

  return function (props: Props) {
    if (!isObject(props)) {
      logErr(`props must be of type "object", not ${typeof props}`)
    }

    const node = React.createRef<HTMLDivElement>()
    const [firstRun, setFirstRun] = React.useState(true)
    const [app, setApp] = React.useState<App | undefined>(undefined)
    const [propList, addProp, removeProp] = listEffect<string>(Object.keys(props))
    const [subs, addSub, removeSub] = listEffect<string>()

    // ensure we maintain a correct list of prop keys
    const currPropList = Object.keys(props)
    currPropList.forEach(key => {
      if (!propList.includes(key)) {
        addProp(key)
      }
    })
    propList.forEach(key => {
      if (!currPropList.includes(key)) {
        removeProp(key)
      }
    })

    // TODO: what if the function for a prop changes? seems obvious we need some form of store
    // for listeners. Can we use functions in useState though?

    // TODO: what if we moved it ALL into the useEffect and had it run every single update?
    // that would guarantee the order, and that the component is mounted

    React.useEffect(() => {
      const app = elm.Main.init({
        node,
      })

      // setup listeners
      Object.keys(props).forEach(key => {
        if (typeof props[key] === 'function') {
          // this is an "outgoing" port from elm's perspective
          app.ports[key].subscribe((data: any) => {
            // I can't access subs here because it has a closure over an
            // old reference here
            // I need to check if this exists in subs anymore
            // before attempting to call the function
            // like: props[key](data)
            // can't I just check if props[key] is still a function?
            // of course it is, I still have a reference to the old props
            // I don't want to store functions in useState, because I'm not
            // sure that is supported or will be supported in the future
          })
          addSub(key)
        } else {
          // this is an "incoming" port from elm's perspective
          app.ports[key].send(props[key])
        }
      })

      return () => {
        // TODO: have to unsubscribe ports?
      }
    }, [])

    return <div id={id} ref={node} />
  }
}

export default wrap
