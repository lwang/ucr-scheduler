from Pyro5.api import expose, oneway, serve
import Pyro5.server

@Pyro5.server.expose
class MyPyroThing(object):
    def test(self, num):
        return num*10

daemon = Pyro5.server.Daemon(port=9999)
uri = daemon.register(MyPyroThing, objectId='TestAPI')
print(uri)
daemon.requestLoop()