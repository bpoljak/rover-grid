const TILE_EMOJI = {
  empty:   '',
  rock:    '⬛',
  sample:  '🔵',
  hazard:  '🔴',
  start:   '🟢',
  goal:    '🟠',
}

const DIR_ARROW = { north: '▲', east: '▶', south: '▼', west: '◀' }

export default function GridPanel({ level, rover }) {
  const { width, height, cells } = level.grid

  const tileMap = {}
  for (const cell of cells) {
    tileMap[`${cell.position.x},${cell.position.y}`] = cell.tile
  }

  const rows = []
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      const tile = tileMap[`${x},${y}`] ?? 'empty'
      const isRover = rover.position.x === x && rover.position.y === y

      let cellClass = `cell ${isRover ? 'rover' : tile}`
      let content

      if (isRover) {
        content = (
          <span title={`Rover facing ${rover.direction}`} style={{ fontSize: '1.3rem', lineHeight: 1 }}>
            {DIR_ARROW[rover.direction]}
          </span>
        )
      } else {
        content = TILE_EMOJI[tile] ?? ''
      }

      row.push(
        <div key={x} className={cellClass} title={`(${x},${y}) ${tile}`}>
          {content}
        </div>
      )
    }
    rows.push(<div key={y} className="grid-row">{row}</div>)
  }

  return (
    <div className="panel grid-panel">
      <div className="grid-wrap">{rows}</div>
    </div>
  )
}
