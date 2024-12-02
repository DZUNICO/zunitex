import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function BlogPosts() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Últimos Artículos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aquí irían tus artículos del blog */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Link href="/blog/instalacion-electrica">
                Cómo realizar una instalación eléctrica segura
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Guía paso a paso para realizar instalaciones eléctricas residenciales...
            </p>
          </CardContent>
        </Card>
        {/* Más artículos... */}
      </div>
    </section>
  );
}