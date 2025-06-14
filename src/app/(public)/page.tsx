import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { BlogPosts } from "@/components/home/blog-posts";
//import { Providers } from "@/components/home/providers";
import { Hero } from "@/components/home/hero";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-16">
        {/* Sección de Recursos Destacados */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recursos Destacados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Instalaciones Eléctricas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Guías y tutoriales sobre instalaciones eléctricas residenciales e industriales.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/blog/instalaciones">Leer más</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Normativas y Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Información actualizada sobre normativas eléctricas y medidas de seguridad.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/blog/normativas">Leer más</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materiales y Herramientas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Guías de selección de materiales y herramientas para electricistas.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/blog/materiales">Leer más</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Proyectos Destacados */}
        <FeaturedProjects />

        {/* Blog Posts */}
        <BlogPosts />

        {/* Proveedores */}
        {/* <Providers /> */}

        {/* CTA Section */}
        <section className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Únete a nuestra comunidad</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Conéctate con otros profesionales, comparte experiencias y accede a recursos exclusivos.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}