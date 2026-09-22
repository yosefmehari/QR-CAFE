import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ComplainAliasPage({ searchParams }: Props) {
  const resolvedParams = await searchParams
  const query = new URLSearchParams()

  for (const [key, val] of Object.entries(resolvedParams)) {
    if (typeof val === 'string') {
      query.set(key, val)
    } else if (Array.isArray(val) && val.length > 0) {
      query.set(key, val[0])
    }
  }

  const queryString = query.toString()
  redirect(queryString ? `/complaint?${queryString}` : '/complaint')
}
