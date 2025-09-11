import { redirect } from 'next/navigation'

export default function MobileIndexPage({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/m/${locale}/home`)
}

