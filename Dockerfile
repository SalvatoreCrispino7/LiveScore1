FROM python:3.12-slim
WORKDIR /LiveScore
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8888

CMD ["python","main_ws.py"]