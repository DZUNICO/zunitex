import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="bg-primary/5 py-16 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          STARLOGIC
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          La red social profesional para electricistas. Conéctate, aprende y crece con la comunidad.
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild>
            <Link href="/register">Empezar Ahora</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/projects">Ver Proyectos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}