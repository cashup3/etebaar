import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign up · Etebaar",
  description:
    "Create an Etebaar account with email verification—spot crypto exchange, Tbilisi, Georgia.",
};

export default function SignupPage() {
  redirect("/login?signup=1");
}
