import browser from 'webextension-polyfill'

const App = () => {
  return (
    <main style={{ width: 300 }}>
      DCSS Stats WebTiles Extension
      <hr />
      <div>
        <button type="button" onClick={() => browser.storage.local.clear()}>
          Clear extension cache
        </button>
      </div>
    </main>
  )
}

export default App
