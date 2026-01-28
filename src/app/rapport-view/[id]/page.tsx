import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EquilibrageReport from '@/components/rapports/EquilibrageReport'

export default async function RapportViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: rapport } = await supabase
    .from('rapports_equilibrage')
    .select('*')
    .eq('id', id)
    .single()

  if (!rapport) notFound()

  return <EquilibrageReport rapport={rapport} />
}
