FROM node:21

RUN apt-get update && apt-get install -y python3 python3-pip git

RUN git clone --depth 1 --branch=backend https://github.com/lwgw/ucr-scheduler.git backend
RUN git clone --depth 1 --branch=frontend https://github.com/lwgw/ucr-scheduler.git frontend
RUN git clone --depth 1 --branch=public https://github.com/lwgw/ucr-scheduler.git frontend/public

WORKDIR "/frontend"
RUN git pull && npm install

WORKDIR "/backend"
ENV PIP_BREAK_SYSTEM_PACKAGES 1
RUN git pull && pip install --no-cache-dir -r requirements.txt

ENV HOST=0.0.0.0
ENV PORT=80
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=8000

WORKDIR "/"
RUN printf "#!/bin/bash \
\ncd /backend && python3 -m flask run &\
\ncd /frontend && npm run dev\n" > /run_scheduler.sh

CMD [ "bash", "./run_scheduler.sh" ]
