import {
  BarChart3,
  CircleDot,
  HeartPulse,
  Sprout,
  Milk,
  Wallet,
  DollarSign,
  FileText,
  Users,
  Beef,
  Mountain,
  Cloud,
  Egg,
  PiggyBank,
  PawPrint
} from 'lucide-vue-next'

export const navIconMap = {
  grid: BarChart3,
  circle: CircleDot,
  heart: HeartPulse,
  sprout: Sprout,
  bottle: Milk,
  wallet: Wallet,
  dollar: DollarSign,
  report: FileText,
  users: Users
}

export function animalIcon(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('cattle') || t.includes('cow')) return Beef
  if (t.includes('goat')) return Mountain
  if (t.includes('sheep')) return Cloud
  if (t.includes('poultry') || t.includes('chicken')) return Egg
  if (t.includes('pig')) return PiggyBank
  return PawPrint
}
