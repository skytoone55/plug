import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import DesembouageReport from '@/components/rapports/DesembouageReport'

export const dynamic = 'force-dynamic'

export default async function DesembouageViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: rapport } = await supabaseAdmin
    .from('rapports_desembouage')
    .select('*')
    .eq('id', id)
    .single()

  if (!rapport) notFound()

  return <DesembouageReport rapport={rapport} />
}
