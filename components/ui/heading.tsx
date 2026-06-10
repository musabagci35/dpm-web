import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  align = "left",
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8", align === "center" && "text-center")}>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}