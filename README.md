A service written in TypeScript that can apply JSON patches and generate image thumbnails.

Requirements:

 - Node.js, TypeScript
 - Authentication
 - Tests

Basic features:

 - [x] Apply given JSON patch ([RFC 6902](https://tools.ietf.org/html/rfc6902)) to the given JSON document
 - [x] Generate a thumbnail for the given image

Extra features:

 - [ ] Add a second service that stores documents and images in PostgreSQL
 - [ ] Store cached thumbnails in Redis
