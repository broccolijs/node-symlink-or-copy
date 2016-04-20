var fs = require('fs')
var tmpdir = require('os').tmpdir();
var path = require('path')

var isWindows = process.platform === 'win32'
// These can be overridden for testing
var options = {
  isWindows: isWindows,
  canSymlink: testCanSymlink(),
  fs: fs
}

function testCanSymlink () {
  // We can't use options here because this function gets called before
  // its defined
  if (isWindows === false) { return true; }

  var canLinkSrc  = path.join(tmpdir, "canLinkSrc.tmp")
  var canLinkDest = path.join(tmpdir, "canLinkDest.tmp")

  try {
    fs.writeFileSync(canLinkSrc, '');
  } catch (e) {
    return false
  }

  try {
    fs.symlinkSync(canLinkSrc, canLinkDest)
  } catch (e) {
    fs.unlinkSync(canLinkSrc)
    return false
  }

  fs.unlinkSync(canLinkSrc)
  fs.unlinkSync(canLinkDest)

  return true
}

module.exports = symlinkOrCopy;
function symlinkOrCopy () {
  throw new Error("This function does not exist. Use require('symlink-or-copy').sync")
}

module.exports.setOptions = setOptions
function setOptions(newOptions) {
  options = newOptions
}

module.exports.sync = symlinkOrCopySync
function symlinkOrCopySync (srcPath, destPath) {
  if (options.isWindows) {
    symlinkWindows(srcPath, destPath)
  } else {
    symlink(srcPath, destPath)
  }
}

function symlink(srcPath, destPath) {
  var lstat = options.fs.lstatSync(srcPath)
  if (lstat.isSymbolicLink()) {
    // When we encounter symlinks, follow them. This prevents indirection
    // from growing out of control.
    // Note: At the moment `realpathSync` on Node is 70x slower than native,
    // because it doesn't use the standard library's `realpath`:
    // https://github.com/joyent/node/issues/7902
    // Can someone please send a patch to Node? :)
    srcPath = options.fs.realpathSync(srcPath)
  } else if (srcPath[0] !== '/') {
    // Resolve relative paths.
    // Note: On Mac and Linux (unlike Windows), process.cwd() never contains
    // symlink components, due to the way getcwd is implemented. As a
    // result, it's correct to use naive string concatenation in this code
    // path instead of the slower path.resolve(). (It seems unnecessary in
    // principle that path.resolve() is slower. Does anybody want to send a
    // patch to Node?)
    srcPath = process.cwd() + '/' + srcPath
  }
  options.fs.symlinkSync(srcPath, destPath);
}

function symlinkWindows(srcPath, destPath) {
  var stat = options.fs.lstatSync(srcPath)
  var isDir = stat.isDirectory()
  var wasResolved = false;

  if (stat.isSymbolicLink()) {
    src = options.fs.realpathSync(srcPath);
    isDir = options.fs.lstatSync(srcPath).isDirectory();
    wasResolved = true;
  }

  if (options.canSymlink) {
    options.fs.symlinkSync(wasResolved ? srcPath : path.resolve(srcPath), destPath, isDir ? 'dir' : 'file')
  } else {
    if (isDir) {
      options.fs.symlinkSync(wasResolved ? srcPath : path.resolve(srcPath), destPath, 'junction');
    } else {
      options.fs.writeFileSync(destPath, options.fs.readFileSync(srcPath), { flag: 'wx', mode: stat.mode })
      options.fs.utimesSync(destPath, stat.atime, stat.mtime)
    }
  }
}
