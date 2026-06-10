import { cn } from "@/lib/utils";
import Container from "./container";

export default function Section({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section className={cn("py-16 md:py-20", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}