import { file, serve } from "bun";
import index from "./index.html";
import { listFiles,syncMusic, findMissingFiles } from "./utils.ts";
const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/listFiles/:type": async req =>{
        const fileType = req.params.type;
        return Response.json({
            message: await listFiles(fileType),
        });
    },
    "/api/syncMusic": async _ => {
        syncMusic()
        return Response.json({
            message: "Success"
        })
    },
    "/api/getMissingFiles": async req =>{
        
        const fileList = await req.text()
        return Response.json({
                message: await findMissingFiles(fileList)
        })
    }
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
