// The iverson.io frontend. It talks to the FastHTML server (nbs/11_main.ipynb → iverson/main.py) through its /api routes.
//   npm run dev     http://localhost:3000, calls the server on 127.0.0.1:5001 (CORS is enabled there)
//   npm run build   writes dist/, which the server then serves at http://localhost:5001/
export default {
  title: "iverson.io",
  root: "src",
  // Built for / on the server. Set GNN_BASE if you need a different public path.
  base: process.env.GNN_BASE ?? "/",
  style: "style.css",
  globalStylesheets: [], // no web fonts: the system typeface, nothing fetched
  sidebar: false,
  toc: false,
  pager: false,
  footer: "",
  search: false,
  preserveExtension: true, // names.html, so a plain static server can serve the build
  head: '<link rel="icon" href="./icon.png" type="image/png"><meta name="color-scheme" content="light dark">'
};
