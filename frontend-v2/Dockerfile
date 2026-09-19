# ETAPA 1: Construir o site React
# Usamos o Node apenas para "compilar" o código
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Se o seu comando de build for diferente, altere a linha abaixo (ex: npm run build)
RUN npm run build 

# ETAPA 2: Servir o site com NGINX
# Pegamos um NGINX limpo e copiamos apenas os arquivos finais do React para ele
FROM nginx:alpine
# Copiamos a nossa configuração que criamos no Passo 1
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos os arquivos compilados do React
COPY --from=build /app/build /usr/share/nginx/html
# (Nota: se você usar Vite em vez de Create React App, troque /app/build por /app/dist)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]