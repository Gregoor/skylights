import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref: string; value: string }> },
) {
  const { ref, value } = await params;
  redirect(`/reviews/${ref}/${value}`);
}
