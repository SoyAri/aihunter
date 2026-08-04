# Despliegue de AIHunter en Docker Swarm

La aplicación se publica como un servicio `aihunter_frontend` con cuatro réplicas,
balanceo por la red ingress y reinicio automático. Los comandos `docker node`,
`docker service` y `docker stack` se ejecutan desde un manager.

## 1. Conectar los nodos

En el manager inicial:

```bash
docker swarm init --advertise-addr IP_DEL_MANAGER
docker swarm join-token manager
```

Ejecutar en cada una de las otras tres laptops el comando que muestre la segunda
instrucción. Después, comprobar desde el manager:

```bash
docker node ls
```

Los nodos necesitan comunicarse por `2377/tcp`, `7946/tcp+udp` y `4789/udp`.

## 2. Publicar la imagen

Definir una imagen de Docker Hub accesible por los tres nodos:

```bash
export AIHUNTER_IMAGE="USUARIO_DOCKERHUB/aihunter:1.0"
docker login
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "$AIHUNTER_IMAGE" \
  --push \
  .
```

La compilación multi-arquitectura permite mezclar una Mac con Apple Silicon y
laptops Intel/AMD. Si todas usan la misma arquitectura, también puede emplearse
`docker build`, seguido por `docker push`.

## 3. Desplegar

Manteniendo `AIHUNTER_IMAGE` definida en la misma terminal:

```bash
docker stack deploy \
  --with-registry-auth \
  --compose-file compose.swarm.yml \
  aihunter
```

Comprobar el servicio y la ubicación de las réplicas:

```bash
docker stack services aihunter
docker service ps aihunter_frontend
```

La aplicación queda disponible en el puerto `8080` de cualquiera de los cuatro
nodos: `http://IP_DE_UN_NODO:8080`.

## 4. Probar recuperación

```bash
docker node update --availability drain NOMBRE_DEL_NODO
docker service ps aihunter_frontend
docker node update --availability active NOMBRE_DEL_NODO
```

Al poner un nodo en `drain`, Swarm debe conservar las cuatro réplicas reubicando
la tarea en alguno de los otros nodos.

## Actualizar la aplicación

Publicar una etiqueta nueva y volver a desplegar:

```bash
export AIHUNTER_IMAGE="USUARIO_DOCKERHUB/aihunter:1.1"
docker buildx build --platform linux/amd64,linux/arm64 --tag "$AIHUNTER_IMAGE" --push .
docker stack deploy --with-registry-auth --compose-file compose.swarm.yml aihunter
```

La actualización se realiza de una réplica a la vez y revierte automáticamente
si la nueva tarea no se mantiene saludable.
