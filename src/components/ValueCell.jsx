import { getValueStyle } from '../data/config'

// Sel nilai parameter roleplay: hijau (terpenuhi), merah (0/gagal), hitam (N/A)
export default function ValueCell({ value, dense = false }) {
  const style = getValueStyle(value)

  if (style.kind === 'na') {
    return <div className={`${dense ? 'h-7' : 'h-9'} w-full rounded-[3px]`} style={{ backgroundColor: style.bg }} />
  }

  return (
    <div
      className={`flex ${dense ? 'h-7' : 'h-9'} w-full items-center justify-center rounded-[3px] font-mono text-xs font-bold`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </div>
  )
}
