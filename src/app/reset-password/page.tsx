import { AuthForm } from "@/components/auth-form";
import { signedIn } from "@/lib/data";
export default async function Reset() {
  await signedIn();
  return <AuthForm reset />;
}
