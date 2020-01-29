
# Build production docker images
# "latest" tag is handy in case somebody manually deploys images with kubectl
# $SHA is the current git commit tag, and will be used below to force kubectl to overwrite the currently running image
# $SHA comes from .travis.yml (who is calling this script)
docker build -t cburkins/multi-client:latest -t cburkins/multi-client:$SHA -f ./03-k8s-production-googlecloud/client/Dockerfile ./03-k8s-production-googlecloud/client
docker build -t cburkins/multi-server:latest -t cburkins/multi-server:$SHA -f ./03-k8s-production-googlecloud/server/Dockerfile ./03-k8s-production-googlecloud/server
docker build -t cburkins/multi-worker:latest -t cburkins/multi-worker:$SHA -f ./03-k8s-production-googlecloud/worker/Dockerfile ./03-k8s-production-googlecloud/worker

# Push images to DockerHub (we're already logged in via .travis.yaml config)
docker push cburkins/multi-client:latest
docker push cburkins/multi-server:latest
docker push cburkins/multi-worker:latest
# Apparently we have to push each tag that we created (even though it's the same image ?)
docker push cburkins/multi-client:$SHA
docker push cburkins/multi-server:$SHA
docker push cburkins/multi-worker:$SHA

# Kubectl is already configured (in .travis.yaml config)
kubectl apply -f ./03-k8s-production-googlecloud/k8s

# Using imperative (not declarative) command, tell kubernetes to set the image using our updated image
# Can't rely on "latest" tag because k8s will see no update, as it's already running "latest" tag
# kubectl set image [deploymentName] [containNameInThatDeployment]=[DockerHubImageName]
kubectl set image deployments/client-deployment client=cburkins/multi-client:$SHA
kubectl set image deployments/server-deployment server=cburkins/multi-server:$SHA
kubectl set image deployments/worker-deployment worker=cburkins/multi-worker:$SHA
