# [Example](#example)

While this example is specifically targeting CRA users due to the added complexity, there is useful information here regardless of your setup.

## How to get @elm-react/component working with Create React App?

First, install [@rescripts/cli](https://github.com/harrysolovay/rescripts), [@elm-react/rescripts-elm](https://github.com/Parasrah/rescripts-elm), [elm](https://elm-lang.org/) and [elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader) as dev dependencies:

`npm i -D @rescripts/cli @elm-react/rescripts-elm elm elm-webpack-loader`

> Or using yarn: `yarn add -D @rescripts/cli @elm-react/rescripts-elm elm elm-webpack-loader`

update your `package.json`:

```diff

  "scripts": {
-   "start": "react-scripts start",
+   "start": "rescripts start",
-   "build": "react-scripts build",
+   "build": "rescripts build",
-   "test": "react-scripts test",
+   "test": "rescripts test",
-   "eject": "react-scripts eject"
  },
  .
  .
  .
+ "rescripts": [
+   "@elm-react/rescripts-elm"
+ ]

```

From here you should be able to follow the [guide](https://github.com/Parasrah/elm-react-component#description) for this library! Enjoy using Elm! And be sure to check out the [guide](https://guide.elm-lang.org/) if you're new!
