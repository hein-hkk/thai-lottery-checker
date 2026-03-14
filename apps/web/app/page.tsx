import { redirect } from "next/navigation";
import { getPublicEnv } from "../src/config/env";

export default function RootPage() {
  redirect(`/${getPublicEnv().defaultLocale}`);
}

