# Part 5 : Udemy Course on Kubernetes (Stephen Grider)

## Background

-   Part 4: Created our first kubernetes configuration, fairly simple
-   **Part 5: More complex kubernetes deployment, ready for production**

## Architecture Overview

-   Reminder: "multi-client" container/pod (which is the React client) is configured to listen on **port 3000**
-   Reminder: "multi-server" container/pod (which is the express server) is configured to listen on **port 5000**
-   Reminder: "multi-server" port expects a set of key/values so it can connect to Postgres and Redis

![image](https://user-images.githubusercontent.com/9342308/73128906-10122600-3fa5-11ea-8380-cb47e2f84ca8.png)

## Checkpoint

Make sure all the docker containers still work before starting complex kubernetes build

```
$ cd 01-docker-elasticbeanstalk
$ docker-compose up
```

Navigate to http://localhost:3050 (remember, you have to refresh to see updated fibonacci numbers)

## Kubernetes Production Build

```
$ cp -rp 01-docker-elasticbeanstalk/ 02-k8s-production
```

Delete the following files

-   02-k8s-production/.travis.yml (we're going to rewrite this from scratch)
-   02-k8s-production/docker-compose.yml (switch to kubernetes, even for development)
-   02-k8s-production/Dockerrun.aws.json (switch to k8s, for production)
-   02-k8s-production/nginx/

Create k8s directory, and create about 11 config files

## NodePort Service vs ClusterIP Service

Kubernetes "Service" is used for Networking. Services include:

-   ClusterIP: Exposes a set of pods to _other objects in the cluster_. Can't expose to outside world.
-   NodePort: Exposes a set of pods to the outside world (_only good for dev purposes_)
-   LoadBalancer
-   Ingress

## Apply a group of configuration files

NOTE: Use a directory (e.g. "k8s" is our directory)

```
kubectl apply -f k8s
```
