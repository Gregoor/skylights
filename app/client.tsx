"use client";

import cx from "classix";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "border rounded-full border-gray-400 m-0.5 py-1 px-2",
        "hover:!filter-none hover:border-white transition-all",
        pending ? "animate-pulse" : "",
      ].join(" ")}
      style={{
        WebkitTransition: "-webkit-filter 200ms linear",
        filter: pending ? undefined : "brightness(50%) invert(70%)",
      }}
    >
      💫
    </button>
  );
}

export const NavLink = ({
  className,
  ...props
}: React.ComponentProps<typeof Link>) => {
  const pathname = usePathname();
  return (
    <Link
      className={cx(
        className,
        "hover:underline",
        pathname == props.href ? "text-white" : "text-gray-500",
      )}
      {...props}
    >
      {props.children}
    </Link>
  );
};

export function Memput(
  props: { name: string } & React.ComponentProps<"input">,
) {
  const [value, setValue] = useState(
    props.value ?? localStorage.getItem(props.name) ?? "",
  );
  useEffect(() => {
    localStorage.setItem(props.name, value?.toString());
  }, [props.name, value]);
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
