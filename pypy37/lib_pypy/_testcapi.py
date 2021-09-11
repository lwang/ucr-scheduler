import imp
import os

try:
    import cpyext
except ImportError:
    pass   # no 'cpyext', but we still have to define e.g. awaitType
else:
    import _pypy_testcapi
    cfile = '_testcapimodule.c'
    thisdir = os.path.dirname(__file__)
    output_dir = _pypy_testcapi.get_hashed_dir(os.path.join(thisdir, cfile))

    try:
        fp, filename, description = imp.find_module('_testcapi',
                                                    path=[output_dir])
        with fp:
            imp.load_module('_testcapi', fp, filename, description)
    except ImportError:
        if os.name == 'nt':
            # hack around finding compilers on win32
            try:
                import setuptools
            except ImportError:
                pass
        _pypy_testcapi.compile_shared(cfile, '_testcapi', output_dir)


class awaitType:
    def __init__(self, iterator):
        self._iterator = iterator
    def __await__(self):
        return self._iterator

# the hacks above have replaced this module with another, so we need
# to push the extra names into this other module too...
import _testcapi
_testcapi.awaitType = awaitType
