import { scanArchive } from '../packages/content-engine/src/index.ts';
console.log(
  JSON.stringify(
    scanArchive('docs').map((a) => a.sourcePath),
    null,
    2,
  ),
);
