import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DesembouageReport from '@/components/rapports/DesembouageReport'

export default async function DesembouageViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: rapport } = await supabase
    .from('rapports_desembouage')
    .select('*')
    .eq('id', id)
    .single()

  if (!rapport) notFound()

  return <DesembouageReport rapport={rapport} />
}
