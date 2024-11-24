export const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={"border border-gray-700 p-4 bg-gray-800/70 " + (className ?? "")}
    {...props}
  />
);
