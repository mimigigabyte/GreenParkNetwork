import { redirect } from 'next/navigation'

interface UserPageProps {
  params: {
    locale: string
  }
}

export default function UserPage({ params }: UserPageProps) {
  redirect(`/${params.locale}/user/technologies`)
}