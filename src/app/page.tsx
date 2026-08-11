import { redirect } from 'next/navigation';

export default function Home() {
  // 認証判定は /compare 配下の AuthGuard が行う
  redirect('/compare/model');
}
