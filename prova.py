import json
import tornado.web
import tornado.websocket
import datetime
import requests
import asyncio

data_PARTITE = []


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")


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
        self.running = True
        self.task = asyncio.create_task(self.write_livescore())
   
    async def write_livescore(self):
        APIkey = "9f7604e05842e522e33463c98e9123cb3651eaa23ee3ceb8c82543c4b772415d"
        global start
        start = datetime.datetime.now().strftime("%Y-%m-%d")
        stop = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

        url = f"https://apiv3.apifootball.com/?action=get_events&from={start}&to={stop}&APIkey={APIkey}"


        while self.running:
            global data_PARTITE
            r = requests.get(url)
            data_PARTITE = r.json()


            live_matches, future_matches = self.differenzia_partite(data_PARTITE)
            await self.write_message(json.dumps({
                "type": "livescore",
                "live": live_matches,
                "future": future_matches
            }))
            await asyncio.sleep(20000)


    def differenzia_partite(self, data):
        live_matches = []
        future_matches = []
        for match in data:

            if match["match_date"] == start and  match.get("match_status") != "":
                if match.get("match_live") == "1" and match.get("match_status") not in ["Finished", "After Pen.", "Postponed"]:
                    live_matches.append(match)
                else:
                    future_matches.append(match)
            
        return live_matches, future_matches
   
    def on_close(self):
        print("WebSocket chiuso")
        self.running = False
        self.task.cancel()


async def main():
    app = tornado.web.Application([
        (r"/", MainHandler),
        (r"/live", LiveHandler),
        (r"/future", FutureHandler),
        (r"/ws", WebSocketCalcio),
        (r"/dettagli", DetailHandler),
    ], template_path="templates")


    app.listen(8888)
    print("Server avviato su http://localhost:8888")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())