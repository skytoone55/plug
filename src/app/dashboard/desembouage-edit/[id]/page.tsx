import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import DesembouageForm from '@/components/forms/DesembouageForm'

export default async function DesembouageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: rapport } = await supabaseAdmin
    .from('rapports_desembouage')
    .select('*')
    .eq('id', id)
    .single()

  if (!rapport) notFound()

  return <DesembouageForm mode="edit" rapport={rapport} />
}
