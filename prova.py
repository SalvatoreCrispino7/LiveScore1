import json
import tornado.web
import tornado.websocket
import datetime
from tornado.httpclient import AsyncHTTPClient
import asyncio


async def aggiorna_dati():
    global live_matches, future_matches

    APIkey = "9f7604e05842e522e33463c98e9123cb3651eaa23ee3ceb8c82543c4b772415d"
    client = AsyncHTTPClient()

    while True:
        start = datetime.datetime.now().strftime("%Y-%m-%d")
        stop = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

        url = f"https://apiv3.apifootball.com/?action=get_events&from={start}&to={stop}&APIkey={APIkey}"

        response = await client.fetch(url)
        data = json.loads(response.body)

        live_matches = []
        future_matches = []

        for match in data:
            if match["match_date"] == start and match.get("match_status") != "":
                future_matches.append(match)
                
                if match.get("match_live") == "1" and match.get("match_status") not in ["Finished", "After Pen.", "Postponed", "Not Started"]:
                    live_matches.append(match)

            print("Dati aggiornati")
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
        self.write_message(json.dumps(
            {
                "type": "livescore",
                "live": live_matches,
                "future": future_matches} ))

    def on_close(self):
        print("WebSocket chiuso")


async def main():
    asyncio.create_task(aggiorna_dati())

    app = tornado.web.Application([
        (r"/live", LiveHandler),
        (r"/future", FutureHandler),
        (r"/ws", WebSocketCalcio),
        (r"/dettagli", DetailHandler),
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
    ], template_path="templates")

    app.listen(8888)
    print("Server avviato su http://localhost:8888/live")
    await asyncio.Event().wait()



if __name__ == "__main__":
    asyncio.run(main())