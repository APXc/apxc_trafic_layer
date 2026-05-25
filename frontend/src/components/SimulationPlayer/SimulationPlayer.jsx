export default function SimulationPlayer({ state, controls }) {
  const { isPlaying, hour, speed, setSpeed, setHour, play, pause, reset } = controls;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="rounded bg-slate-900 px-3 py-1 text-white" onClick={isPlaying ? pause : play}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border border-slate-300 px-3 py-1" onClick={reset}>
          Reset
        </button>
        <select
          className="rounded border border-slate-300 px-2 py-1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1}>1x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
        <span className="text-sm text-slate-600">Stato: {state.status}</span>
      </div>

      <input
        type="range"
        min={0}
        max={24}
        step={1}
        value={hour}
        onChange={(e) => setHour(Number(e.target.value))}
        className="w-full"
      />

      <div className="h-2 w-full rounded bg-slate-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${state.progress || 0}%` }} />
      </div>
      <p className="text-xs text-slate-600">Timeline: {hour}:00 - Progress {state.progress || 0}%</p>
    </div>
  );
}
