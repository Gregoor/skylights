import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: { ref: string; value: string } },
) {
  redirect(`/review/${params.ref}/${params.value}`);
}
