import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Subscription Manager</h1>
      <div>
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
      </div>
    </div>
  )
}

export default App
