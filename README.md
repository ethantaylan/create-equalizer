# create-equalizer

`create-equalizer` is an interactive command-line scaffolder that spins up opinionated front-end projects with the tooling and integrations you actually use. Pick your framework, package manager, styling system, data layer, state management, and quality tools so Equalizer wires them together and you can start shipping right away.

## Highlights
- **Guided CLI wizard** built with [@clack/prompts](https://github.com/natemoo-re/clack), no arguments required.
- **Framework aware** presets for React + Vite, Vue 3 + Vite, SvelteKit, and Angular.
- **Tailored dependencies** for styling, data fetching, state, and tooling choices. Equalizer generates the install commands and runs them for you.
- **Tailwind automation**: runs `tailwindcss init -p` in the generated project when selected.
- **Immersive experience** with a colorful banner, animated progress spinners, and tip overlays.
- **Blueprint summary** with follow-up tasks and suggested project structure.

## Quick Start

```
npm create equalizer@latest
# or
pnpm dlx create-equalizer
# or
yarn dlx create-equalizer
# or
bunx create-equalizer
```

Follow the prompts to choose:

- Package manager (`pnpm`, `npm`, `yarn`, `bun`)
- Framework (React, Vue, Angular, SvelteKit)
- TypeScript preference (enforced for Angular)
- Styling, data, state, and tooling layers

You can press `Ctrl+C` at any time to abort the wizard; Equalizer stops cleanly without leaving partial installs behind.

Equalizer runs the appropriate `create-*` command, installs runtime and dev dependencies, and sets up Tailwind when requested. When the wizard finishes you receive a summary of commands executed, follow-up tasks, and the resulting architecture.

## What You Get
- Project scaffolded with the official CLI for your chosen framework.
- Dependencies added based on your selections (for example Axios, TanStack Query, Redux Toolkit, ESLint, Vitest, MSW, and more).
- Post-install scripts (such as the Tailwind init) executed in the project directory.
- Structured directory recommendations to help maintain consistency across projects.

## FAQ

**Can I pass flags instead of using the wizard?**  
Not yet. The CLI currently focuses on an interactive flow; flag support is on the roadmap.

**Does it support custom templates?**  
Custom presets are not available today, but contributions are welcome. Open an issue with your use case.

## Contributing

Issues and pull requests are welcome. If you plan a large change, open an issue first so we can discuss the direction.

## License

MIT (c) Ethan Taylan
