# react-elm-component

## install

`npm i -S react-elm-component`

## api

The following is an example of an uncontrolled counter component. Yes, it's a lot of boilerplate for something so simple, but it's a great way of testing out Elm without going all in.

```elm
-- src/Counter.elm

port module Button

import Json.Encode as E

-- Ports (interop with props)

port className : (String -> IncomingClass) -> Sub IncomingClass

port onChange : Int -> Cmd msg

port value : (Int -> IncomingValue)


-- Model

type alias Model =
  { class : String
  , value : String
  }


-- Msg

type Msg
  = IncomingClass String
  | IncomingValue Int
  | Increment
  | Decrement


-- Update

update : Msg -> Model -> Model
update msg model =
  case msg of
    IncomingClass class ->
      ( { model | class = class }
      , Cmd.none
      )

    IncomingValue value ->
      ( { model | value = value }
      , Cmd.none
      )

    Increment ->
      ( model
      , onChange +1
      )

    Decrement ->
      ( model
      , onChange -1
      )
      

-- View

view : Model -> Html msg
view model =
  div
    [ class model.class ]
    [ button
      [ onClick Decrement ]
      [ text "-" ]
    , text model.value
    , button
      [ onClick Increment ]
      [ text "+" ]
    ]

```

```typescriptreact
// src/counter.tsx

import wrap from 'react-elm-component'
import Input from './Input.elm'

interface Props {
  value: int
  className: string
  onChange: (int: string) => void
}

export default wrap<Props>(Button)
```

```typescriptreact
// src/index.tsx

import Counter from './Counter.tsx'

export default function () {
  const [count, setCount] = useState(0)

  return <Counter
    value={count}
    className="my-elm-component"
    onChange={(change: int) => setCount(count + change)}
  >
}
```
