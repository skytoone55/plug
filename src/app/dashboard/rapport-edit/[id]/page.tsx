import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import EquilibrageForm from '@/components/forms/EquilibrageForm'

export default async function RapportEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: rapport } = await supabaseAdmin
    .from('rapports_equilibrage')
    .select('*')
    .eq('id', id)
    .single()

  if (!rapport) notFound()

  return <EquilibrageForm mode="edit" rapport={rapport} />
}
