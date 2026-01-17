import json
import tornado.web
import tornado.websocket
import datetime
from tornado.httpclient import AsyncHTTPClient
import asyncio
import os

connected_clients = set()

async def aggiorna_dati():
    APIkey = os.getenv("APIFOOTBALL_APIKEY")
    client = AsyncHTTPClient()
    while True:
        ieri = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        oggi = (datetime.datetime.now()).strftime("%Y-%m-%d")
        url = f"https://apiv3.apifootball.com/?action=get_events&from={ieri}&to={oggi}&league_id=0&APIkey={APIkey}"

        response = await client.fetch(url)
        data = json.loads(response.body)
        global live_matches, future_matches

        live_matches = []
        future_matches = []

        for match in data:
            date_match = match.get("match_date")
            
            if (date_match in [oggi, ieri] and 
                match.get("match_live") == "1" and 
                match.get("match_status") not in ["Finished", "After Pen.", "Postponed", "Not Started"]):
                
                live_matches.append(match)
                future_matches.append(match)
            
            elif date_match == oggi:
                future_matches.append(match)


                
        print(f"Dati aggiornati - {len(live_matches)} live, {len(future_matches)} totali")
        
        message = json.dumps({
            "type": "livescore",
            "live": live_matches,
            "future": future_matches
        })


        for clienti in connected_clients:
            try:
                clienti.write_message(message)
            except:
                pass
        
        await asyncio.sleep(20)

class LiveHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("live.html")

class FutureHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("future.html")

class DetailHandler(tornado.web.RequestHandler):
    def get(self):
        status = self.get_argument("status", None)
        if status == "notlive":
            self.render("dettagli_not_live.html")
        elif status == "live":
            self.render("dettagli_live.html")
        elif status == "finished":
            self.render("dettagli_finished.html")

class WebSocketCalcio(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        print("WebSocket aperto")
        connected_clients.add(self)
        self.write_message(json.dumps({
            "type": "livescore",
            "live": live_matches,
            "future": future_matches
        }))

    def on_close(self):
        print("WebSocket chiuso")
        connected_clients.discard(self)

async def main():
    global live_matches, future_matches
    live_matches = []
    future_matches = []

    app = tornado.web.Application([
        (r"/live", LiveHandler),
        (r"/future", FutureHandler),
        (r"/ws", WebSocketCalcio),
        (r"/dettagli", DetailHandler),
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
        (r"/assets/(.*)", tornado.web.StaticFileHandler, {"path": "assets"}),    
    ], template_path="templates")

    app.listen(8888)
    asyncio.create_task(aggiorna_dati())

    print("Server avviato su http://localhost:8888/live")
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())