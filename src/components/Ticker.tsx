const ITEMS = [
  'TANPA AKUN',
  'TANPA INSTAL',
  'FOTO DIPROSES DI PERANGKAT',
  'LINK AKTIF 24 JAM',
  'SATU SCAN, SATU STRIP',
]

export function Ticker() {
  const row = (
    <>
      {ITEMS.map((item) => (
        <span className="ticker-item" key={item}>
          {item}
          <span className="ticker-sep" aria-hidden="true">
            //
          </span>
        </span>
      ))}
    </>
  )

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <span className="ticker-row">{row}</span>
        <span className="ticker-row">{row}</span>
      </div>
    </div>
  )
}