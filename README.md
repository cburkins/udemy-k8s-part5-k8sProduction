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

## Checkpoint: Client/Server/Worker (3 out of 5 major things)

Apply config

```
[cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction/02-k8s-production (master)]
$ kubectl apply -f k8s
service/client-cluster-ip-service unchanged
deployment.apps/client-deployment unchanged
service/server-cluster-ip-service created
deployment.apps/server-deployment created
deployment.apps/worker-deployment created

[cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction/02-k8s-production (master)]
$ kubectl get pods
NAME                                 READY   STATUS    RESTARTS   AGE
client-deployment-646698fbd5-7sbc7   1/1     Running   0          35m
client-deployment-646698fbd5-p9bq5   1/1     Running   0          35m
client-deployment-646698fbd5-r9ks5   1/1     Running   0          35m
server-deployment-5d5d45f486-6zzjm   1/1     Running   0          111s
server-deployment-5d5d45f486-8r6bj   1/1     Running   0          111s
server-deployment-5d5d45f486-mhgxx   1/1     Running   0          111s
worker-deployment-7bb94c7bf-x6j5b    1/1     Running   0          111s

[cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction/02-k8s-production (master)]
$ kubectl get deployments
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
client-deployment   3/3     3            3           35m
server-deployment   3/3     3            3           118s
worker-deployment   1/1     1            1           118s

[cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction/02-k8s-production (master)]
$ kubectl get services
NAME                        TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
client-cluster-ip-service   ClusterIP   10.96.182.46   <none>        3000/TCP   35m
kubernetes                  ClusterIP   10.96.0.1      <none>        443/TCP    29h
server-cluster-ip-service   ClusterIP   10.96.2.220    <none>        5000/TCP   2m3s

```

Then check our logs on one of the Servers (Express API's)

```
[cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction/02-k8s-production (master)]
$ kubectl logs server-deployment-5d5d45f486-6zzjm

> @ start /app
> node index.js

Listening
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1137:16) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 5432
}
```

Looks good: As Redis is not configured/running yet

## Postgres PVC (Persistent Volume Claim)

-   "Volume" in Docker: some type of mechanism that allows a container to access a filesystem outside of itself
-   "Volume" in Kubernetes: A **pre-defined object type** that allows a container to store data at the pod level

Volume object types in Kubernetes

-   **Volume** : only persists with the Pod. If Pod dies, storage dies. Only good for container restarts
-   **Persistent Volume** : Exists at the cluster level, outside the pod, and will survive pod restart
-   **Persistent Volume Claim** : Advertisement of available storage. Statically provisioned Persistent Volume already exists. Dynamically Provisioned PV is created when needed

## Kubernetes Secret (to store a password)

Kinds of Secret:

-   generic
-   docker-registry
-   tls (https setup)

```
# kubectl create secret generic <secret-name> --from-literal key=value

$ kubectl create secret generic pgpassword --from-literal PGPASSWORD=12345asdf
secret/pgpassword created

$ kubectl get secrets
NAME                  TYPE                                  DATA   AGE
default-token-pctrk   kubernetes.io/service-account-token   3      30h
pgpassword            Opaque                                1      30s
```
