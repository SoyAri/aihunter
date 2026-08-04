# Despliegue de AIHunter en Docker Swarm

La aplicación se publica como un servicio `aihunter_frontend` con tres réplicas,
balanceo por la red ingress y reinicio automático. Los comandos `docker node`,
`docker service` y `docker stack` se ejecutan desde un manager.

## 1. Conectar los nodos

La topología de esta práctica es:

```text
172.20.10.13  manager
172.20.10.5   worker
172.20.10.2   worker
```

En PowerShell del manager:

```powershell
docker swarm init --advertise-addr 172.20.10.13 --data-path-addr 172.20.10.13
docker swarm join-token worker
```

En `172.20.10.5`, sustituir `TOKEN_WORKER` por el token mostrado:

```powershell
docker swarm join --token TOKEN_WORKER --advertise-addr 172.20.10.5 --data-path-addr 172.20.10.5 172.20.10.13:2377
```

En `172.20.10.2`:

```powershell
docker swarm join --token TOKEN_WORKER --advertise-addr 172.20.10.2 --data-path-addr 172.20.10.2 172.20.10.13:2377
```

Después, comprobar desde el manager:

```powershell
docker node ls
```

Los nodos necesitan comunicarse por `2377/tcp`, `7946/tcp+udp` y `4789/udp`.

## 2. Publicar la imagen

Definir una imagen de Docker Hub accesible por los tres nodos:

```powershell
$env:AIHUNTER_IMAGE="USUARIO_DOCKERHUB/aihunter:1.0"
docker login
docker build --tag $env:AIHUNTER_IMAGE .
docker push $env:AIHUNTER_IMAGE
```

Los workers no necesitan compilar la aplicación; Swarm descarga la imagen
publicada cuando programa una réplica en cada nodo.

## 3. Desplegar

Manteniendo `AIHUNTER_IMAGE` definida en la misma terminal:

```powershell
docker stack deploy --with-registry-auth --compose-file compose.swarm.yml aihunter
```

Comprobar el servicio y la ubicación de las réplicas:

```powershell
docker stack services aihunter
docker service ps aihunter_frontend
```

La aplicación queda disponible en el puerto `8080` de cualquiera de los tres
nodos: `http://IP_DE_UN_NODO:8080`.

## 4. Probar recuperación

```powershell
docker node update --availability drain NOMBRE_DEL_NODO
docker service ps aihunter_frontend
docker node update --availability active NOMBRE_DEL_NODO
```

Al poner un nodo en `drain`, Swarm debe conservar las tres réplicas reubicando
la tarea en alguno de los otros nodos.

## Actualizar la aplicación

Publicar una etiqueta nueva y volver a desplegar:

```powershell
$env:AIHUNTER_IMAGE="USUARIO_DOCKERHUB/aihunter:1.1"
docker build --tag $env:AIHUNTER_IMAGE .
docker push $env:AIHUNTER_IMAGE
docker stack deploy --with-registry-auth --compose-file compose.swarm.yml aihunter
```

La actualización se realiza de una réplica a la vez y revierte automáticamente
si la nueva tarea no se mantiene saludable.
