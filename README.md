# unhandled-rejected-promise-causes-puppeteer-crash
Bug report for unhandled rejected promises in Puppeteer

The way of reproducing the bug is not directly using puppeteer but using `chrome-aws-lambda` npm package running a container based on the nodejs AWS lambda runtime that basically uses `chronium` to generate a "Hello world" PDF from HTML code. 

The problem is that the puppeteer subprocess triggers an error that makes the lambda runtime to crash, making it impossible to capture the exception and provide a response to the request. 

# How to reproduce the bug in MacOS / Linux

## Pre-requisites

- Docker
- Terminal running bash

## Steps to reproduce it

1. Open one terminal window and build the docker image running `./build.sh`
2. In the same terminal window start the container with `./start-container.sh`
3. Open other terminal window/tab and trigger the error running `./trigger-bug.sh`. This script performs calls to the lambda API that prints the PDF. After a certain number of executions (the exact number changes from execution to execution) the lambda runtime will crash and you will get the following error:

```bash
{"errorType":"Runtime.UnhandledPromiseRejection","errorMessage":"Error: Protocol error (IO.close): Target closed.","trace":["Runtime.UnhandledPromiseRejection: Error: Protocol error (IO.close): Target closed."," at process.<anonymous> (/var/runtime/index.js:35:15)"," at process.emit (events.js:400:28)"," at processPromiseRejections (internal/process/promises.js:245:33)"," at processTicksAndRejections (internal/process/task_queues.js:96:32)"]}
```

The problem seems to be in the file `src/common/helper.ts` in the method [getReadableFromProtocolStream](https://github.com/puppeteer/puppeteer/blob/4c3caaa3f99f0c31333a749ec50f56180507a374/src/common/helper.ts#L368). 

The async/wait approach as it is today does not consider that promise `await client.send('IO.close', { handle });` might be rejected. A simple try/catch prevents the error from happening:

```typescript
async function getReadableFromProtocolStream(
  client: CDPSession,
  handle: string
): Promise<Readable> {
  // TODO:
  // This restriction can be lifted once https://github.com/nodejs/node/pull/39062 has landed
  if (!isNode) {
    throw new Error('Cannot create a stream outside of Node.js environment.');
  }

  const { Readable } = await import('stream');

  let eof = false;
  return new Readable({
    async read(size: number) {
      if (eof) {
        return null;
      }

      const response = await client.send('IO.read', { handle, size });
      this.push(response.data, response.base64Encoded ? 'base64' : undefined);
      if (response.eof) {
        eof = true;

        //////////////////////////
        // THIS IS MY PROPOSSAL //
        //////////////////////////
        try {
          await client.send('IO.close', { handle });
        } catch (err) {
          console.log(err);
        }

        this.push(null);
      }
    },
  });
}
```

However I am not so deep in the code to understand if this is the right approach.

Nevertheless there are other async functions in the file that consider that the promise will be always resolved and not rejected.