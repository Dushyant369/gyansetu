import { redirect } from "next/navigation"

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ general?: string }>
}) {
  // Redirect Browse Questions to Solve Questions (merged functionality)
  const params = await searchParams
  const showGeneralOnly = params?.general === "true"
  
  // If showing general questions only, redirect to solve-questions page
  // Otherwise, redirect to solve-questions (which shows both courses and general questions)
  redirect("/solve-questions")
}
