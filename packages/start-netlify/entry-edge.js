import handler from "./entry-server.js";
import manifest from "../../netlify/route-manifest.json";

export default async (request, context) => {
  const env = {
      ...context,
      manifest,
      getStaticHTML: path => context.rewrite(new URL(`${path}.html`, request.url).href)
    },
    clientAddress = request.headers.get("x-nf-client-connection-ip");

  console.log(`Received new request: ${request.url}`);
  const asset = await context.next(request.clone());
  if (asset.status !== 404) {
    console.log(`Served static asset for: ${request.url}`);
    return asset;
  }
  console.log(`No static asset, doing dynamic lookup for: ${request.url}`);

  function internalFetch(route, init = {}) {
    if (route.startsWith("http")) {
      return fetch(route, init);
    }

    let url = new URL(route, "http://internal");
    const request = new Request(url.href, init);
    return handler({
      request,
      clientAddress,
      locals: {},
      env,
      fetch: internalFetch
    });
  }

  return handler({
    request,
    clientAddress,
    locals: {},
    env,
    fetch: internalFetch
  });
};
