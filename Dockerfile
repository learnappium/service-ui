FROM golang:1.9
WORKDIR /go/src/github.com/learnappium/service-ui/
ARG service
ARG version
COPY ./Makefile ./glide.yaml ./glide.lock ./main.go ./
RUN make get-build-deps
RUN make build-server

FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./src/main/resources/public/package.json /usr/src/app/
RUN npm install
COPY ./src/main/resources/public/ /usr/src/app/
RUN npm run build && npm run test

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=0 /go/src/github.com/learnappium/service-ui /
COPY --from=1 /usr/src/app/ /public

ENV RP_STATICS_PATH=/public

EXPOSE 8080
ENTRYPOINT ["/service-ui"]
