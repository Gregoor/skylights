export const SectionedCard = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={
      "border border-gray-700 w-full bg-gray-800/70 " + (className ?? "")
    }
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
  ...props
}: React.ComponentProps<typeof CardSection>) => (
  <SectionedCard>
    <CardSection className={className} {...props} />
  </SectionedCard>
);

export const Button = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    type="button"
    className={
      "px-2 py-1 border text-sm transition-all outline-white hover:outline-dashed focus:outline-dashed " +
      (className ?? "")
    }
    {...props}
  />
);
