# Mentor Merlin Flowchart App

This project contains a lightweight flowchart drawing application built with **React** and **TypeScript**, powered by [React Flow](https://reactflow.dev/). It was designed specifically for Mentor Merlin and adheres to the company’s branding guidelines.

## Features

* **Drag‑and‑drop shapes** – Rectangle, Circle, Diamond and Arrow nodes are available from the toolbar. Drag them onto the canvas to create new nodes.
* **Editable text** – Double click on any node to edit its label. Press **Enter** or click outside to save changes.
* **Connectors** – Create connections by dragging from a source handle (little blue dot) to a target handle on another node. Connections render with arrowheads.
* **Move/Resize/Delete** – Nodes can be moved freely, resized by dragging their edges and removed using the **Delete** key.
* **Undo/Redo** – Step backwards or forwards through your editing history using the **Undo** and **Redo** buttons.
* **Save/Load** – Export your diagram as a JSON file and load it back later. This is handy for persisting unfinished work.
* **Export** – Generate PNG, PDF or DOCX versions of your diagram via the export buttons. The PDF and DOCX exports embed a snapshot of the canvas.
* **Branding** – Uses Mentor Merlin’s navy and blue colour palette. A logo sits at the top right and a “Made for Mentor Merlin” note appears in the footer.

## Getting Started

### Prerequisites

Ensure you have **Node.js** installed (>=14 recommended). The repository uses `npm` to manage dependencies.

### Installation

1. Navigate into the project directory:

   ```bash
   cd mentor-merlin-flowchart
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The application will open in your default browser at `http://localhost:3000`.

### Building for Production

To create an optimised production build, run:

```bash
npm run build
```

The build output will be placed in the `build` directory.

## Deployment to GitHub Pages

GitHub Pages can serve static websites directly from a repository. To deploy this app:

1. In your `package.json` add a `homepage` field that points to your GitHub Pages URL. For example:

   ```json
   "homepage": "https://yourusername.github.io/mentor-merlin-flowchart"
   ```

2. Install the `gh-pages` package as a development dependency:

   ```bash
   npm install --save-dev gh-pages
   ```

3. Add the following scripts to your `package.json`:

   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. Commit and push your code to GitHub.

5. Deploy the site by running:

   ```bash
   npm run deploy
   ```

GitHub will publish the contents of the `build` folder to the `gh-pages` branch automatically. After a short delay your site should be live at the URL specified in the `homepage` field.

## Customisation

### Branding

Colour values are defined in `tailwind.config.js` under the `extend.colors` section. Adjust the hex codes for `primary`, `secondary` and `accent` to update the palette. The Mentor Merlin logo is stored in the `public` folder as `MM_logo.png`. Replace this file to swap in a different logo – the dimensions will adjust automatically.

### Adding New Shapes

Shapes are implemented in `src/components/nodes`. Each shape is a simple React component that wraps a generic base component. To add another custom shape:

1. Create a new file under `src/components/nodes`, import `BaseShapeNode` and define a component that passes a `clipPath` or `borderRadius` to it. For example, to create a hexagon you might use:

   ```tsx
   import React from 'react';
   import { NodeProps } from 'react-flow-renderer';
   import BaseShapeNode from './BaseShapeNode';

   const HexagonNode: React.FC<NodeProps> = (props) => {
     return (
       <BaseShapeNode
         {...props}
         clipPath="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
         equalSize={true}
       />
     );
   };

   export default HexagonNode;
   ```

2. Export your new component from `src/components/nodes/index.ts`.
3. Add the node type to the `nodeTypes` object in `src/App.tsx`.
4. Add a draggable icon for your shape in `src/components/Toolbar.tsx`.

### Modifying Exports

The export logic lives in `src/App.tsx`. It uses [html2canvas](https://github.com/niklasvh/html2canvas), [jsPDF](https://github.com/parallax/jsPDF) and [docx](https://github.com/dolanmiu/docx) to capture the canvas and generate files. You can adjust the PDF page orientation or add additional content to the exported documents by editing these functions.

## Contributing

This project was designed as a demonstration of how to build a custom diagramming tool with React Flow and Tailwind CSS. Feel free to fork it and build upon it. Pull requests are welcome!

## License

This codebase is provided for educational purposes and does not include a specific software license. Please contact Mentor Merlin for usage rights beyond personal experimentation.