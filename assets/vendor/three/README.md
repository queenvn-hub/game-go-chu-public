# Three.js

Version: 0.186.0, pinned in package.json and package-lock.json.
Source: the official three npm package, build/three.module.js and build/three.core.js.
License: MIT, included as LICENSE.

These browser modules are bundled locally so the game can run without a CDN or a build server.
The existing build script includes them through assets/. No bundler is required to run START-LOCAL.cmd.
When upgrading Three.js, update both files together from the same pinned package version.
