import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const styles = {
  PENDING: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  APPROVED: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  EXPIRED: 'bg-red-100 text-red-800 hover:bg-red-100',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
}

export default function StatusBadge({ status }) {
  const key = status?.toUpperCase()
  return (
    <Badge variant="secondary" className={cn('font-medium', styles[key])}>
      {key}
    </Badge>
  )
}
