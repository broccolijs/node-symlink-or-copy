var fs = require('fs')
var copyDereferenceSync = require('copy-dereference').sync

var isWindows = process.platform === 'win32'

module.exports = symlinkOrCopy
function symlinkOrCopy () {
  throw new Error("This function does not exist. Use require('symlink-or-copy').sync")
}

module.exports.sync = symlinkOrCopySync
function symlinkOrCopySync (srcPath, destPath) {
  if (isWindows) {
    // We might be able to optimize this case in the future, for instance by
    // detecting whether we have rights to create symlinks, or perhaps even
    // creating junctions.
    copyDereferenceSync(srcPath, destPath)
  } else {
    if (fs.lstatSync(srcPath).isSymbolicLink()) {
      // When we encounter symlinks, follow them. This prevents indirection
      // from growing out of control.
      // Note: At the moment `realpathSync` on Node is 70x slower than native,
      // because it doesn't use the standard library's `realpath`:
      // https://github.com/joyent/node/issues/7902
      // Can someone please send a patch to Node? :)
      srcPath = fs.realpathSync(srcPath)
    } else if (srcPath[0] !== '/') {
      // Resolve relative paths.
      // Note: On Linux and Mac, process.cwd() never contains a symlink, due
      // to the way getcwd is implemented. As a result, it's correct to use
      // string concatenation in this code path instead of the slower
      // path.resolve(). (It seems unnecessary in principle that
      // path.resolve() is slower. Does anybody want to send a patch to Node?)
      srcPath = process.cwd() + '/' + srcPath
    }

    fs.symlinkSync(srcPath, destPath)
  }
}
