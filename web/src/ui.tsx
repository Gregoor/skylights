import cx from "classix";

export const SectionedCard = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={"border border-gray-700 bg-gray-800/70 " + (className ?? "")}
    {...props}
  />
);

export const CardSection = ({
  className,
  ...props
}: React.ComponentProps<"section">) => (
  <section
    className={"border-t border-gray-700 -mt-px p-4 " + (className ?? "")}
    {...props}
  />
);

export const Card = ({
  className,
  sectionClassName,
  ...props
}: { sectionClassName?: string } & React.ComponentProps<
  typeof CardSection
>) => (
  <SectionedCard className={className}>
    <CardSection className={sectionClassName} {...props} />
  </SectionedCard>
);

export const Button = ({
  className,
  intent,
  ...props
}: { intent?: "danger" } & React.ComponentProps<"button">) => (
  <button
    type="button"
    className={cx(
      "px-2 py-1 border text-sm transition-all outline-gray-400",
      className,
      props.disabled
        ? "cursor-wait opacity-50"
        : "cursor-pointer hover:opacity-80 focus:outline-dashed",
      intent == "danger" && "border-red-200 text-red-200",
    )}
    {...props}
  />
);

export const Input = ({
  className,
  ...props
}: React.ComponentProps<"input">) => (
  <input
    type="text"
    className={[
      "outline-none border rounded-lg border-gray-400",
      "focus:border-white transition-all p-2 w-full bg-black",
      className,
    ].join(" ")}
    {...props}
  />
);
