// RETIRED — was a trivial "ok:true" echo endpoint used to smoke-test the
// edge-function bundler. No longer serves any purpose; kept only as an inert
// stub so redeploying overwrites the previously deployed version (JBJ-027).
import { serveRetired } from "../_shared/retired.ts";

serveRetired("bundle-smoke-test");
