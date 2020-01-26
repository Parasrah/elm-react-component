import React, { useState } from 'react';
import './App.css';
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
