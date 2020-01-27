# @elm-react/component

A library to support interop between React & Elm, using a pattern that fits both languages! Use props & ports seamlessly, see it in action:


```javascript

// Counter.jsx

import wrap from '@elm-react/component'

import Counter from './Counter.elm'

export default wrap(Counter)

```

```elm

-- Counter.elm (just ports)

port className : (String -> msg) -> Sub msg


port value : (Int -> msg) -> Sub msg


port onChange : Int -> Cmd msg

```

```javascript

// App.jsx

import React, { useState } from 'react';

import Counter from './Counter'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Counter
        className="counter"
        value={count}
        onChange={(change) => setCount(count + change)}
      />
    </div>
  );
}

export default App;

```

You can see the full example at [/example](https://github.com/Parasrah/elm-react-component/tree/master/example)

Be sure to check out the [Elm guide](https://guide.elm-lang.org/) if you're new to Elm!

## create-react-app

Many users might not have full control over their webpack config. [The example](https://github.com/Parasrah/elm-react-component/tree/master/example) includes how to get this library working
with Create React App using [@rescripts](https://github.com/harrysolovay/rescripts).
