# Part 5 : Udemy Course on Kubernetes (Stephen Grider)

## Background (for Part 5)

NOTE: I've broken down the Udemy Course on K8s into five Github repos. This is the 5th repo, and here's the description of all of them.

-   Part 1: Three things (1) simpleweb to demonstrate a single container (2) "visits" counter to demonstrate two containers and docker-compose (3) multiple containers with nginx hosting a static build of a basic React app
-   Part 2: Travsi CI builds to Elastic Beanstalk. Content is a simple one-container React app
-   Part 3: Deploy multiple containers on AWS Elastic Beanstalk (doesn't use Kubernetes yet).
-   Part 4: Deploy on local (minikube) Kubernetes (good for local development). Started with YAML files for simple one-pod configurations, finished with "Deployments" that can create/manage multiple pods that each run same image. Probably Section 13 (Lectures 188 through 203)
-   **Part 5: The Path to Production: Production-grade deployment on minikube, then deploy on GCP Kubernetes, using helm v3. Sections 14,15,16**

#### Directories in repo

-   01-docker-elasticbeanstalk: Copied from Part 3, not modified
-   02-k8s-development-minikube: Copied from "01", created 11 yaml files in "k8s" directory to build up a product-grade k8s deployment. Tested on minikube running "kubectl apply -f ./k8s"
-   03-k8s-production-googlecloud: Copied from "02", and built ".travis.yml" file in repo root which tells Travis to use everything in "03" directory. Builds images in Travis, pushes to DockerHub, then deploys those images to k8s cluster in Google Cloud

---

## TL;DR for Using This Repo (later, when I forget what I did :))

Each of three directories in this repo can be used for deployment in a different way

### 01-docker-elasticbeanstalk

1. TBD

### 02-k8s-development-minikube

NOTE: these instructions are for minikube running via Virtualbox on a Mac

1. Install virtualbox
1. Install minikube
1. minikube start (can verify "minikube" VM is running in Virtualbox)
1. Create minikube cluster
1. cd 02-k8s-development-minikube
1. kubectl apply ./k8s
1. minikube addons enable ingress
1. minikube ip
1. In browser, navigate to ip (port 80)

Clean up:

1. kubectl delete -f ./k8s
1. kubectl get pods (should be empty)
1. kubectl get services (should show only "kubernetes")
1. minikube stop

Additional thoughts:

1. minikube dashboard (see way down below)

### 03-k8s-production-googlecloud

1. cp ./03-k8s-production-googlecloud/travis-gcp.yaml ./.travis.yml
1. Create Cluster on GCP (3 nodes ?)
1. Create secret on GCP (for Postgres password)
   a. kubectl create secret generic pgpassword --from-literal PGPASSWORD=[password]
1. Install helm v3 on GCP
1. Use helm to install ingress-nginx
1. Trigger Travis to deploy your project (uses .travis.yml in repo root)

Removal of Cluster (Cleanup after done)

1. GCP: Select correct Project
1. GCP: Remove cluster (GCP->KubernetesEngine->Clusters)

---

## Course Notes while constructing this repo

Below is _all_ the detail you need for a complete deployment to a Kubernetes Cluster on Google Cloud Platform (GCP)

#### Architecture Reminder

-   Reminder: "multi-client" container/pod (which is the React client) is configured to listen on **port 3000**
-   Reminder: "multi-server" container/pod (which is the express server) is configured to listen on **port 5000**
-   Reminder: "multi-server" port expects a set of key/values so it can connect to Postgres and Redis
-   Instructor's repo: https://github.com/StephenGrider/DockerCasts/blob/master/complex/.travis.yml

![image](https://user-images.githubusercontent.com/9342308/73128906-10122600-3fa5-11ea-8380-cb47e2f84ca8.png)

#### Checkpoint

Make sure all the docker containers still work before starting complex kubernetes build

```
$ cd 01-docker-elasticbeanstalk
$ docker-compose up
```

Navigate to http://localhost:3050 (remember, you have to refresh to see updated fibonacci numbers)

#### Prep: (Conversion from local docker-compose to Kubernetes Production Build)

```
$ cp -rp 01-docker-elasticbeanstalk/ 02-k8s-production
```

Delete the following files

-   02-k8s-production/.travis.yml (we're going to rewrite this from scratch)
-   02-k8s-production/docker-compose.yml (switch to kubernetes, even for development)
-   02-k8s-production/Dockerrun.aws.json (switch to k8s, for production)
-   02-k8s-production/nginx/

Create k8s directory, and create about 11 config files

#### Convert from NodePort Service vs ClusterIP Service

Kubernetes "Service" is used for Networking. Services include:

-   ClusterIP: Exposes a set of pods to _other objects in the cluster_. Can't expose to outside world.
-   NodePort: Exposes a set of pods to the outside world (_only good for dev purposes_)
-   LoadBalancer: Legacy way to get network traffic into a k8s cluster, exposes a single "Deployment", has to integrate with cloud provider
-   Ingress: **New way** to exposes a set of services to the outside world

#### Apply a group of configuration files in kubectl

NOTE: Use a directory (e.g. "k8s" is our directory)

```
kubectl apply -f k8s
```

#### Checkpoint: Client/Server/Worker (3 out of 5 major things)

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

#### Create Postgres PVC (Persistent Volume Claim)

-   "Volume" in Docker: some type of mechanism that allows a container to access a filesystem outside of itself
-   "Volume" in Kubernetes: A **pre-defined object type** that allows a container to store data at the pod level

Volume object types in Kubernetes

-   **Volume** : only persists with the Pod. If Pod dies, storage dies. Only good for container restarts
-   **Persistent Volume** : Exists at the cluster level, outside the pod, and will survive pod restart
-   **Persistent Volume Claim** : Advertisement of available storage. Statically provisioned Persistent Volume already exists. Dynamically Provisioned PV is created when needed

#### Create Kubernetes Secret (to store a password for postgres DB)

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

#### Create Ingress to receive/route network traffic

NOTE: There are two popular Ingress implementations:

-   ingress-nginx: Community-led, and **used in this course**
-   kubernetes-ingress: Led by company Nginx

![image](https://user-images.githubusercontent.com/9342308/73128906-10122600-3fa5-11ea-8380-cb47e2f84ca8.png)

NOTE: In our case, the "Ingress Controller" and "Something that accepts/routes traffic" is actually the same thing

![image](https://user-images.githubusercontent.com/9342308/73144198-0e159900-4071-11ea-9e12-fea973f7bb05.png)

#### Production deployment in Google Cloud

NOTES:

-   Behind the scenes, Google's Ingress config is still using the legacy Kubernetes object "Load Balancer Service".
-   That Load Balancer Service sends through an Nginx Pod
-   Creates a "default-backend" pod to assist in checking the health of the cluster

![image](https://user-images.githubusercontent.com/9342308/73144219-706e9980-4071-11ea-9af7-10dfe7a2cf16.png)

#### Why not simplify and use our own Nginx pod for routing ?

![image](https://user-images.githubusercontent.com/9342308/73144314-afe9b580-4072-11ea-8fba-2f94f305be74.png)

Answer:

-   ingress-nginx has lots of additional functionlity
-   For example, it can (does?) actually bypass the "ClusterIP Service", and route directly to underlying pods
-   That allows for sticky session, where a particular user's traffic always stays with the same pod for duration of session

NOTE: Instructor recommended additional reading: https://www.joyfulbikeshedding.com/blog/2018-03-26-studying-the-kubernetes-ingress-system.html

![image](https://user-images.githubusercontent.com/9342308/73144415-7f564b80-4073-11ea-841f-fcb1f7724dc9.png)

#### Implementation for ingress-nginx

Actually following this: https://github.com/kubernetes/ingress-nginx
Which actually points you to here: https://kubernetes.github.io/ingress-nginx/deploy/

1. Follow "Generic Deployment" (have to do this, even if you really plan to use Google Cloud or AWS)
1. Execute the mandatory command (deploys pod for default-http-backend pod, and pod for nginx-ingress-controller)

```
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.27.1/deploy/static/mandatory.yaml

namespace/ingress-nginx created
configmap/nginx-configuration created
configmap/tcp-services created
configmap/udp-services created
serviceaccount/nginx-ingress-serviceaccount created
clusterrole.rbac.authorization.k8s.io/nginx-ingress-clusterrole created
role.rbac.authorization.k8s.io/nginx-ingress-role created
rolebinding.rbac.authorization.k8s.io/nginx-ingress-role-nisa-binding created
clusterrolebinding.rbac.authorization.k8s.io/nginx-ingress-clusterrole-nisa-binding created
deployment.apps/nginx-ingress-controller created
limitrange/ingress-nginx created
```

For minikube development environment

```
$ minikube addons enable ingress

* ingress was successfully enabled

```

#### Create a routing file for Ingress

Reminder: We need to setup these routes for inbound traffic

![image](https://user-images.githubusercontent.com/9342308/73144778-18d32c80-4077-11ea-9428-1dd27e24d9ec.png)

#### Minikube Dashboard

```
$ minikube dashboard
```

![image](https://user-images.githubusercontent.com/9342308/73145976-348e0100-407e-11ea-8147-f6b6c5582d91.png)

#### Production Deployment to Google Cloud

Why use Google Cloud over AWS ?

-   Google created Kubernetes
-   AWS only "recently" got Kubernetes support (as of 2018)
-   Far, far easier to poke around Kubernetes on Google Cloud
-   Excellent documentation for beginners

```
$ cp -rp 02-k8s-development-minikube/ 03-k8s-production-googlecloud/
```

# NOTE: Be sure to use travis-ci.org (not com)

#### Setup Google Cloud & Build Kubernetes Cluster

-   Setup Billing
-   Select "Kubernetes Engine"
-   Create Cluster
-   3 nodes
-   Machine type: n1-standard-1

#### Setup Google Accounts

-   On google cloud, create a service account
-   Download service account credentials in a JSON file
-   Download and install Travis CLI
-   Encrypt and upload JSON file to our Travis account
-   In .travis.yml, add code to unencrypt JSON file and load into GCloud SDK

#### Create Service Account on GCP

-   On Google Cloud,go to "IAM and Admin", then Service Accounts
-   Create account (with role "Kubernetes Engine Admin")
-   Create Private Key (JSON file)

#### Encrypt JSON Private Key from GCP

-   Install Travis CI CLI, requires Ruby. Easy on Mac. On Windows, Use a Ruby Docker Image

```bash
cburkin@LocalMac ~/code/udemy-k8s-part5-k8sProduction (master)]
$ docker run -it -v $(pwd):/app ruby:2.3 sh
Unable to find image 'ruby:2.3' locally
2.3: Pulling from library/ruby
e79bb959ec00: Pull complete
d4b7902036fe: Pull complete
1b2a72d4e030: Pull complete
d54db43011fd: Pull complete
69d473365bb3: Pull complete
84ed2a0dc034: Pull complete
8952ca0665c5: Pull complete
ef485f36c624: Pull complete
Digest: sha256:78cc821d95c48621e577b6b0d44c9d509f0f2a4e089b9fd0ca2ae86f274773a8
Status: Downloaded newer image for ruby:2.3
#

# gem install travis
Fetching faraday-0.17.3.gem
Fetching highline-1.7.10.gem
Fetching net-http-pipeline-1.0.1.gem
Fetching multipart-post-2.1.1.gem
Fetching faraday_middleware-0.14.0.gem
...
Successfully installed websocket-1.2.8
Successfully installed pusher-client-0.6.2
Successfully installed travis-1.8.10
17 gems installed
#

# travis login
We need your GitHub login to identify you.
This information will not be sent to Travis CI, only to api.github.com.
The password will not be displayed.

Try running with --github-token or --auto if you don't want to enter your password anyway.

Username: cburkins
Password for cburkins: ********
Successfully logged in as cburkins!
#

# travis encrypt-file udemy-k8s-01-28ee42cd1afb.json -r cburkins/udemy-k8s-part5-k8sProduction
encrypting udemy-k8s-01-28ee42cd1afb.json for cburkins/udemy-k8s-part5-k8sProduction
storing result as udemy-k8s-01-28ee42cd1afb.json.enc
storing secure env variables for decryption

Please add the following to your build script (before_install stage in your .travis.yml, for instance):

    openssl aes-256-cbc -K $encrypted_0c35eebf403c_key -iv $encrypted_0c35eebf403c_iv -in udemy-k8s-01-28ee42cd1afb.json.enc -out udemy-k8s-01-28ee42cd1afb.json -d

Pro Tip: You can add it automatically by running with --add.

Make sure to add udemy-k8s-01-28ee42cd1afb.json.enc to the git repository.
Make sure not to add udemy-k8s-01-28ee42cd1afb.json to the git repository.
Commit all changes to your .travis.yml.
#

```

## Helm

Helm is a way to manage 3rd party tools inside your cluster

1. Helm Client
1. Tiller Server (which runs inside our kubernetes cluster)

## Installing Helm

Reference: https://helm.sh/docs/intro/install/#from-script

Install Helm v3 & configure repo

```
$ curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  6617  100  6617    0     0  46316      0 --:--:-- --:--:-- --:--:-- 46598
Error: could not find tiller
Helm v3.0.3 is available. Changing from version .
Downloading https://get.helm.sh/helm-v3.0.3-linux-amd64.tar.gz
Preparing to install helm into /usr/local/bin
helm installed into /usr/local/bin/helm

$ helm repo add stable https://kubernetes-charts.storage.googleapis.com/
"stable" has been added to your repositories

```

List available installs

```
$ helm search repo stable
NAME                                    CHART VERSION   APP VERSION             DESCRIPTION
stable/acs-engine-autoscaler            2.2.2           2.1.1                   DEPRECATED Scales worker nodes within agent pools
stable/aerospike                        0.3.2           v4.5.0.5                A Helm chart for Aerospike in Kubernetes
stable/airflow                          5.2.5           1.10.4                  Airflow is a platform to programmatically autho...
stable/ambassador                       5.3.0           0.86.1                  A Helm chart for Datawire Ambassador
...and many more
```

See what has been released using Helm

```
helm ls
```

```
$ curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
$ chmod 700 ./get-helm-3
$ ./get-helm-3

$ helm install my-nginx stable/nginx-ingress --set rbac.create=true



$ kubectl --namespace default get services -o wide -w my-nginx-nginx-ingress-controller
NAME                                TYPE           CLUSTER-IP   EXTERNAL-IP   PORT(S)                      AGE   SELECTOR
my-nginx-nginx-ingress-controller   LoadBalancer   10.0.6.54    <pending>     80:32578/TCP,443:32242/TCP   42s   app=nginx-ingress,component=controller,relea
se=my-nginx
my-nginx-nginx-ingress-controller   LoadBalancer   10.0.6.54   35.231.99.178   80:32578/TCP,443:32242/TCP   47s   app=nginx-ingress,component=controller,rele
ase=my-nginx

```

Verify IP Addresses

![image](https://user-images.githubusercontent.com/9342308/73384896-2c121200-429a-11ea-9d35-624819ada6ef.png)

Click on the "Port 80" address, and you should see this (ingress will show this page when it doesn't have a matching route)

![image](https://user-images.githubusercontent.com/9342308/73385027-5ebc0a80-429a-11ea-9acd-67fe776066fb.png)

After pushing our completed deployment package into Github, now we can see both the external IP addresses plus the routes

![image](https://user-images.githubusercontent.com/9342308/73387002-d3447880-429d-11ea-9ec8-a5df52211acd.png)
