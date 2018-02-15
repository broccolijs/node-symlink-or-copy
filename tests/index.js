'use strict';

var assert = require('assert');
var symLinkOrCopy = require('..');
var tmpdir = require('os').tmpdir() + '/symlink-or-copy';
var path = require('path');
var fs = require('fs')
var rimraf = require('rimraf');

describe('symlink-or-copy', function() {
  beforeEach(function() {
    rimraf.sync(tmpdir);
    fs.mkdirSync(tmpdir);
  });

  afterEach(function() {
    symLinkOrCopy._setOptions({}); // make sure we don't mix options between tests
    rimraf.sync(tmpdir);
  });

  describe('node-symlink-or-copy', function() {
    describe('windows', function() {
      describe('file', function() {
        it('cant symlink file or directory', function() {
          var readFileSyncCount = 0;
          var writeFileSyncCount = 0;
          var utimesSyncCount = 0;
          var lstatSyncCount = 0;
          var realpathSyncCount = 0;

          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: false,
            canSymlinkDirectory: false,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    return false;
                  }
                }
              },
              realpathSync: function() {
                realpathSyncCount++;
              },
              readFileSync: function() {
                readFileSyncCount++;
              },
              writeFileSync: function() {
                writeFileSyncCount++;
              },
              utimesSync: function() {
                utimesSyncCount++;
              }
            },
            realpathSync: function() {count++;},
            symlinkSync: function() {count++;}
          });

          symLinkOrCopy.sync('foo', 'bar');

          assert.equal(lstatSyncCount, 2, 'lstatSyncCount');
          assert.equal(readFileSyncCount, 1, 'readFileSyncCount');
          assert.equal(writeFileSyncCount, 1, 'writeFileSyncCount');
          assert.equal(utimesSyncCount, 1, 'utimesSyncCount');
        });

        it('cannot symlink file but can symlink directory', function() {
          var readFileSyncCount = 0;
          var writeFileSyncCount = 0;
          var utimesSyncCount = 0;
          var lstatSyncCount = 0;
          var realpathSyncCount = 0;

          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: false,
            canSymlinkDirectory: true,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    return false;
                  }
                }
              },
              realpathSync: function() {
                realpathSyncCount++;
              },
              readFileSync: function() {
                readFileSyncCount++;
              },
              writeFileSync: function() {
                writeFileSyncCount++;
              },
              utimesSync: function() {
                utimesSyncCount++;
              }
            }
          });

          symLinkOrCopy.sync('foo', 'bar');

          assert.equal(lstatSyncCount, 2, 'lstatSyncCount');
          assert.equal(readFileSyncCount, 1, 'readFileSyncCount');
          assert.equal(writeFileSyncCount, 1, 'writeFileSyncCount');
          assert.equal(utimesSyncCount, 1, 'utimesSyncCount');
        });

        it('can symlink file but cannot symlink directory', function() {
          var readFileSyncCount = 0;
          var writeFileSyncCount = 0;
          var utimesSyncCount = 0;
          var lstatSyncCount = 0;
          var realpathSyncCount = 0;
          var symlinkSyncCount = 0;

          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: true,
            canSymlinkDirectory: false,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    return false;
                  }
                }
              },
              realpathSync: function() {
                realpathSyncCount++;
              },
              readFileSync: function() {
                readFileSyncCount++;
              },
              writeFileSync: function() {
                writeFileSyncCount++;
              },
              utimesSync: function() {
                utimesSyncCount++;
              },
              symlinkSync: function(from, to) {
                symlinkSyncCount++;
              }
            }
          });

          symLinkOrCopy.sync('foo', 'bar');

          assert.equal(lstatSyncCount, 2, 'lstatSyncCount');
          assert.equal(readFileSyncCount, 0, 'readFileSyncCount');
          assert.equal(writeFileSyncCount, 0, 'writeFileSyncCount');
          assert.equal(utimesSyncCount, 0, 'utimesSyncCount');
          assert.equal(symlinkSyncCount, 1, 'symlinkSyncCount');
        });
      });

      describe('directory', function() {
        it('cant symlink file or directory', function() {
          var count = 0;
          var lstatSyncCount = 0;
          var isDirectoryCount = 0;
          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: false,
            canSymlinkDirectory: false,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    isDirectoryCount++;
                    return true;
                  }
                }
              },
              realpathSync: function() {count++},
              symlinkSync: function(from, to, type) {
                assert.equal(type, 'junction');
                count++;
              }
            }
          });
          symLinkOrCopy.sync('foo', 'bar');
          assert.equal(count, 2);
          assert.equal(lstatSyncCount, 2);
          assert.equal(isDirectoryCount, 2);
        });

        it('cannot symlink file but can symlink directory', function() {
          var count = 0;
          var lstatSyncCount = 0;
          var isDirectoryCount = 0;
          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: false,
            canSymlinkDirectory: true,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    isDirectoryCount++;
                    return true;
                  }
                }
              },
              realpathSync: function() {count++},
              symlinkSync: function(from, to, type) {
                assert.equal(type, 'dir');
                count++;
              }
            }
          });

          symLinkOrCopy.sync('foo', 'bar');
          assert.equal(count, 2);
          assert.equal(lstatSyncCount, 2);
          assert.equal(isDirectoryCount, 2);
        });

        it('can symlink file but cannot symlink directory', function() {
          var count = 0;
          var lstatSyncCount = 0;
          var isDirectoryCount = 0;
          symLinkOrCopy._setOptions({
            isWindows: true,
            canSymlinkFile: true,
            canSymlinkDirectory: false,
            fs: {
              lstatSync: function() {
                lstatSyncCount++;
                return {
                  isSymbolicLink: function() {
                    return true;
                  },
                  isDirectory: function() {
                    isDirectoryCount++;
                    return true;
                  }
                }
              },
              realpathSync: function() {count++},
              symlinkSync: function(from, to, type) {
                assert.equal(type, 'junction');
                count++;
              }
            }
          });
          symLinkOrCopy.sync('foo', 'bar');
          assert.equal(count, 2);
          assert.equal(lstatSyncCount, 2);
          assert.equal(isDirectoryCount, 2);
        });
      });
    });

    it('it can symlink a directory', function() {
      var sourcePath = path.join(tmpdir, 'symlinkTestEx');
      var destinationPath = path.join(tmpdir, 'symlinkTestDest');
      symLinkOrCopy._setOptions(null); // use the real implentation here

      try {
        fs.rmdirSync(sourcePath);
      } catch (error) {
        if (error.code != 'ENOENT') {
          throw error;
        }
      }

      try {
        fs.rmdirSync(destinationPath);
      } catch (error) {}
      fs.mkdirSync(sourcePath);

      symLinkOrCopy.sync(sourcePath, destinationPath);
      assert.ok(fs.existsSync(destinationPath), 'destination path should exist');
    });

    it('windows falls back to copy for file', function() {
      var count = 0
      var lstatSyncCount = 0
      var isDirectoryCount = 0
      var readFileSyncCount = 0
      var writeFileSyncCount = 0
      var utimesSyncCount = 0
      symLinkOrCopy._setOptions({
        isWindows: true,
        canSymLink: false,
        fs: {
          lstatSync: function() {
            lstatSyncCount++;
            return {
              isSymbolicLink: function() {
                return true;
              },
              isDirectory: function() {
                isDirectoryCount++;
                return false;
              }
            };
          },
          readFileSync: function() {
            readFileSyncCount++;
            return 'foo';
          },
          writeFileSync: function() {
            writeFileSyncCount++;
            return 'foo';
          },
          realpathSync: function() {count++;},
          symlinkSync: function() {count++;},
          utimesSync: function() {utimesSyncCount++;}
        }
      });

      symLinkOrCopy.sync('foo', 'bar');
      assert.equal(count, 1);
      assert.equal(lstatSyncCount, 2);
      assert.equal(isDirectoryCount, 2);
      assert.equal(writeFileSyncCount, 1);
      assert.equal(readFileSyncCount, 1);
      assert.equal(utimesSyncCount, 1);
    });

    it('windows symlinks when has permission', function() {
      var count = 0;
      symLinkOrCopy._setOptions({
        fs: {
          lstatSync: function() {
            return {
              isSymbolicLink: function() {
                count++;
                return true;
              },
              isDirectory: function() {
                return true;
              }
            }
          },
          realpathSync: function() {count++;},
          symlinkSync: function() {count++;}
        },
        canSymlink: true,
        isWindows: true
      });
      symLinkOrCopy.sync('foo', 'bar');
      assert.equal(count, 3);
    })

    it('exposes options.canSymlink via the canSymlink property', function() {
      assert.equal(symLinkOrCopy.canSymlink, false, 'undefined is coerced to false');

      symLinkOrCopy._setOptions({ canSymlinkFile: true, canSymlinkDirectory: true });
      assert.equal(symLinkOrCopy.canSymlink, true);
      assert.equal(symLinkOrCopy.canSymlinkFile, true);
      assert.equal(symLinkOrCopy.canSymlinkDirectory, true);

      symLinkOrCopy._setOptions({ canSymlinkFile: true, canSymlinkDirectory: false });
      assert.equal(symLinkOrCopy.canSymlink, false);
      assert.equal(symLinkOrCopy.canSymlinkFile, true);
      assert.equal(symLinkOrCopy.canSymlinkDirectory,false);

      symLinkOrCopy._setOptions({ canSymlinkFile: false, canSymlinkDirectory:  true});
      assert.equal(symLinkOrCopy.canSymlink, false);
      assert.equal(symLinkOrCopy.canSymlinkFile, false);
      assert.equal(symLinkOrCopy.canSymlinkDirectory, true);

      symLinkOrCopy._setOptions({ canSymlinkFile: false, canSymlinkDirectory: false});
      assert.equal(symLinkOrCopy.canSymlink, false);
      assert.equal(symLinkOrCopy.canSymlinkFile, false);
      assert.equal(symLinkOrCopy.canSymlinkDirectory,false);
    });
  });

  describe('WSL issues', function() {
    it('drops trailing / on directories, because WSL doesn\'t handle it', function() {
      var count = 0;
      symLinkOrCopy._setOptions({
        canSymlink: true,
        fs: {
          lstatSync: function(srcPath) {
            assert.equal(srcPath, 'foo')
            return {
              isSymbolicLink: function() {
                count++;
                return true;
              },
              isDirectory: function() {
                return true;
              }
            }
          },
          realpathSync: function(srcPath) {
            assert.equal(srcPath, 'foo');
            count++;
            return 'bar';
          },
          symlinkSync: function(srcPath) {
            count++;
            assert.equal(srcPath, 'bar');
          }
        }
      });

      assert.equal(count, 0);
      symLinkOrCopy.sync('foo/', 'bar/');
      assert.equal(count, 3);
    });

    it('drops extra / in paths, because WSL doesn\'t handle it', function() {
      var count = 0;
      symLinkOrCopy._setOptions({
        canSymlink: true,
        fs: {
          lstatSync: function(srcPath) {
            assert.equal(srcPath, 'foo/bar/baz');
            return {
              isSymbolicLink: function() {
                count++;
                return true;
              },
              isDirectory: function() {
                return true;
              }
            }
          },
          realpathSync: function(srcPath) {
            assert.equal(srcPath, 'foo/bar/baz');
            count++;
            return 'foo/bar/baz';
          },
          symlinkSync: function(srcPath) {
            count++;
            assert.equal(srcPath, 'foo/bar/baz');
          }
        }
      });

      assert.equal(count, 0);
      symLinkOrCopy.sync('foo//bar//baz', 'bar/');
      assert.equal(count, 3);
    });
  });

  describe('testing mode', function() {
    it('allows fs to be mocked', function() {
      var count = 0;
      symLinkOrCopy._setOptions({
        canSymlink: true,
        fs: {
          lstatSync: function() {
            return {
              isSymbolicLink: function() {
                count++;
                return true;
              },
              isDirectory: function() {
                return true;
              }
            }
          },
          realpathSync: function() {count++;},
          symlinkSync: function() {count++;}
        }
      });

      assert.equal(count, 0);
      symLinkOrCopy.sync();
      assert.equal(count, 3);
    });
  });
});
