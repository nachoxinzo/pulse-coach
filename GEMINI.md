# Design System & UI/UX Standards

- **Componentes Base:** No construyas elementos primitivos desde cero con divs y clases sueltas. Usa componentes de shadcn/ui (`npx shadcn@latest add <component>`).
- **Iconos:** Usa exclusivamente `lucide-react`. Prohibidos emojis o placeholders de texto como iconos.
- **Tipografía y Jerarquía:** Aplica contraste tipográfico claro (títulos `font-semibold text-foreground`, subtítulos `text-sm text-muted-foreground`).
- **Paleta y Superficies:** Prohibido usar negro (#000) o blanco (#fff) puro en cajas. Usa el sistema semántico: `bg-background`, `bg-card`, bordes sutiles `border border-border/50`, y sombras suaves `shadow-sm`.
- **Microinteracciones y Polish:**
  - Todo elemento interactivo debe tener feedback visual (`hover:bg-accent`, `active:scale-[0.98]`, transiciones suaves `transition-all duration-150`).
  - Agrega estados de carga con `<Skeleton/>` y nunca dejes listas vacías sin un *Empty State* ilustrado con icono + CTA.
- **Verificación Visual:** Siempre que generes o modifiques una vista, abre la URL local en el navegador integrado de Antigravity y valida que el espaciado (padding, gap), la alineación y los contrastes luzcan a nivel de producto SaaS comercial antes de dar la tarea por terminada.
