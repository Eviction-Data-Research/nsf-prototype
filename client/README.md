# Client

## Technologies

### npm

`npm` is the package manager for this project.

### Vite

[Vite](https://vitejs.dev/) is used as the build tool to manage the serving and bundling of the frontend code for this project.

### React

[React](https://react.dev/) is a widely used frontend framework to create highly interactive applications.

### TypeScript

[TypeScript](https://www.typescriptlang.org/) is a superset of JavaScript, extending it with strong typing.

### React Router

[React Router v6](https://reactrouter.com/en/main) enables client-side routing throughout the web app.

### TanStack

This project uses [TanStack Query](https://tanstack.com/query/latest) and [Virtual](https://tanstack.com/virtual/latest). The former is to simplify API requests from the frontend using hook interfaces, and the latter is used to virtualize grids and tables in various components throughout the application.

### Chakra UI

This project uses [Chakra](https://v2.chakra-ui.com/) as its component library.

## Directory Structure

### `/src/components`

This should be relatively straightforward - all custom components are defined in this directory, organized by what they are or on which page of the website they are located.

### `/src/routes`

This directory defines the core pages, or routes, of the website. Think of each file in this directory as a [subdirectory in a URL](https://blog.hubspot.com/marketing/subdomain-vs-subdirectory) you can navigate to.

### `/src/utils`

Defines utility files for shared types and constants used throughout the application. Stored together for convenience.
