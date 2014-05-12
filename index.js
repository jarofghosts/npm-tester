var os = require('os')

var request = require('hyperquest')
  , through = require('through')
  , tap = require('tap-parser')

module.exports = tester

function tester(server, name) {
  var parser = tap(submit)
    , start = Date.now()
    , results

  var stream = through(write, noop)

  stream.submit = end

  return stream

  function end() {
    parser.end()
  }

  function write(data) {
    parser.write(data)

    stream.queue(data)
  }

  function submit(results) {
    var os_data = {
        platform: os.platform()
      , type: os.type()
      , arch: os.arch()
      , release: os.release()
      , totalmem: os.totalmem()
      , freemem: os.freemem()
      , cpus: os.cpus()
    }

    var result_data = {
        passed: results.ok
      , os: os_data
      , results: results
      , node: process.version
      , elapsed: Date.now() - start
    }

    request.post(server + '/api/results/' + name)
      .on('error', onerror)
      .on('end', onend)
      .end(JSON.stringify(result_data))

    function onend() {
      process.stderr.write('submitted results!\n')
      stream.queue(null)
      process.exit(+(!results.ok))
    }
  }
}

function onerror(err) {
  process.stderr.write(err)
}

function noop() {}
