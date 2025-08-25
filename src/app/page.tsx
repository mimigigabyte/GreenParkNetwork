import { redirect } from 'next/navigation';

export default function HomePage() {
  // 重定向到默认语言（中文）
  redirect('/zh');
}