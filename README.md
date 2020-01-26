# Part 5 : Udemy Course on Kubernetes (Stephen Grider)

## Background

-   Part 4: Created our first kubernetes configuration, fairly simple
-   **Part 5: More complex kubernetes deployment, ready for production**

## Architecture Overview

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
