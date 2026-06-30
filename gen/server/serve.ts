import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";
import { Api } from "./Api.ts";
import { PostcodesApiHandlers } from "./handlers.ts";

const port = Number(process.env.PORT ?? 3000);

const ApiRoutes = HttpApiBuilder.layer(Api, {
	openapiPath: "/openapi.json",
}).pipe(Layer.provide(PostcodesApiHandlers));

const DocsRoute = HttpApiScalar.layer(Api, { path: "/docs" });

const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute);

const HttpServerLayer = HttpRouter.serve(AllRoutes).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port })),
);

console.log(`Serving native OpenAPI docs at http://localhost:${port}/docs`);
console.log(`Serving OpenAPI spec at http://localhost:${port}/openapi.json`);

Layer.launch(HttpServerLayer).pipe(NodeRuntime.runMain);
