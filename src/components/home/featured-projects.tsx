import { Card } from "@/components/ui/card";
import { projectsService } from "@/lib/firebase/projects";
import Link from "next/link";
//import { ProjectCard } from "@/components/projects/project-card";

async function getProjects() {
  // Implementa la lógica para obtener proyectos destacados
  //return projectsService.getFeaturedProjects();
}

export async function FeaturedProjects() {
  const projects = await getProjects();

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Proyectos Destacados</h2>
        {/* <Button variant="outline" asChild>
          <Link href="/projects">Ver todos</Link>
        </Button> */}
      </div>
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div> */}
    </section>
  );
}