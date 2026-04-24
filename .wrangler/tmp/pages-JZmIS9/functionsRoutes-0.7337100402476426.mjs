import { onRequestPost as __api_verify_pin_js_onRequestPost } from "/Users/alexbroley/github/portfolio/functions/api/verify-pin.js"
import { onRequest as __api_family_image_js_onRequest } from "/Users/alexbroley/github/portfolio/functions/api/family-image.js"
import { onRequestPost as __contact_js_onRequestPost } from "/Users/alexbroley/github/portfolio/functions/contact.js"
import { onRequest as __family__middleware_js_onRequest } from "/Users/alexbroley/github/portfolio/functions/family/_middleware.js"

export const routes = [
    {
      routePath: "/api/verify-pin",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_pin_js_onRequestPost],
    },
  {
      routePath: "/api/family-image",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_family_image_js_onRequest],
    },
  {
      routePath: "/contact",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__contact_js_onRequestPost],
    },
  {
      routePath: "/family",
      mountPath: "/family",
      method: "",
      middlewares: [__family__middleware_js_onRequest],
      modules: [],
    },
  ]