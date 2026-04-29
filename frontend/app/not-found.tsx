import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <h1 className="m-0 text-[22px] font-semibold">Page not found</h1>
      <p className="m-0 text-fg-3">The route you tried to open does not exist.</p>
      <Link href="/" className="text-accent hover:underline">Back to overview</Link>
    </div>
  );
}
