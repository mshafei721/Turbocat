import Image from 'next/image'

interface TurbocatLogoProps {
  className?: string
  showText?: boolean
}

export function TurbocatLogo({ className = 'h-6 w-6', showText = false }: TurbocatLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/turbocat-logo.png"
        alt="Turbocat - Multi-Agent AI Coding Platform"
        className={className}
        width={32}
        height={32}
        priority
      />
      {showText && <span className="font-bold text-xl">Turbocat</span>}
    </div>
  )
}
