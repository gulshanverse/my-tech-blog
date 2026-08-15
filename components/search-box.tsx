"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBox({ placeholder = "Search the blog..." }: { placeholder?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(params.get("q") || "");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const query = value.trim(); router.push(`${pathname}?q=${encodeURIComponent(query)}`); }
  return <form className="search-form" onSubmit={submit} role="search"><Search className="search-icon" size={17} strokeWidth={1.8} aria-hidden="true" /><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} aria-label={placeholder} /><button type="submit" aria-label="Submit search"><Search size={16} /></button></form>;
}
