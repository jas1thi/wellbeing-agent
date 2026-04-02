import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const MOOD_COLORS = {
  Great: '#10b981',
  Good: '#34d399',
  Okay: '#fbbf24',
  Low: '#f87171',
  Anxious: '#fb923c',
  Mixed: '#a78bfa',
}

export default function MoodChart({ distribution }) {
  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No mood data yet
      </div>
    )
  }

  const data = Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0 relative" style={{ width: 150, height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={3}
              cornerRadius={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={MOOD_COLORS[entry.name] || '#a78bfa'} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const { name, value } = payload[0].payload
                const pct = Math.round((value / total) * 100)
                return (
                  <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs font-medium text-text-primary">{name}</p>
                    <p className="text-[11px] text-text-muted">{value} entries ({pct}%)</p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-text-primary">{total}</span>
          <span className="text-[10px] text-text-muted">entries</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {data.map(({ name, value }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MOOD_COLORS[name] || '#a78bfa' }}
                  />
                  <span className="text-xs font-medium text-text-secondary">{name}</span>
                </div>
                <span className="text-xs tabular-nums text-text-muted">{value} ({pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: MOOD_COLORS[name] || '#a78bfa',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
