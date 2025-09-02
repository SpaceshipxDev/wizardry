// app/page.tsx - Redirect to canonical /sheets index
import { redirect } from 'next/navigation';

export default function RootRedirect() {
  redirect('/sheets');
}
