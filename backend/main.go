package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
	"io"
	"log"
	"net/http"
	"reflect"
	str "strings"
)

type Mux [1]*http.ServeMux
type Endpoint struct {
	Header string `json:"header"`
	Route  string `json:"route"`
	Schema string `json:"schema"`
}

var endpoints []Endpoint

func (mux *Mux) Get() *http.ServeMux {
	return mux[0]
}

func mux() Mux {
	fmt.Println("> mux created")
	serve := http.NewServeMux()
	return Mux{serve}
}

func (mux *Mux) Listen(port string) error {
	fmt.Printf("> listening on port (%s)\n\n", port)
	err := http.ListenAndServe(port, mux.Get())
	return err
}

func (mux *Mux) HandleRemoteProc(method string, endpoint Endpoint, handler func(http.ResponseWriter, *http.Request)) {
	var route string
	if endpoint.Header != "" {
		route = fmt.Sprintf("/%s/%s/", endpoint.Header, endpoint.Route)
	} else {
		route = fmt.Sprintf("/%s/", endpoint.Route)
	}

	endpoints = append(endpoints, endpoint)

	fmt.Printf("> handling route (%s %s)\n", method, route)
	mux.Get().HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
		origin := r.RemoteAddr

		fmt.Printf("# ------ [%s %s] -> [%s %s] ------", r.Method, origin, method, route)

		if str.Index(origin, "127.0.0.1") == 0 {
			fmt.Println(" # valid:")
			w.Header().Add("Access-Control-Allow-Origin", fmt.Sprint("http://localhost:63342"))
			w.Header().Add("Access-Control-Allow-Headers", "*")

			if method != r.Method {
				if r.Method == "OPTIONS" {
					w.WriteHeader(200)
				} else {
					w.WriteHeader(405)
				}
			} else {
				handler(w, r)
			}
		} else {
			fmt.Println(" # invalid:\n> !BLOCKING: call is of invalid origin")
		}

		fmt.Println()
	})
}

var ctx = context.Background()

func main() {
	mux := mux()

	opt, _ := redis.ParseURL("rediss://default:801365f4cc744f028baff8f97bf0c59f@gusc1-workable-badger-30521.upstash.io:30521")
	client := redis.NewClient(opt)

	mux.HandleRemoteProc("GET", Endpoint{
		Header: "",
		Route:  "index",
		Schema: ".-array",
	}, func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("requesting index")

		marshaled, _ := json.Marshal(endpoints)
		fmt.Fprintf(w, string(marshaled))
	})

	mux.HandleRemoteProc("POST", Endpoint{
		Header: "",
		Route:  "ping",
		Schema: ".-string",
	}, func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("pinged")

		fmt.Fprintf(w, "pong")
	})

	mux.HandleRemoteProc("POST", Endpoint{
		Header: "auth",
		Route:  "checkCode",
		Schema: "number.number.number.number.number-boolean",
	}, func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("checking auth")

		body, _ := io.ReadAll(r.Body)
		reqData := &struct {
			Args [5]byte `json:"args"`
		}{}
		json.Unmarshal(body, reqData)

		var codes [5]byte
		json.Unmarshal([]byte(client.Get(ctx, "pass-code").Val()), &codes)

		resp := "false"
		if reflect.DeepEqual(reqData.Args, codes) {
			resp = "true"
		}

		fmt.Fprintf(w, resp)
	})

	mux.HandleRemoteProc("POST", Endpoint{
		Header: "auth",
		Route:  "checkName",
		Schema: "string-boolean",
	}, func(w http.ResponseWriter, r *http.Request) {
		println("checking name")

		body, _ := io.ReadAll(r.Body)
		reqData := &struct {
			Args [1]string `json:"args"`
		}{}
		json.Unmarshal(body, reqData)

		resp := "false"

		var names []string
		json.Unmarshal([]byte(client.Get(ctx, "users").Val()), &names)
		println(names)

		println("received name ", reqData.Args[0], ".")
		for i := range names {
			println("reading name ", names[i], ".")
			if names[i] == reqData.Args[0] {
				resp = "true"
			}
		}

		fmt.Fprintf(w, resp)
	})

	if err := mux.Listen(":5555"); err != nil {
		log.Fatal(err)
	}
}
