import { qrcodegen } from '@/utils/qr/codegen'
interface QRCodeProps {
  size?: number
  value: string
}

export const QRCode: React.FC<QRCodeProps> = ({ value, size = 160 }) => {
  const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.LOW)
  const modules = qr.getModules()
  const cellSize = size / modules.length
  return (
    <div className="p-4 bg-white border border-border rounded-xl">
      <svg
        viewBox={`0 0 ${modules[0].length * cellSize} ${modules.length * cellSize}`}
        width={modules[0].length * cellSize}
        height={modules.length * cellSize}
      >
        {modules.map((row, rowIndex) =>
          row.map((col, colIndex) => (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill={col ? 'black' : 'white'}
            />
          ))
        )}
      </svg>
    </div>
  )
}
